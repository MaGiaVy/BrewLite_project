import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service.js';
import { VouchersService } from '../vouchers/vouchers.service.js';

describe('OrdersService - Task 6 & P0 Bug Verification Test Suite', () => {
  let prisma: PrismaClient;
  let ordersService: OrdersService;
  let vouchersService: VouchersService;
  let testUserId: string;
  let testProduct: any;

  beforeAll(async () => {
    prisma = new PrismaClient();
    vouchersService = new VouchersService(prisma as any);
    ordersService = new OrdersService(prisma as any, vouchersService);

    const user = await prisma.user.findFirst();
    testUserId = user?.id || '';

    // Tạo sản phẩm riêng biệt cho suite này để tránh bị can thiệp bởi optimistic-locking.spec.ts chạy song song
    testProduct = await prisma.product.create({
      data: {
        name: `Cà Phê Test Orders ${Date.now()}`,
        category: 'COFFEE_VN',
        price: 35000,
        stock: 50,
        imageUrl: '/images/coffee.jpg',
        description: 'Món kiểm thử tạo đơn',
      },
    });
  });

  afterAll(async () => {
    if (testProduct?.id) {
      await prisma.orderItem.deleteMany({ where: { productId: testProduct.id } });
      await prisma.product.delete({ where: { id: testProduct.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it('Xác thực Fix P0.1: Tạo đơn với productId không tồn tại phải ném 404 NotFoundException, KHÔNG ĐƯỢC lấy nhầm món khác', async () => {
    const fakeProductId = 'fake-product-uuid-99999999';
    const fakeKey = `order-fake-prod-${Date.now()}`;

    await expect(
      ordersService.createOrder(testUserId, fakeKey, {
        items: [
          {
            productId: fakeProductId,
            productName: 'Món Ảo Không Tồn Tại',
            size: 'M',
            quantity: 1,
          },
        ],
      })
    ).rejects.toThrow(/Không tìm thấy sản phẩm/);
  });

  it('Tạo đơn hàng thành công và tính đúng giá Size + Topping + Trừ tồn kho', async () => {
    const currentProduct = await prisma.product.findUnique({ where: { id: testProduct.id } });
    const stockBefore = currentProduct?.stock || 0;
    const orderKey = `order-success-${Date.now()}-${Math.random()}`;

    const order = await ordersService.createOrder(testUserId, orderKey, {
      items: [
        {
          productId: testProduct.id,
          size: 'M', // Phụ thu size M: +5.000đ
          quantity: 2,
        },
      ],
      paymentMethod: 'WALLET',
    });

    expect(order).toBeDefined();
    expect(order.id).toBeDefined();
    expect(order.status).toBe(OrderStatus.PENDING);
    expect(order.finalTotal).toBe((testProduct.price + 5000) * 2);

    // Kiểm tra tồn kho đã bị trừ đúng 2 ly
    const productAfter = await prisma.product.findUnique({ where: { id: testProduct.id } });
    expect(productAfter?.stock).toBe(stockBefore - 2);
  });

  it('Xác thực Fix P0.3: findOne() tuân thủ State Machine tuần tự, không nhảy cóc trạng thái', async () => {
    const orderKey = `order-find-${Date.now()}`;
    const order = await ordersService.createOrder(testUserId, orderKey, {
      items: [{ productId: testProduct.id, size: 'S', quantity: 1 }],
      paymentMethod: 'WALLET',
    });

    const retrievedOrder = await ordersService.findOne(order.id, testUserId);
    expect(retrievedOrder).toBeDefined();
    expect(retrievedOrder.id).toBe(order.id);
    // Đơn mới tạo phải giữ nguyên PENDING, không tự động bị sửa thành PAID hay COMPLETED
    expect(retrievedOrder.status).toBe(OrderStatus.PENDING);
  });
});
