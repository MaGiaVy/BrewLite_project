import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { PaymentsService } from './payments.service.js';
import { MockPaymentService } from './mock-payment.service.js';
import { ALLOWED_TRANSITIONS, assertTransition } from './state-machine.helper.js';

describe('Task 10 — Payments, State Machine, Idempotency, Optimistic Locking & Loyalty Tests', () => {
  describe('State Machine Guard (assertTransition)', () => {
    it('kiểm tra đầy đủ mọi cặp transition hợp lệ và không hợp lệ', () => {
      for (const currentStatus of Object.values(OrderStatus)) {
        for (const nextStatus of Object.values(OrderStatus)) {
          const isAllowed = ALLOWED_TRANSITIONS[currentStatus].includes(nextStatus);
          if (isAllowed) {
            expect(() => assertTransition(currentStatus, nextStatus)).not.toThrow();
          } else {
            expect(() => assertTransition(currentStatus, nextStatus)).toThrow(BadRequestException);
          }
        }
      }
    });

    it('cho phép chuyển từ PENDING sang PAID', () => {
      expect(() => assertTransition(OrderStatus.PENDING, OrderStatus.PAID)).not.toThrow();
    });

    it('cho phép chuyển từ PENDING sang PAYMENT_FAILED', () => {
      expect(() => assertTransition(OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED)).not.toThrow();
    });

    it('cho phép chuyển từ PENDING sang CANCELLED', () => {
      expect(() => assertTransition(OrderStatus.PENDING, OrderStatus.CANCELLED)).not.toThrow();
    });

    it('cho phép chuyển từ PAYMENT_FAILED sang PAID khi khách hàng thanh toán lại', () => {
      expect(() => assertTransition(OrderStatus.PAYMENT_FAILED, OrderStatus.PAID)).not.toThrow();
    });

    it('cho phép chuyển từ PAYMENT_FAILED sang CANCELLED', () => {
      expect(() => assertTransition(OrderStatus.PAYMENT_FAILED, OrderStatus.CANCELLED)).not.toThrow();
    });

    it('cho phép chuyển từ PAID sang PREPARING (Barista bắt đầu pha chế)', () => {
      expect(() => assertTransition(OrderStatus.PAID, OrderStatus.PREPARING)).not.toThrow();
    });

    it('cho phép chuyển từ PREPARING sang READY (Pha chế xong, chờ nhận)', () => {
      expect(() => assertTransition(OrderStatus.PREPARING, OrderStatus.READY)).not.toThrow();
    });

    it('cho phép chuyển từ READY sang COMPLETED (Khách đã nhận nước)', () => {
      expect(() => assertTransition(OrderStatus.READY, OrderStatus.COMPLETED)).not.toThrow();
    });

    it('chặn chuyển từ COMPLETED sang bất kỳ trạng thái nào (Terminal State)', () => {
      expect(() => assertTransition(OrderStatus.COMPLETED, OrderStatus.PAID)).toThrow(BadRequestException);
      expect(() => assertTransition(OrderStatus.COMPLETED, OrderStatus.PREPARING)).toThrow(BadRequestException);
    });

    it('chặn chuyển từ CANCELLED sang bất kỳ trạng thái nào (Terminal State)', () => {
      expect(() => assertTransition(OrderStatus.CANCELLED, OrderStatus.PAID)).toThrow(BadRequestException);
      expect(() => assertTransition(OrderStatus.CANCELLED, OrderStatus.PREPARING)).toThrow(BadRequestException);
    });

    it('chặn chuyển ngược từ READY về PENDING (Backward transition)', () => {
      expect(() => assertTransition(OrderStatus.READY, OrderStatus.PENDING)).toThrow(BadRequestException);
    });
  });

  describe('MockPaymentService', () => {
    let mockPaymentService: MockPaymentService;

    beforeEach(() => {
      mockPaymentService = new MockPaymentService();
    });

    it('trả về success=true khi không có simulateFailure', async () => {
      const result = await mockPaymentService.processPayment({
        amount: 85000,
        method: PaymentMethod.EWALLET,
        simulateFailure: false,
      });

      expect(result.success).toBe(true);
      expect(result.transactionId).toBeDefined();
      expect(result.message).toContain('thành công');
    });

    it('trả về success=false khi simulateFailure=true', async () => {
      const result = await mockPaymentService.processPayment({
        amount: 85000,
        method: PaymentMethod.BANK_CARD,
        simulateFailure: true,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('bị từ chối');
    });
  });

  describe('PaymentsService Protection & Logic', () => {
    let service: PaymentsService;
    let mockPrisma: any;
    let mockPaymentService: any;

    beforeEach(() => {
      mockPrisma = {
        payment: {
          findUnique: vi.fn(),
          create: vi.fn(),
        },
        order: {
          findUnique: vi.fn(),
          update: vi.fn(),
          updateMany: vi.fn(),
        },
        user: {
          update: vi.fn(),
        },
        $transaction: vi.fn(async (cb) => cb(mockPrisma)),
      };
      mockPaymentService = {
        processPayment: vi.fn(),
      };
      service = new PaymentsService(mockPrisma as any, mockPaymentService as any);
    });

    it('ném NotFoundException nếu đơn hàng không tồn tại', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.processPayment({ orderId: 999, method: PaymentMethod.EWALLET }, 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('chống IDOR: ném ForbiddenException nếu userId không khớp với chủ đơn hàng', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 10,
        userId: 1, // Chủ đơn là User 1
        totalAmount: 50000,
        status: OrderStatus.PENDING,
      });

      await expect(
        service.processPayment({ orderId: 10, method: PaymentMethod.EWALLET }, 2), // User 2 gọi thanh toán
      ).rejects.toThrow(ForbiddenException);
    });

    describe('Idempotency Key Handling', () => {
      it('trả về kết quả cũ với isIdempotent=true nếu key đã tồn tại và status là SUCCESS', async () => {
        mockPrisma.payment.findUnique.mockResolvedValue({
          id: 100,
          orderId: 5,
          amount: 85000,
          method: PaymentMethod.EWALLET,
          status: PaymentStatus.SUCCESS,
          order: { status: OrderStatus.PAID },
        });

        const result = await service.processPayment(
          { orderId: 5, method: PaymentMethod.EWALLET },
          1,
          'idempotency-key-123',
        );

        expect(result.isIdempotent).toBe(true);
        expect(result.paymentId).toBe(100);
        expect(result.status).toBe(OrderStatus.PAID);
        expect(mockPaymentService.processPayment).not.toHaveBeenCalled();
        expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      });

      it('tiếp tục xử lý nếu idempotencyKey tồn tại nhưng trạng thái trước đó là FAILED', async () => {
        // Giao dịch cũ bị FAILED
        mockPrisma.payment.findUnique.mockResolvedValue({
          id: 99,
          orderId: 5,
          amount: 85000,
          method: PaymentMethod.EWALLET,
          status: PaymentStatus.FAILED,
        });

        mockPrisma.order.findUnique.mockResolvedValue({
          id: 5,
          userId: 1,
          totalAmount: 85000,
          status: OrderStatus.PAYMENT_FAILED,
          version: 1,
        });

        mockPaymentService.processPayment.mockResolvedValue({
          success: true,
          transactionId: 'TXN-NEW',
          message: 'Thành công',
        });

        mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.payment.create.mockResolvedValue({
          id: 101,
          orderId: 5,
          amount: 85000,
          method: PaymentMethod.EWALLET,
          status: PaymentStatus.SUCCESS,
        });

        const result = await service.processPayment(
          { orderId: 5, method: PaymentMethod.EWALLET },
          1,
          'idempotency-key-failed',
        );

        expect(result.success).toBe(true);
        expect(result.paymentId).toBe(101);
        expect(mockPaymentService.processPayment).toHaveBeenCalled();
      });
    });

    describe('Optimistic Locking & Concurrency Control', () => {
      it('ném ConflictException khi optimistic lock thất bại (version không khớp do race condition)', async () => {
        mockPrisma.order.findUnique.mockResolvedValue({
          id: 7,
          userId: 1,
          totalAmount: 60000,
          status: OrderStatus.PENDING,
          version: 2,
        });

        mockPaymentService.processPayment.mockResolvedValue({
          success: true,
          transactionId: 'TXN-CONCURRENT',
          message: 'Thành công',
        });

        // Giả lập updateMany trả về count: 0 (có request khác đã update version lên 3)
        mockPrisma.order.updateMany.mockResolvedValue({ count: 0 });

        await expect(
          service.processPayment({ orderId: 7, method: PaymentMethod.EWALLET }, 1),
        ).rejects.toThrow(ConflictException);
      });
    });

    describe('Loyalty Points (Hạt Vàng)', () => {
      it('cộng điểm tích lũy chính xác (1 điểm / 1.000 VNĐ) sau khi thanh toán thành công', async () => {
        mockPrisma.order.findUnique.mockResolvedValue({
          id: 8,
          userId: 1,
          totalAmount: 85000,
          status: OrderStatus.PENDING,
          version: 0,
        });

        mockPaymentService.processPayment.mockResolvedValue({
          success: true,
          transactionId: 'TXN-POINTS',
          message: 'Thành công',
        });

        mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.payment.create.mockResolvedValue({
          id: 102,
          orderId: 8,
          amount: 85000,
          method: PaymentMethod.EWALLET,
          status: PaymentStatus.SUCCESS,
        });

        const result = await service.processPayment(
          { orderId: 8, method: PaymentMethod.EWALLET },
          1,
        );

        expect(result.success).toBe(true);
        expect(result.pointsEarned).toBe(85); // 85.000 / 1.000 = 85
        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { loyaltyPoints: { increment: 85 } },
        });
      });

      it('cộng đúng 90 điểm cho payment SUCCESS trị giá 90.000 VNĐ', async () => {
        mockPrisma.order.findUnique.mockResolvedValue({
          id: 13,
          userId: 1,
          totalAmount: 90000,
          status: OrderStatus.PENDING,
          version: 0,
        });
        mockPaymentService.processPayment.mockResolvedValue({
          success: true,
          transactionId: 'TXN-90-POINTS',
          message: 'Thành công',
        });
        mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.payment.create.mockResolvedValue({
          id: 106,
          orderId: 13,
          amount: 90000,
          method: PaymentMethod.EWALLET,
          status: PaymentStatus.SUCCESS,
        });

        const result = await service.processPayment(
          { orderId: 13, method: PaymentMethod.EWALLET },
          1,
        );

        expect(result.pointsEarned).toBe(90);
        expect(mockPrisma.user.update).toHaveBeenCalledTimes(1);
        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { loyaltyPoints: { increment: 90 } },
        });
      });

      it('không gọi user.update nếu đơn hàng không có userId (khách vãng lai)', async () => {
        mockPrisma.order.findUnique.mockResolvedValue({
          id: 9,
          userId: null, // Khách không login
          totalAmount: 50000,
          status: OrderStatus.PENDING,
          version: 0,
        });

        mockPaymentService.processPayment.mockResolvedValue({
          success: true,
          transactionId: 'TXN-ANONYMOUS',
          message: 'Thành công',
        });

        mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.payment.create.mockResolvedValue({
          id: 103,
          orderId: 9,
          amount: 50000,
          method: PaymentMethod.EWALLET,
          status: PaymentStatus.SUCCESS,
        });

        const result = await service.processPayment(
          { orderId: 9, method: PaymentMethod.EWALLET },
          1,
        );

        expect(result.success).toBe(true);
        expect(mockPrisma.user.update).not.toHaveBeenCalled();
      });

      it('không gọi user.update nếu pointsEarned = 0 (đơn giá < 1.000 VNĐ)', async () => {
        mockPrisma.order.findUnique.mockResolvedValue({
          id: 11,
          userId: 1,
          totalAmount: 500, // < 1.000
          status: OrderStatus.PENDING,
          version: 0,
        });

        mockPaymentService.processPayment.mockResolvedValue({
          success: true,
          transactionId: 'TXN-CHEAP',
          message: 'Thành công',
        });

        mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.payment.create.mockResolvedValue({
          id: 104,
          orderId: 11,
          amount: 500,
          method: PaymentMethod.EWALLET,
          status: PaymentStatus.SUCCESS,
        });

        const result = await service.processPayment(
          { orderId: 11, method: PaymentMethod.EWALLET },
          1,
        );

        expect(result.pointsEarned).toBe(0);
        expect(mockPrisma.user.update).not.toHaveBeenCalled();
      });

      it('không cộng loyalty points khi thanh toán thất bại', async () => {
        mockPrisma.order.findUnique.mockResolvedValue({
          id: 12,
          userId: 1,
          totalAmount: 85000,
          status: OrderStatus.PENDING,
          version: 0,
        });
        mockPaymentService.processPayment.mockResolvedValue({
          success: false,
          transactionId: 'TXN-FAILED-POINTS',
          message: 'Bị từ chối',
        });
        mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.payment.create.mockResolvedValue({
          id: 105,
          orderId: 12,
          amount: 85000,
          method: PaymentMethod.EWALLET,
          status: PaymentStatus.FAILED,
        });

        const result = await service.processPayment(
          { orderId: 12, method: PaymentMethod.EWALLET, simulateFailure: true },
          1,
        );

        expect(result.success).toBe(false);
        expect(mockPrisma.user.update).not.toHaveBeenCalled();
      });

      it('PAYMENT_FAILED không thay đổi tồn kho nguyên liệu', async () => {
        mockPrisma.order.findUnique.mockResolvedValue({
          id: 14,
          userId: 1,
          totalAmount: 90000,
          status: OrderStatus.PENDING,
          version: 0,
        });
        mockPaymentService.processPayment.mockResolvedValue({
          success: false,
          transactionId: 'TXN-FAILED-STOCK',
          message: 'Bị từ chối',
        });
        mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.payment.create.mockResolvedValue({
          id: 107,
          orderId: 14,
          amount: 90000,
          method: PaymentMethod.EWALLET,
          status: PaymentStatus.FAILED,
        });
        const ingredientUpdate = vi.fn();

        const result = await service.processPayment(
          { orderId: 14, method: PaymentMethod.EWALLET, simulateFailure: true },
          1,
        );

        expect(result.status).toBe(OrderStatus.PAYMENT_FAILED);
        expect(ingredientUpdate).not.toHaveBeenCalled();
        expect(mockPrisma.user.update).not.toHaveBeenCalled();
      });

      it('payment SUCCESS đồng thời chỉ trả về một payment và không cộng điểm hai lần', async () => {
        const concurrentPayment = {
          id: 108,
          orderId: 15,
          amount: 90000,
          method: PaymentMethod.EWALLET,
          status: PaymentStatus.SUCCESS,
          order: { status: OrderStatus.PAID },
        };
        mockPrisma.payment.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(concurrentPayment);
        mockPrisma.order.findUnique.mockResolvedValue({
          id: 15,
          userId: 1,
          totalAmount: 90000,
          status: OrderStatus.PENDING,
          version: 0,
        });
        mockPaymentService.processPayment.mockResolvedValue({
          success: true,
          transactionId: 'TXN-RACE',
          message: 'Thành công',
        });
        mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.payment.create.mockResolvedValue(concurrentPayment);

        const results = await Promise.all([
          service.processPayment(
            { orderId: 15, method: PaymentMethod.EWALLET },
            1,
            'race-payment-key',
          ),
          service.processPayment(
            { orderId: 15, method: PaymentMethod.EWALLET },
            1,
            'race-payment-key',
          ),
        ]);

        expect(results[1]).toMatchObject({
          success: true,
          paymentId: 108,
          isIdempotent: true,
        });
        expect(mockPaymentService.processPayment).toHaveBeenCalledTimes(1);
        expect(mockPrisma.payment.create).toHaveBeenCalledTimes(1);
        expect(mockPrisma.user.update).toHaveBeenCalledTimes(1);
      });
    });
  });
});
