import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service.js';
import { VouchersService } from '../vouchers/vouchers.service.js';

describe('BOM Recipe Inventory Tracking (Mức độ 2 - Quản lý kho theo công thức & nguyên vật liệu)', () => {
  let prisma: PrismaClient;
  let ordersService: OrdersService;
  let vouchersService: VouchersService;
  let testUserId: string;

  let robustaIng: any;
  let condensedMilkIng: any;
  let arabicaIng: any;
  let cupIng: any;
  let testDrink: any;
  let testTopping: any;

  beforeAll(async () => {
    prisma = new PrismaClient();
    vouchersService = new VouchersService(prisma as any);
    ordersService = new OrdersService(prisma as any, vouchersService);

    const user = await prisma.user.findFirst();
    testUserId = user?.id || '';

    // Tạo nguyên vật liệu kho thử nghiệm riêng biệt cho test suite
    robustaIng = await prisma.ingredient.create({
      data: {
        name: `Robusta Test BOM ${Date.now()}`,
        stock: 1000, // 1000g
        unit: 'g',
        version: 0,
      },
    });

    condensedMilkIng = await prisma.ingredient.create({
      data: {
        name: `Sữa Đặc Test BOM ${Date.now()}`,
        stock: 1000, // 1000ml
        unit: 'ml',
        version: 0,
      },
    });

    arabicaIng = await prisma.ingredient.create({
      data: {
        name: `Arabica Topping Test ${Date.now()}`,
        stock: 500, // 500g
        unit: 'g',
        version: 0,
      },
    });

    cupIng = await prisma.ingredient.create({
      data: {
        name: `Ly Giấy Test BOM ${Date.now()}`,
        stock: 100, // 100 cái
        unit: 'cái',
        version: 0,
      },
    });

    // Tạo món đồ uống thử nghiệm
    testDrink = await prisma.product.create({
      data: {
        name: `Cà Phê Sữa Test BOM ${Date.now()}`,
        category: 'COFFEE_VN',
        price: 35000,
        stock: 100,
        version: 0,
        imageUrl: 'https://example.com/bom-test.jpg',
        description: 'Món thử nghiệm BOM Recipe',
      },
    });

    // Tạo công thức (BOM Recipe) cho món đồ uống:
    // Size S: 25g Robusta, 40ml Sữa đặc, 1 Ly giấy
    await prisma.productRecipe.createMany({
      data: [
        { productId: testDrink.id, ingredientId: robustaIng.id, amount: 25 },
        { productId: testDrink.id, ingredientId: condensedMilkIng.id, amount: 40 },
        { productId: testDrink.id, ingredientId: cupIng.id, amount: 1 },
      ],
    });

    // Tạo Topping thử nghiệm liên kết nguyên liệu Arabica: 18g mỗi phần
    testTopping = await prisma.topping.create({
      data: {
        name: `Shot Test ${Date.now()}`,
        price: 15000,
        isAvailable: true,
        ingredientId: arabicaIng.id,
        amountPerPortion: 18,
      },
    });
  });

  afterAll(async () => {
    // Dọn dẹp bản ghi test
    if (testDrink?.id) {
      await prisma.orderItemTopping.deleteMany({
        where: { orderItem: { productId: testDrink.id } },
      });
      await prisma.orderItem.deleteMany({ where: { productId: testDrink.id } });
      await prisma.productRecipe.deleteMany({ where: { productId: testDrink.id } });
      await prisma.product.delete({ where: { id: testDrink.id } }).catch(() => {});
    }

    if (testTopping?.id) {
      await prisma.topping.delete({ where: { id: testTopping.id } }).catch(() => {});
    }

    const testIngIds = [robustaIng?.id, condensedMilkIng?.id, arabicaIng?.id, cupIng?.id].filter(Boolean);
    if (testIngIds.length > 0) {
      await prisma.ingredient.deleteMany({ where: { id: { in: testIngIds } } });
    }

    await prisma.$disconnect();
  });

  it('1. Đặt món Size S: trừ đúng định lượng chuẩn của từng nguyên liệu cấu thành (25g Robusta, 40ml Sữa đặc, 1 Ly giấy)', async () => {
    const robustaBefore = (await prisma.ingredient.findUnique({ where: { id: robustaIng.id } }))!.stock;
    const milkBefore = (await prisma.ingredient.findUnique({ where: { id: condensedMilkIng.id } }))!.stock;
    const cupBefore = (await prisma.ingredient.findUnique({ where: { id: cupIng.id } }))!.stock;

    const orderKey = `bom-order-size-s-${Date.now()}`;
    const order = await ordersService.createOrder(testUserId, orderKey, {
      items: [
        {
          productId: testDrink.id,
          size: 'S',
          quantity: 1,
        },
      ],
    });

    expect(order).toBeDefined();
    expect(order.id).toBeDefined();

    // Kiểm tra định lượng nguyên liệu bị trừ chính xác
    const robustaAfter = (await prisma.ingredient.findUnique({ where: { id: robustaIng.id } }))!.stock;
    const milkAfter = (await prisma.ingredient.findUnique({ where: { id: condensedMilkIng.id } }))!.stock;
    const cupAfter = (await prisma.ingredient.findUnique({ where: { id: cupIng.id } }))!.stock;

    expect(robustaAfter).toBe(robustaBefore - 25);
    expect(milkAfter).toBe(milkBefore - 40);
    expect(cupAfter).toBe(cupBefore - 1);
  });

  it('2. Đặt món Size M & Size L: hệ số nhân định lượng tự động áp dụng (M: 1.3x, L: 1.6x), ly giấy giữ nguyên 1 cái', async () => {
    const robustaBefore = (await prisma.ingredient.findUnique({ where: { id: robustaIng.id } }))!.stock;
    const milkBefore = (await prisma.ingredient.findUnique({ where: { id: condensedMilkIng.id } }))!.stock;
    const cupBefore = (await prisma.ingredient.findUnique({ where: { id: cupIng.id } }))!.stock;

    const orderKey = `bom-order-size-m-${Date.now()}`;
    // Size M: Robusta = round(25 * 1.3) = 33g; Sữa đặc = round(40 * 1.3) = 52ml; Ly = 1 cái
    await ordersService.createOrder(testUserId, orderKey, {
      items: [
        {
          productId: testDrink.id,
          size: 'M',
          quantity: 1,
        },
      ],
    });

    const robustaAfter = (await prisma.ingredient.findUnique({ where: { id: robustaIng.id } }))!.stock;
    const milkAfter = (await prisma.ingredient.findUnique({ where: { id: condensedMilkIng.id } }))!.stock;
    const cupAfter = (await prisma.ingredient.findUnique({ where: { id: cupIng.id } }))!.stock;

    expect(robustaAfter).toBe(robustaBefore - 33);
    expect(milkAfter).toBe(milkBefore - 52);
    expect(cupAfter).toBe(cupBefore - 1);
  });

  it('3. Đặt món có Topping: trừ đồng thời cả nguyên liệu món chính lẫn nguyên liệu của Topping trong 1 giao dịch', async () => {
    const arabicaBefore = (await prisma.ingredient.findUnique({ where: { id: arabicaIng.id } }))!.stock;

    const orderKey = `bom-order-topping-${Date.now()}`;
    await ordersService.createOrder(testUserId, orderKey, {
      items: [
        {
          productId: testDrink.id,
          size: 'S',
          quantity: 2,
          toppingIds: [testTopping.id], // 18g Arabica x 2 ly = 36g
        },
      ],
    });

    const arabicaAfter = (await prisma.ingredient.findUnique({ where: { id: arabicaIng.id } }))!.stock;
    expect(arabicaAfter).toBe(arabicaBefore - 36);
  });

  it('4. Chặn bán vượt kho nguyên liệu (Zero Overselling): từ chối tạo đơn nếu bất kỳ 1 nguyên liệu nào bị thiếu', async () => {
    // Ép tồn kho Sữa đặc về chỉ còn 10ml (không đủ cho 1 ly Size S cần 40ml)
    await prisma.ingredient.update({
      where: { id: condensedMilkIng.id },
      data: { stock: 10 },
    });

    const robustaBefore = (await prisma.ingredient.findUnique({ where: { id: robustaIng.id } }))!.stock;
    const orderKey = `bom-order-out-of-stock-${Date.now()}`;

    await expect(
      ordersService.createOrder(testUserId, orderKey, {
        items: [
          {
            productId: testDrink.id,
            size: 'S',
            quantity: 1,
          },
        ],
      })
    ).rejects.toThrow(/không đủ số lượng tồn kho/);

    // KIỂM CHỨNG TÍNH TOÀN VẸN: Các nguyên liệu khác (Robusta) không bị trừ dở dang (Atomic Rollback)
    const robustaAfter = (await prisma.ingredient.findUnique({ where: { id: robustaIng.id } }))!.stock;
    expect(robustaAfter).toBe(robustaBefore);

    // Khôi phục lại kho sữa đặc
    await prisma.ingredient.update({
      where: { id: condensedMilkIng.id },
      data: { stock: 1000 },
    });
  });

  it('5. Đặt đồng thời nhiều đơn tranh chấp cùng 1 nguyên liệu khan hiếm: Optimistic Locking bảo vệ không bị âm kho', async () => {
    // Đặt tồn kho Robusta chỉ còn đúng 25g (vừa đúng 1 ly Size S)
    await prisma.ingredient.update({
      where: { id: robustaIng.id },
      data: { stock: 25, version: 0 },
    });

    const key1 = `bom-concurrent-1-${Date.now()}`;
    const key2 = `bom-concurrent-2-${Date.now()}`;
    const payload = {
      items: [{ productId: testDrink.id, size: 'S' as const, quantity: 1 }],
    };

    const [res1, res2] = await Promise.allSettled([
      ordersService.createOrder(testUserId, key1, payload),
      ordersService.createOrder(testUserId, key2, payload),
    ]);

    const fulfilledCount = [res1, res2].filter((r) => r.status === 'fulfilled').length;
    const rejectedCount = [res1, res2].filter((r) => r.status === 'rejected').length;

    expect(fulfilledCount).toBe(1);
    expect(rejectedCount).toBe(1);

    // Tồn kho Robusta sau cùng phải bằng 0, tuyệt đối không được âm
    const robustaFinal = await prisma.ingredient.findUnique({ where: { id: robustaIng.id } });
    expect(robustaFinal?.stock).toBe(0);

    // Khôi phục lại kho Robusta
    await prisma.ingredient.update({
      where: { id: robustaIng.id },
      data: { stock: 1000 },
    });
  });

  it('6. Hủy đơn hàng (cancelOrder): tự động hoàn trả đầy đủ số lượng nguyên liệu (BOM) đã trừ về kho', async () => {
    const robustaBefore = (await prisma.ingredient.findUnique({ where: { id: robustaIng.id } }))!.stock;
    const milkBefore = (await prisma.ingredient.findUnique({ where: { id: condensedMilkIng.id } }))!.stock;

    const orderKey = `bom-order-to-cancel-${Date.now()}`;
    const order = await ordersService.createOrder(testUserId, orderKey, {
      items: [
        {
          productId: testDrink.id,
          size: 'S',
          quantity: 2, // 25g x 2 = 50g Robusta, 40ml x 2 = 80ml Sữa đặc
        },
      ],
    });

    // Thực hiện hủy đơn hàng
    const cancelledOrder = await ordersService.cancelOrder(order.id, testUserId);
    expect(cancelledOrder.status).toBe(OrderStatus.CANCELLED);

    // Kiểm tra nguyên liệu đã được hoàn trả nguyên vẹn về kho
    const robustaAfterRefund = (await prisma.ingredient.findUnique({ where: { id: robustaIng.id } }))!.stock;
    const milkAfterRefund = (await prisma.ingredient.findUnique({ where: { id: condensedMilkIng.id } }))!.stock;

    expect(robustaAfterRefund).toBe(robustaBefore);
    expect(milkAfterRefund).toBe(milkBefore);
  });
});
