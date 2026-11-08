import { OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';

describe('API-T09 — PAID order cancellation', () => {
  it('cancels PAID order, restores stock and revokes loyalty points', async () => {
    const productUpdate = jest.fn().mockResolvedValue({});
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
        product: { update: productUpdate },
        user: { update: userUpdate },
      })),
    };

    const result = await new OrdersService(prisma).updateOrderStatus(
      30, OrderStatus.CANCELLED, 5, 'CUSTOMER',
    );

    expect(result.status).toBe(OrderStatus.CANCELLED);
    expect(productUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { stock: { increment: 2 }, version: { increment: 1 } },
    });
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { loyaltyPoints: { decrement: 84 } },
    });
  });
});
