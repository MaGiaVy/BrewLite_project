import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { OrdersService } from './orders.service.js';
import { VouchersService } from '../vouchers/vouchers.service.js';

describe('Order Idempotency - Tiêu chí kiểm thử (b): Gửi 2 lần cùng Idempotency-Key chỉ tạo 1 đơn', () => {
  let prisma: PrismaClient;
  let ordersService: OrdersService;
  let vouchersService: VouchersService;
  let testUserId: string;
  let testProductId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    vouchersService = new VouchersService(prisma as any);
    ordersService = new OrdersService(prisma as any, vouchersService);

    // Lấy user demo và product demo
    const user = await prisma.user.findFirst();
    testUserId = user?.id || '';

    const product = await prisma.product.findFirst({ where: { stock: { gte: 5 } } });
    testProductId = product?.id || '';
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('gửi 2 lần cùng Idempotency-Key chỉ tạo đúng 1 đơn hàng và trả về cùng orderId', async () => {
    const idempotencyKey = `idempotency-test-${Date.now()}`;

    const orderPayload = {
      items: [
        {
          productId: testProductId,
          size: 'S' as const,
          quantity: 1,
        },
      ],
    };

    // Lần gọi 1
    const order1 = await ordersService.createOrder(testUserId, idempotencyKey, orderPayload);
    expect(order1).toBeDefined();
    expect(order1.id).toBeDefined();

    // Lần gọi 2 với CÙNG idempotencyKey
    const order2 = await ordersService.createOrder(testUserId, idempotencyKey, orderPayload);
    expect(order2).toBeDefined();

    // KIỂM CHỨNG:
    // 1. Mã đơn của 2 lần phải hoàn toàn trùng khớp
    expect(order2.id).toBe(order1.id);

    // 2. Lần 2 được đánh dấu là replay idempotent
    expect((order2 as any).isIdempotentReplay).toBe(true);

    // 3. Trong database chỉ tồn tại đúng 1 bản ghi
    const countInDb = await prisma.order.count({
      where: {
        userId: testUserId,
        idempotencyKey,
      },
    });
    expect(countInDb).toBe(1);
  });
});
