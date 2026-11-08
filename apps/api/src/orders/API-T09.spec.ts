import { OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';

describe('API-T09 — PAID order cancellation', () => {
  it('cancels PAID order, restores stock and revokes loyalty points', async () => {
    const ingredientUpdate = jest.fn().mockResolvedValue({});
    const userUpdate = jest.fn().mockResolvedValue({});
    const orderUpdate = jest.fn().mockResolvedValue({
      id: 30, status: OrderStatus.CANCELLED, updatedAt: new Date(),
    });
    const prisma: any = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 30,
          userId: 5,
          version: 0,
          status: OrderStatus.PAID,
          totalAmount: 84000,
          items: [{ productId: 1, size: 'M', toppings: [], quantity: 2 }],
        }),
      },
      $transaction: jest.fn((callback: any) => callback({
        order: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          update: orderUpdate,
        },
        recipe: { findMany: jest.fn().mockResolvedValue([{
          productId: 1,
          size: 'M',
          amount: 25,
          ingredient: { id: 4, code: 'COFFEE', name: 'Coffee', unit: 'g' },
        }]) },
        toppingRecipe: { findMany: jest.fn().mockResolvedValue([]) },
        ingredient: { update: ingredientUpdate },
        user: { update: userUpdate },
      })),
    };

    const result = await new OrdersService(prisma).updateOrderStatus(
      30, OrderStatus.CANCELLED, 5, 'CUSTOMER',
    );

    expect(result.status).toBe(OrderStatus.CANCELLED);
    expect(ingredientUpdate).toHaveBeenCalledWith({
      where: { id: 4 },
      data: { stock: { increment: 50 }, version: { increment: 1 } },
    });
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { loyaltyPoints: { decrement: 84 } },
    });
  });
});
