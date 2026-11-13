import { OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';

describe('API-T04 — order pricing & BOM optimistic locking', () => {
  it('calculates product, size and deduplicated toppings price server-side with 0% VAT', async () => {
    const create = jest.fn().mockImplementation(async ({ data }: any) => ({
      id: 1,
      status: OrderStatus.PENDING,
      ...data,
      items: data.items.create,
    }));
    const prisma: any = {
      order: { count: jest.fn().mockResolvedValue(0) },
      product: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 1,
            name: 'Cà phê',
            basePrice: 45000,
            sizeUpchargeM: 5000,
            sizeUpchargeL: 10000,
            isActive: true,
          },
        ]),
      },
      toppingRecipe: {
        findMany: jest.fn().mockResolvedValue([
          { toppingId: '1', toppingName: 'Trân châu đen', ingredientId: 11, amount: 20, price: 5000, isActive: true, ingredient: { id: 11, code: 'TOP_1A', name: 'Bột trân châu', unit: 'g', isRequiredForSale: true } },
          { toppingId: '1', toppingName: 'Trân châu đen', ingredientId: 12, amount: 10, price: 5000, isActive: true, ingredient: { id: 12, code: 'TOP_1B', name: 'Đường nâu', unit: 'g', isRequiredForSale: true } },
          { toppingId: '2', toppingName: 'Kem cheese', ingredientId: 13, amount: 30, price: 7000, isActive: true, ingredient: { id: 13, code: 'TOP_2', name: 'Kem phô mai', unit: 'ml', isRequiredForSale: true } },
        ]),
      },
      storeSetting: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn((callback: (tx: any) => unknown) => callback({
        recipe: { findMany: jest.fn().mockResolvedValue([]) },
        toppingRecipe: {
          findMany: jest.fn().mockResolvedValue([
            { toppingId: '1', toppingName: 'Trân châu đen', ingredientId: 11, amount: 20, ingredient: { id: 11, code: 'TOP_1A', name: 'Bột trân châu', unit: 'g', isRequiredForSale: true } },
            { toppingId: '1', toppingName: 'Trân châu đen', ingredientId: 12, amount: 10, ingredient: { id: 12, code: 'TOP_1B', name: 'Đường nâu', unit: 'g', isRequiredForSale: true } },
            { toppingId: '2', toppingName: 'Kem cheese', ingredientId: 13, amount: 30, ingredient: { id: 13, code: 'TOP_2', name: 'Kem phô mai', unit: 'ml', isRequiredForSale: true } },
          ]),
        },
        product: { findMany: jest.fn().mockResolvedValue([{ id: 1, category: 'vietnamese' }]) },
        ingredient: {
          findMany: jest.fn().mockResolvedValue([]),
          findUnique: jest.fn().mockImplementation(async ({ where }: any) => ({
            id: where.id,
            name: `Ing ${where.id}`,
            unit: 'g',
            stock: 500,
            version: 0,
            isRequiredForSale: true,
          })),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        inventoryLog: { create: jest.fn().mockResolvedValue({}) },
        order: { create },
      })),
    };

    const result = await new OrdersService(prisma).createOrder(
      {
        items: [{
          productId: 1,
          productName: 'Cà phê',
          size: 'M',
          toppings: ['1', '2'],
          quantity: 2,
          unitPrice: 1,
        }],
      },
      7,
    );

    expect(result.id).toBe(1);
    expect(result.orderId).toBe(1);
    expect(result.totalAmount).toBe(124000);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        totalAmount: 124000,
        items: { create: [expect.objectContaining({ unitPrice: 62000, quantity: 2 })] },
      }),
    }));
  });

  it('retries BOM ingredient stock deduction when the ingredient version changes', async () => {
    const create = jest.fn().mockResolvedValue({
      id: 2,
      status: OrderStatus.PENDING,
      totalAmount: 45000,
      discountCode: null,
      discountAmount: 0,
      items: [],
    });
    const findUnique = jest.fn()
      .mockResolvedValueOnce({ id: 10, name: 'Robusta', unit: 'g', stock: 100, version: 0, isRequiredForSale: true })
      .mockResolvedValueOnce({ id: 10, name: 'Robusta', unit: 'g', stock: 82, version: 1, isRequiredForSale: true });
    const updateMany = jest.fn()
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });
    const prisma: any = {
      order: { count: jest.fn().mockResolvedValue(0) },
      product: {
        findMany: jest.fn().mockResolvedValue([{ id: 1, name: 'Cà phê', basePrice: 45000, sizeUpchargeM: 0, sizeUpchargeL: 5000, isActive: true }]),
      },
      toppingRecipe: { findMany: jest.fn().mockResolvedValue([]) },
      storeSetting: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn((callback: (tx: any) => unknown) => callback({
        recipe: {
          findMany: jest.fn().mockResolvedValue([
            { productId: 1, size: 'S', amount: 18, ingredient: { id: 10, code: 'ING_ROBUSTA', name: 'Robusta', unit: 'g', isRequiredForSale: true } },
          ]),
        },
        toppingRecipe: { findMany: jest.fn().mockResolvedValue([]) },
        product: { findMany: jest.fn().mockResolvedValue([{ id: 1, category: 'vietnamese' }]) },
        ingredient: { findMany: jest.fn().mockResolvedValue([]), findUnique, updateMany },
        inventoryLog: { create: jest.fn().mockResolvedValue({}) },
        order: { create },
      })),
    };

    await new OrdersService(prisma).createOrder({
      items: [{ productId: 1, productName: 'ignored', size: 'S', toppings: [], quantity: 1, unitPrice: 0 }],
    }, 7);

    expect(updateMany).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: expect.objectContaining({ id: 10, version: 1 }),
    }));
  });
});
