import { OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';

describe('API-T08 — 15-minute order expiration & BOM refund', () => {
  it('cancels an expired pending/failed order after 15 minutes and restores BOM ingredient stock once', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const ingredientUpdate = jest.fn().mockResolvedValue({ id: 10, name: 'Cà phê hạt', unit: 'g', stock: 140 });
    const inventoryLogCreate = jest.fn().mockResolvedValue({});
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
        inventoryLog: {
          findMany: jest.fn().mockResolvedValue([
            { ingredientId: 10, ingredientName: 'Cà phê hạt', unit: 'g', changeAmount: -40 },
          ]),
          create: inventoryLogCreate,
        },
        ingredient: { update: ingredientUpdate },
      })),
    };

    expect(await new OrdersService(prisma).cancelExpiredPendingOrders()).toBe(1);
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 20, version: 2 }),
      data: expect.objectContaining({ status: OrderStatus.CANCELLED }),
    }));
    expect(ingredientUpdate).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { stock: { increment: 40 }, version: { increment: 1 } },
    });
    expect(inventoryLogCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ type: 'CANCEL_REFUND', changeAmount: 40 }),
    }));
  });
});
