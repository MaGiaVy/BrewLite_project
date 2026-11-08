import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';

describe('API-T07 — order state machine', () => {
  it('rejects invalid PAID -> PENDING transition', async () => {
    const prisma: any = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1, userId: 7, status: OrderStatus.PAID, items: [],
        }),
      },
    };

    await expect(new OrdersService(prisma).updateOrderStatus(
      1, OrderStatus.PENDING, 7,
    )).rejects.toThrow(BadRequestException);
  });

  it('allows the valid PAID -> PREPARING transition', async () => {
    const update = jest.fn().mockResolvedValue({
      id: 1, status: OrderStatus.PREPARING, updatedAt: new Date(),
    });
    const prisma: any = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1, userId: 7, status: OrderStatus.PAID, items: [],
        }),
        update,
      },
      user: { findUnique: jest.fn().mockResolvedValue(null) },
    };

    const result = await new OrdersService(prisma).updateOrderStatus(
      1, OrderStatus.PREPARING, 7,
    );

    expect(result.status).toBe(OrderStatus.PREPARING);
    expect(update).toHaveBeenCalled();
  });

  it('allows PAYMENT_FAILED -> PENDING for a payment retry', async () => {
    const update = jest.fn().mockResolvedValue({
      id: 2, status: OrderStatus.PENDING, updatedAt: new Date(),
    });
    const prisma: any = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 2, userId: 7, status: OrderStatus.PAYMENT_FAILED, items: [],
        }),
        update,
      },
    };

    const result = await new OrdersService(prisma).updateOrderStatus(
      2, OrderStatus.PENDING, 7,
    );

    expect(result.status).toBe(OrderStatus.PENDING);
  });
});
