import { OrderStatus, PaymentMethod, PaymentStatus, Role } from '@prisma/client';
import { PaymentsService } from '../payments/payments.service';
import { OrdersService } from './orders.service';

describe('API-T06 — loyalty points', () => {
  it('awards 0 points on PAID payment and awards one point per 1,000 VND only when order reaches COMPLETED', async () => {
    const userUpdate = jest.fn().mockResolvedValue({});
    const prisma: any = {
      payment: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({
        id: 9, orderId: 10, amount: 90000, method: PaymentMethod.EWALLET, status: PaymentStatus.SUCCESS,
      }) },
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 10,
          userId: 3,
          totalAmount: 90000,
          status: OrderStatus.PENDING,
          version: 0,
          createdAt: new Date(),
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: { update: userUpdate },
      $transaction: jest.fn((callback: any) => callback(prisma)),
    };
    const payment = {
      charge: jest.fn().mockResolvedValue({
        success: true,
        transactionId: 'TXN-POINTS',
      }),
    };

    const result = await new PaymentsService(prisma, payment as any).processPayment(
      { orderId: 10, method: PaymentMethod.EWALLET },
      3,
    );

    expect(result.pointsEarned).toBe(0);
    expect(userUpdate).not.toHaveBeenCalled();

    const completePrisma: any = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 10,
          userId: 3,
          totalAmount: 90000,
          status: OrderStatus.READY,
          version: 2,
          items: [],
        }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ id: 99, fullName: 'Staff' }),
      },
      $transaction: jest.fn((callback: any) =>
        callback({
          order: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            findUnique: jest.fn().mockResolvedValue({
              id: 10,
              userId: 3,
              totalAmount: 90000,
              status: OrderStatus.COMPLETED,
              updatedAt: new Date(),
            }),
          },
          user: { update: userUpdate },
        }),
      ),
    };

    const completeResult = await new OrdersService(completePrisma).updateOrderStatus(
      10,
      OrderStatus.COMPLETED,
      99,
      Role.STAFF,
    );

    expect(completeResult.status).toBe(OrderStatus.COMPLETED);
    expect((completeResult as any).pointsEarned).toBe(90);
    expect(userUpdate).toHaveBeenCalledTimes(1);
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { loyaltyPoints: { increment: 90 } },
    });
  });
});
