import { OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';

describe('API-T04 — order pricing', () => {
  it('calculates product, size and toppings price server-side', async () => {
    const create = jest.fn().mockImplementation(async ({ data }: any) => ({
      id: 1,
      status: OrderStatus.PENDING,
      ...data,
      items: data.items.create,
    }));
    const prisma: any = {
      product: {
        findMany: jest.fn().mockResolvedValue([
          { id: 1, basePrice: 45000, sizeUpchargeM: 5000, sizeUpchargeL: 10000 },
        ]),
      },
      toppingRecipe: {
        findMany: jest.fn().mockResolvedValue([
          { toppingId: 't1', price: 5000 },
          { toppingId: 't2', price: 7000 },
        ]),
      },
      storeSetting: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn((callback: (tx: any) => unknown) => callback({
        product: {
          findUnique: jest.fn().mockResolvedValue({ id: 1, stock: 10, version: 0 }),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        order: { create },
      })),
    };

    const result = await new OrdersService(prisma).createOrder(
      {
        items: [{
          productId: 1,
          productName: 'Cà phê',
          size: 'M',
          toppings: ['t1', 't2'],
          quantity: 2,
          unitPrice: 1,
        }],
      },
      7,
    );

    expect(result.totalAmount).toBe(124000);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        totalAmount: 124000,
        items: { create: [expect.objectContaining({ unitPrice: 62000, quantity: 2 })] },
      }),
    }));
  });
});
