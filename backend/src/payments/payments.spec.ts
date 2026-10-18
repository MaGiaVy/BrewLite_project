import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { PrismaClient, OrderStatus, PaymentStatus } from '@prisma/client';
import { PaymentsService } from './payments.service.js';
import { OrdersService } from '../orders/orders.service.js';
import { VouchersService } from '../vouchers/vouchers.service.js';

describe('PaymentsService - Task 8 & Task 10 Test Suite', () => {
  let prisma: PrismaClient;
  let paymentsService: PaymentsService;
  let ordersService: OrdersService;
  let vouchersService: VouchersService;
  let testUserId: string;
  let otherUserId: string;
  let testProductId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    paymentsService = new PaymentsService(prisma as any);
    vouchersService = new VouchersService(prisma as any);
    ordersService = new OrdersService(prisma as any, vouchersService);

    // Lấy hoặc tạo user test
    const users = await prisma.user.findMany({ take: 2 });
    testUserId = users[0]?.id;
    otherUserId = users[1]?.id || 'other-user-mock-id';

    const product = await prisma.product.findFirst({ where: { stock: { gte: 10 } } });
    testProductId = product?.id || '';
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('POST /payments Idempotency: Gửi 2 lần cùng Idempotency-Key chỉ thanh toán 1 lần và trả về Replay', async () => {
    // 1. Tạo đơn hàng mới
    const orderKey = `order-pay-idem-${Date.now()}`;
    const order = await ordersService.createOrder(testUserId, orderKey, {
      items: [{ productId: testProductId, size: 'S', quantity: 1 }],
      paymentMethod: 'WALLET',
    });

    const paymentKey = `pay-key-idem-${Date.now()}`;

    // 2. Thanh toán lần 1 (forceSuccess = true)
    const pay1 = await paymentsService.processPayment(testUserId, paymentKey, {
      orderId: order.id,
      amount: order.finalTotal,
      method: 'WALLET',
      forceSuccess: true,
    });
    expect(pay1.data.status).toBe('SUCCESS');
    expect(pay1.data.orderStatus).toBe(OrderStatus.PAID);

    // 3. Thanh toán lần 2 với CÙNG paymentKey
    const pay2 = await paymentsService.processPayment(testUserId, paymentKey, {
      orderId: order.id,
      amount: order.finalTotal,
      method: 'WALLET',
      forceSuccess: true,
    });
    expect(pay2.data.status).toBe('SUCCESS');
    expect(pay2.message).toContain('Idempotent replay');
    expect(pay2.data.paymentId).toBe(pay1.data.paymentId);

    // 4. Kiểm tra trong DB chỉ có đúng 1 bản ghi thanh toán
    const count = await prisma.payment.count({
      where: { idempotencyKey: paymentKey },
    });
    expect(count).toBe(1);
  });

  it('Payment Retry (Fix P0.2): Đơn bị PAYMENT_FAILED có thể thanh toán lại thành công sang PAID', async () => {
    // 1. Tạo đơn hàng mới
    const orderKey = `order-retry-${Date.now()}`;
    const order = await ordersService.createOrder(testUserId, orderKey, {
      items: [{ productId: testProductId, size: 'S', quantity: 1 }],
      paymentMethod: 'WALLET',
    });

    // 2. Mô phỏng thanh toán thất bại (forceSuccess = false)
    const failKey = `pay-fail-${Date.now()}`;
    const failRes = await paymentsService.processPayment(testUserId, failKey, {
      orderId: order.id,
      amount: order.finalTotal,
      method: 'WALLET',
      forceSuccess: false,
    });
    expect(failRes.data.status).toBe('FAILURE');
    expect(failRes.data.orderStatus).toBe(OrderStatus.PAYMENT_FAILED);

    // Xác nhận trạng thái đơn trong DB là PAYMENT_FAILED
    const orderAfterFail = await prisma.order.findUnique({ where: { id: order.id } });
    expect(orderAfterFail?.status).toBe(OrderStatus.PAYMENT_FAILED);

    // 3. Khách bấm "Thử lại thanh toán" với mã thanh toán mới -> Chuyển thành công sang PAID
    const retryKey = `pay-retry-success-${Date.now()}`;
    const retryRes = await paymentsService.processPayment(testUserId, retryKey, {
      orderId: order.id,
      amount: order.finalTotal,
      method: 'CARD',
      forceSuccess: true,
    });
    expect(retryRes.data.status).toBe('SUCCESS');
    expect(retryRes.data.orderStatus).toBe(OrderStatus.PAID);

    // Xác nhận trạng thái đơn trong DB đã cập nhật sang PAID
    const orderAfterRetry = await prisma.order.findUnique({ where: { id: order.id } });
    expect(orderAfterRetry?.status).toBe(OrderStatus.PAID);
  });

  it('Quyền sở hữu (Fix P0.2): Không cho phép người dùng khác thanh toán đơn hàng không thuộc về mình (403 Forbidden)', async () => {
    const orderKey = `order-auth-${Date.now()}`;
    const order = await ordersService.createOrder(testUserId, orderKey, {
      items: [{ productId: testProductId, size: 'S', quantity: 1 }],
      paymentMethod: 'WALLET',
    });

    const foreignKey = `pay-foreign-${Date.now()}`;
    await expect(
      paymentsService.processPayment('attacker-user-id-999', foreignKey, {
        orderId: order.id,
        amount: order.finalTotal,
        method: 'WALLET',
        forceSuccess: true,
      })
    ).rejects.toThrow(/Bạn không có quyền thanh toán/);
  });

  it('Bảo toàn giá trị: Gửi số tiền không khớp giá trị đơn hàng ném lỗi 400 BadRequestException', async () => {
    const orderKey = `order-amt-${Date.now()}`;
    const order = await ordersService.createOrder(testUserId, orderKey, {
      items: [{ productId: testProductId, size: 'S', quantity: 1 }],
      paymentMethod: 'WALLET',
    });

    const amtKey = `pay-amt-${Date.now()}`;
    await expect(
      paymentsService.processPayment(testUserId, amtKey, {
        orderId: order.id,
        amount: order.finalTotal + 50000, // Số tiền cố tình gửi sai
        method: 'WALLET',
        forceSuccess: true,
      })
    ).rejects.toThrow(/không khớp với giá trị đơn hàng/);
  });
});
