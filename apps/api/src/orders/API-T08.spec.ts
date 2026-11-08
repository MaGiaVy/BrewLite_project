import { OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';

describe('API-T08 — order expiration', () => {
  it('cancels an expired pending order and restores stock once', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const ingredientUpdate = jest.fn().mockResolvedValue({});
    const order = {
      id: 20,
      version: 2,
      status: OrderStatus.PAYMENT_FAILED,
      createdAt: new Date(Date.now() - 16 * 60 * 1000),
      items: [{ productId: 1, size: 'M', toppings: [], quantity: 2 }],
    };
    const prisma: any = {
      order: { findMany: jest.fn().mockResolvedValue([order]) },
      $transaction: jest.fn((callback: any) => callback({
        order: { updateMany },
        recipe: { findMany: jest.fn().mockResolvedValue([{
          productId: 1,
          size: 'M',
          amount: 25,
          ingredient: { id: 4, code: 'COFFEE', name: 'Coffee', unit: 'g' },
        }]) },
        toppingRecipe: { findMany: jest.fn().mockResolvedValue([]) },
        ingredient: { update: ingredientUpdate },
      })),
    };

    expect(await new OrdersService(prisma).cancelExpiredPendingOrders()).toBe(1);
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 20, version: 2 }),
    }));
    expect(ingredientUpdate).toHaveBeenCalledWith({
      where: { id: 4 },
      data: { stock: { increment: 50 }, version: { increment: 1 } },
    });
  });
});
