import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { OrdersService } from './orders.service.js';
import { VouchersService } from '../vouchers/vouchers.service.js';

describe('Optimistic Locking - Tiêu chí kiểm thử (c): Đặt đồng thời không vượt tồn kho', () => {
  let prisma: PrismaClient;
  let ordersService: OrdersService;
  let vouchersService: VouchersService;
  let testUserId: string;
  let limitedProductId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    vouchersService = new VouchersService(prisma as any);
    ordersService = new OrdersService(prisma as any, vouchersService);

    const user = await prisma.user.findFirst();
    testUserId = user?.id || '';

    // Tạo sản phẩm đặc biệt có số lượng tồn kho đúng bằng 1 để thử nghiệm tranh chấp
    const testProduct = await prisma.product.create({
      data: {
        name: `Cà Phê Thử Nghiệm Concurrency ${Date.now()}`,
        category: 'COFFEE_VN',
        price: 35000,
        stock: 1, // CHỈ CÒN DUY NHẤT 1 LY
        version: 0,
        imageUrl: 'https://example.com/test.jpg',
        description: 'Sản phẩm phục vụ concurrency test',
      },
    });
    limitedProductId = testProduct.id;
  });

  afterAll(async () => {
    // Dọn dẹp bản ghi test
    if (limitedProductId) {
      await prisma.orderItem.deleteMany({ where: { productId: limitedProductId } });
      await prisma.product.deleteMany({ where: { id: limitedProductId } });
    }
    await prisma.$disconnect();
  });

  it('khi 2 yêu cầu đặt hàng đồng thời gửi đến sản phẩm chỉ còn 1 ly, chỉ 1 đơn thành công và tồn kho không bị âm', async () => {
    const key1 = `concurrent-key-1-${Date.now()}`;
    const key2 = `concurrent-key-2-${Date.now()}`;

    const payload = {
      items: [
        {
          productId: limitedProductId,
          size: 'S' as const,
          quantity: 1,
        },
      ],
    };

    // Bắn 2 request đặt hàng ĐỒNG THỜI
    const [result1, result2] = await Promise.allSettled([
      ordersService.createOrder(testUserId, key1, payload),
      ordersService.createOrder(testUserId, key2, payload),
    ]);

    // KIỂM CHỨNG:
    // 1. Phải có ít nhất 1 thành công và 1 thất bại
    const fulfilledCount = [result1, result2].filter((r) => r.status === 'fulfilled').length;
    const rejectedCount = [result1, result2].filter((r) => r.status === 'rejected').length;

    expect(fulfilledCount).toBe(1);
    expect(rejectedCount).toBe(1);

    // 2. Tồn kho sau cùng trong CSDL phải bằng 0 (không bao giờ bị âm -1)
    const productAfter = await prisma.product.findUnique({
      where: { id: limitedProductId },
    });
    expect(productAfter?.stock).toBe(0);
  });
});
