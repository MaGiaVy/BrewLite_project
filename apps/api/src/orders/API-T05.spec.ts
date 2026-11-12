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

function makePrisma(discountCodeRecord: any, personalVoucherRecord: any = null) {
  const create = jest.fn().mockImplementation(async ({ data }: any) => ({
    id: 1,
    status: OrderStatus.PENDING,
    ...data,
    items: data.items.create,
  }));
  const userVoucherDelete = jest.fn().mockResolvedValue({});
  return {
    order: { count: jest.fn().mockResolvedValue(0) },
    product: { findMany: jest.fn().mockResolvedValue([{ id: 1, name: 'Cà phê', basePrice: 100000, isActive: true }]) },
    toppingRecipe: { findMany: jest.fn().mockResolvedValue([]) },
    storeSetting: { findMany: jest.fn().mockResolvedValue([]) },
    discountCode: {
      findUnique: jest.fn().mockResolvedValue(discountCodeRecord),
      update: jest.fn().mockResolvedValue({}),
    },
    userVoucher: {
      findUnique: jest.fn().mockResolvedValue(personalVoucherRecord),
      update: jest.fn().mockResolvedValue({}),
      delete: userVoucherDelete,
    },
    $transaction: jest.fn((callback: any) => callback({
      recipe: { findMany: jest.fn().mockResolvedValue([]) },
      toppingRecipe: { findMany: jest.fn().mockResolvedValue([]) },
      product: { findMany: jest.fn().mockResolvedValue([{ id: 1, category: 'vietnamese' }]) },
      ingredient: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue({ id: 1, stock: 100, version: 0, isRequiredForSale: true }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      order: { create, count: jest.fn().mockResolvedValue(0) },
      discountCode: {
        findUnique: jest.fn().mockResolvedValue(discountCodeRecord),
        update: jest.fn().mockResolvedValue({}),
      },
      userVoucher: {
        findUnique: jest.fn().mockResolvedValue(personalVoucherRecord),
        update: jest.fn().mockResolvedValue({}),
        delete: userVoucherDelete,
      },
    })),
    _userVoucherDelete: userVoucherDelete,
  } as any;
}

describe('API-T05 — vouchers (DiscountCode & UserVoucher)', () => {
  it('applies a 10% PERCENT DiscountCode voucher', async () => {
    const service = new OrdersService(makePrisma({
      id: 1,
      code: 'PERCENT10',
      discountPercent: 10,
      minOrderAmount: 0,
      maxDiscountAmount: null,
      isActive: true,
    }));

    const result = await service.createOrder(orderDto('PERCENT10'), 1);

    expect(result.discountAmount).toBe(10000);
    expect(result.totalAmount).toBe(90000);
  });

  it('caps a DiscountCode voucher using maxDiscountAmount', async () => {
    const service = new OrdersService(makePrisma({
      id: 2,
      code: 'MAX20',
      discountPercent: 50,
      minOrderAmount: 0,
      maxDiscountAmount: 20000,
      isActive: true,
    }));

    const result = await service.createOrder(orderDto('MAX20'), 1);

    expect(result.discountAmount).toBe(20000);
    expect(result.totalAmount).toBe(80000);
  });

  it('caps discount so totalAmount never drops below 0', async () => {
    const service = new OrdersService(makePrisma({
      id: 3,
      code: 'FULL150',
      discountPercent: 100,
      minOrderAmount: 0,
      maxDiscountAmount: 150000,
      isActive: true,
    }));

    const result = await service.createOrder(orderDto('FULL150'), 1);

    expect(result.discountAmount).toBe(100000);
    expect(result.totalAmount).toBe(0);
  });

  it('rejects inactive and below-minimum DiscountCode vouchers', async () => {
    const inactive = new OrdersService(makePrisma({
      id: 4,
      code: 'OLD',
      discountPercent: 10,
      minOrderAmount: 0,
      isActive: false,
    }));
    await expect(inactive.createOrder(orderDto('OLD'), 1)).rejects.toThrow(BadRequestException);

    const belowMinimum = new OrdersService(makePrisma({
      id: 5,
      code: 'MIN100',
      discountPercent: 10,
      minOrderAmount: 100001,
      isActive: true,
    }));
    await expect(belowMinimum.createOrder(orderDto('MIN100'), 1)).rejects.toThrow(BadRequestException);
  });

  it('applies personal UserVoucher and removes last remaining voucher inside transaction', async () => {
    const prisma = makePrisma(null, {
      id: 9,
      userId: 1,
      code: 'PERSONAL10',
      quantity: 1,
      discountPercent: 10,
      minOrderAmount: 0,
      maxDiscountAmount: null,
    });
    const service = new OrdersService(prisma);

    const result = await service.createOrder(orderDto('PERSONAL10'), 1);

    expect(result.discountAmount).toBe(10000);
    expect(result.totalAmount).toBe(90000);
    expect(prisma._userVoucherDelete).toHaveBeenCalledWith({ where: { id: 9 } });
  });
});
