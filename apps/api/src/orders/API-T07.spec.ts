import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';
import { OrdersService } from './orders.service';
import { assertTransition } from '../payments/state-machine.helper';

describe('API-T07 — order state machine & RBAC', () => {
  it('rejects invalid PAID -> PENDING transition', async () => {
    const prisma: any = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1, userId: 7, status: OrderStatus.PAID, items: [],
        }),
      },
      user: { findUnique: jest.fn().mockResolvedValue(null) },
    };

    await expect(new OrdersService(prisma).updateOrderStatus(
      1, OrderStatus.PENDING, 99, Role.STAFF,
    )).rejects.toThrow(BadRequestException);
  });

  it('allows STAFF PAID -> PREPARING transition and blocks CUSTOMER from marking PREPARING', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const prisma: any = {
      order: {
        findUnique: jest.fn()
          .mockResolvedValueOnce({ id: 1, userId: 7, status: OrderStatus.PAID, items: [] })
          .mockResolvedValueOnce({ id: 1, userId: 7, status: OrderStatus.PAID, items: [] })
          .mockResolvedValueOnce({ id: 1, status: OrderStatus.PREPARING, updatedAt: new Date() }),
        updateMany,
      },
      user: { findUnique: jest.fn().mockResolvedValue({ id: 99, fullName: 'Barista' }) },
    };

    await expect(new OrdersService(prisma).updateOrderStatus(
      1, OrderStatus.PREPARING, 7, Role.CUSTOMER,
    )).rejects.toThrow(ForbiddenException);

    const result = await new OrdersService(prisma).updateOrderStatus(
      1, OrderStatus.PREPARING, 99, Role.STAFF,
    );

    expect(result.status).toBe(OrderStatus.PREPARING);
    expect(updateMany).toHaveBeenCalled();
  });

  it('allows owner PAYMENT_FAILED -> PENDING for a payment retry within 15m', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const prisma: any = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 2, userId: 7, status: OrderStatus.PAYMENT_FAILED, createdAt: new Date(), items: [],
        }),
      },
      $transaction: jest.fn((callback: any) => callback({
        order: {
          updateMany,
          findUnique: jest.fn().mockResolvedValue({ id: 2, status: OrderStatus.PENDING, updatedAt: new Date() }),
        },
      })),
    };

    const result = await new OrdersService(prisma).updateOrderStatus(
      2, OrderStatus.PENDING, 7, Role.CUSTOMER,
    );

    expect(result.status).toBe(OrderStatus.PENDING);
  });

  it('allows direct PAYMENT_FAILED -> PAID transition in state machine helper', () => {
    expect(() => assertTransition(OrderStatus.PAYMENT_FAILED, OrderStatus.PAID)).not.toThrow();
  });
});
