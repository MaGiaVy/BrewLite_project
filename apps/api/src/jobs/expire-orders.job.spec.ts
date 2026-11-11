import { OrderStatus } from '@prisma/client';
import { ExpireOrdersJob } from './expire-orders.job';

describe('ExpireOrdersJob', () => {
  it('expires orders older than 15 minutes using atomic BOM refund', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const ingredientUpdate = jest.fn().mockResolvedValue({ id: 1, name: 'Robusta', unit: 'g', stock: 125 });
    const inventoryLogCreate = jest.fn().mockResolvedValue({});
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 100,
        version: 1,
        status: OrderStatus.PENDING,
        createdAt: new Date(Date.now() - 16 * 60 * 1000),
        items: [{ productId: 1, size: 'M', toppings: [], quantity: 1 }],
      },
    ]);

    const prisma: any = {
      order: { findMany },
      $transaction: jest.fn((cb: any) =>
        cb({
          order: { updateMany },
          inventoryLog: {
            findMany: jest.fn().mockResolvedValue([
              { ingredientId: 1, ingredientName: 'Robusta', unit: 'g', changeAmount: -25 },
            ]),
            create: inventoryLogCreate,
          },
          ingredient: { update: ingredientUpdate },
        }),
      ),
    };

    const job = new ExpireOrdersJob(prisma);
    await job.handleExpiredOrders();

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: [OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED] },
        }),
      }),
    );
    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(ingredientUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { stock: { increment: 25 }, version: { increment: 1 } },
    });
  });

  it('logs and swallows errors without crashing cron tick', async () => {
    const prisma: any = {
      order: { findMany: jest.fn().mockRejectedValue(new Error('DB temporarily unavailable')) },
      $transaction: jest.fn(),
    };
    const job = new ExpireOrdersJob(prisma);
    await expect(job.handleExpiredOrders()).resolves.toBeUndefined();
  });
});
