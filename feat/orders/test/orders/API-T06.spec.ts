import { describe, expect, it, vi } from 'vitest';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { PaymentsService } from '../../src/payments/payments.service.js';

describe('API-T06 — loyalty points', () => {
  it('adds one point per 1,000 VND after successful payment', async () => {
    const userUpdate = vi.fn().mockResolvedValue({});
    const prisma: any = {
      payment: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({
        id: 9, orderId: 10, amount: 90000, method: PaymentMethod.EWALLET, status: PaymentStatus.SUCCESS,
      }) },
      order: {
        findUnique: vi.fn().mockResolvedValue({
          id: 10,
          userId: 3,
          totalAmount: 90000,
          status: OrderStatus.PENDING,
          version: 0,
          createdAt: new Date(),
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      user: { update: userUpdate },
      $transaction: vi.fn((callback: any) => callback(prisma)),
    };
    const payment = {
      processPayment: vi.fn().mockResolvedValue({
        success: true,
        transactionId: 'TXN-POINTS',
        message: 'Thành công',
      }),
    };

    const result = await new PaymentsService(prisma, payment as any, {} as any).processPayment(
      { orderId: 10, method: PaymentMethod.EWALLET },
      3,
    );

    expect(result.pointsEarned).toBe(90);
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { loyaltyPoints: { increment: 90 } },
    });
  });
});
