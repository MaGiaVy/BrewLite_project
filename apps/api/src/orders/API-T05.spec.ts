import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';

const orderDto = (discountCode: string) => ({
  items: [{
    productId: 1,
    productName: 'Cà phê',
    size: 'S',
    toppings: [],
    quantity: 1,
    unitPrice: 100000,
  }],
  discountCode,
});

function makePrisma(voucher: any) {
  const create = jest.fn().mockImplementation(async ({ data }: any) => ({
    id: 1,
    status: OrderStatus.PENDING,
    ...data,
    items: data.items.create,
  }));
  return {
    product: { findMany: jest.fn().mockResolvedValue([{ id: 1, basePrice: 100000 }]) },
    toppingRecipe: { findMany: jest.fn().mockResolvedValue([]) },
    storeSetting: { findMany: jest.fn().mockResolvedValue([]) },
    discountCode: {
      findUnique: jest.fn().mockResolvedValue(voucher),
      update: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn((callback: any) => callback({ order: { create } })),
  } as any;
}

describe('API-T05 — vouchers', () => {
  it('applies a 10% PERCENT voucher', async () => {
    const service = new OrdersService(makePrisma({
      code: 'PERCENT10',
      discountPercent: 10,
      discountAmount: null,
      minOrderAmount: 0,
      maxDiscountAmount: null,
      isActive: true,
    }));

    const result = await service.createOrder(orderDto('PERCENT10'), 1);

    expect(result.discountAmount).toBe(10000);
    expect(result.totalAmount).toBe(90000);
  });

  it('applies a FIXED voucher using discountAmount', async () => {
    const service = new OrdersService(makePrisma({
      code: 'FIXED20',
      discountPercent: 0,
      discountAmount: 20000,
      minOrderAmount: 0,
      maxDiscountAmount: null,
      isActive: true,
    }));

    const result = await service.createOrder(orderDto('FIXED20'), 1);

    expect(result.discountAmount).toBe(20000);
    expect(result.totalAmount).toBe(80000);
  });

  it('rejects expired and below-minimum vouchers', async () => {
    const expired = new OrdersService(makePrisma({
      code: 'OLD',
      discountPercent: 10,
      discountAmount: null,
      minOrderAmount: 0,
      isActive: true,
      expiresAt: new Date(Date.now() - 1000),
    }));
    await expect(expired.createOrder(orderDto('OLD'), 1)).rejects.toThrow(BadRequestException);

    const belowMinimum = new OrdersService(makePrisma({
      code: 'MIN100',
      discountPercent: 10,
      discountAmount: null,
      minOrderAmount: 100001,
      isActive: true,
      expiresAt: null,
    }));
    await expect(belowMinimum.createOrder(orderDto('MIN100'), 1)).rejects.toThrow(BadRequestException);
  });
});
