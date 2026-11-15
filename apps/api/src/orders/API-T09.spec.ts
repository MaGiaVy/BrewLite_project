import { BadRequestException } from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';
import { OrdersService } from './orders.service';

describe('API-T09 — PAID order cancellation policy (Phần 4.1)', () => {
  it('allows STAFF/ADMIN to cancel PAID order before PREPARING, restores BOM stock and revokes loyalty points', async () => {
    const ingredientUpdate = jest.fn().mockResolvedValue({ id: 10, name: 'Cà phê hạt', unit: 'g', stock: 140 });
    const userUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    const orderFindInTx = jest.fn().mockResolvedValue({
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
          updatedAt: new Date(),
          items: [{ productId: 1, size: 'M', toppings: [], quantity: 2 }],
        }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: 99, fullName: 'Staff Quầy' }),
      },
      $transaction: jest.fn((callback: any) => callback({
        order: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          findUnique: orderFindInTx,
        },
        inventoryLog: {
          findMany: jest.fn().mockResolvedValue([
            { ingredientId: 10, ingredientName: 'Cà phê hạt', unit: 'g', changeAmount: -40 },
          ]),
          create: jest.fn().mockResolvedValue({}),
        },
        ingredient: { update: ingredientUpdate },
        user: { updateMany: userUpdateMany },
      })),
    };

    const result = await new OrdersService(prisma).updateOrderStatus(
      30, OrderStatus.CANCELLED, 99, Role.STAFF,
    );

    expect(result.status).toBe(OrderStatus.CANCELLED);
    expect(ingredientUpdate).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { stock: { increment: 40 }, version: { increment: 1 } },
    });
    expect(userUpdateMany).toHaveBeenCalledWith({
      where: { id: 5, loyaltyPoints: { gte: 84 } },
      data: { loyaltyPoints: { decrement: 84 } },
    });
  });

  it('rejects CUSTOMER cancelling PAID order at any time (must contact Staff/Admin)', async () => {
    const prisma: any = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 31,
          userId: 5,
          version: 0,
          status: OrderStatus.PAID,
          totalAmount: 50000,
          updatedAt: new Date(),
          items: [],
        }),
      },
    };

    await expect(
      new OrdersService(prisma).updateOrderStatus(31, OrderStatus.CANCELLED, 5, Role.CUSTOMER),
    ).rejects.toThrow(BadRequestException);
  });
});
