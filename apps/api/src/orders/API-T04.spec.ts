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
      topping: {
        findMany: jest.fn().mockResolvedValue([
          { id: 1, price: 5000 },
          { id: 2, price: 7000 },
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
          toppings: ['1', '2'],
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

  it('retries stock deduction when the product version changes', async () => {
    const create = jest.fn().mockResolvedValue({
      id: 2,
      status: OrderStatus.PENDING,
      items: [],
    });
    const findUnique = jest.fn()
      .mockResolvedValueOnce({ id: 1, name: 'Cà phê', basePrice: 45000, stock: 10, version: 0 })
      .mockResolvedValueOnce({ id: 1, name: 'Cà phê', basePrice: 45000, stock: 9, version: 1 });
    const updateMany = jest.fn()
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });
    const prisma: any = {
      product: {
        findMany: jest.fn().mockResolvedValue([{ id: 1, name: 'Cà phê', basePrice: 45000 }]),
      },
      topping: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn((callback: (tx: any) => unknown) => callback({
        product: { findUnique, updateMany },
        order: { create },
      })),
    };

    await new OrdersService(prisma).createOrder({
      items: [{ productId: 1, productName: 'ignored', size: 'S', toppings: [], quantity: 1, unitPrice: 0 }],
    }, 7);

    expect(updateMany).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: expect.objectContaining({ id: 1, version: 1 }),
    }));
  });
});
