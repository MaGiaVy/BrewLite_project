import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { createHmac } from 'crypto';
import { AuthService } from './auth/auth.service';
import { RedeemPointsDto } from './auth/dto/redeem-points.dto';
import { RegisterDto } from './auth/dto/register.dto';
import { UpdateProfileDto } from './auth/dto/update-profile.dto';
import { getJwtSecret } from './auth/jwt-secret.helper';
import { JwtStrategy } from './auth/jwt.strategy';
import { ParseInt32Pipe } from './common/pipes/parse-int32.pipe';
import { containsUnsafeHtml } from './common/validators/no-unsafe-html.validator';
import { CreateCustomerDto } from './customers/dto/create-customer.dto';
import { UpdateCustomerDto } from './customers/dto/update-customer.dto';
import { InventoryService } from './inventory/inventory.service';
import { OrderItemDto } from './orders/dto/create-order.dto';
import { refundOrderResources } from './orders/order-refund.helper';
import { OrdersService } from './orders/orders.service';
import { PaymentsService } from './payments/payments.service';
import { ZaloPayService } from './payments/zalopay.service';
import { CreateProductDto, UpdateProductDto } from './products/dto/product.dto';
import { ProductsService } from './products/products.service';
import { UsersService } from './users/users.service';

describe('Assignment 2 Audit Fixes Regression Suite', () => {
  describe('H-05 — ParseInt32Pipe bounds validation', () => {
    const pipe = new ParseInt32Pipe();
    const optionalPipe = new ParseInt32Pipe({ optional: true });

    it('rejects overflow, zero, negative, and non-numeric IDs with 400 BadRequestException', () => {
      expect(() => pipe.transform('2147483648', {} as any)).toThrow(BadRequestException);
      expect(() => pipe.transform('999999999999', {} as any)).toThrow(BadRequestException);
      expect(() => pipe.transform('0', {} as any)).toThrow(BadRequestException);
      expect(() => pipe.transform('-5', {} as any)).toThrow(BadRequestException);
      expect(() => pipe.transform('abc', {} as any)).toThrow(BadRequestException);
    });

    it('accepts valid 32-bit positive integers and optional undefined', () => {
      expect(pipe.transform('2147483647', {} as any)).toBe(2147483647);
      expect(pipe.transform(42, {} as any)).toBe(42);
      expect(optionalPipe.transform(undefined, {} as any)).toBeUndefined();
    });
  });

  describe('H-02 — getJwtSecret production hardening', () => {
    const prevEnv = process.env;

    afterEach(() => {
      process.env = prevEnv;
    });

    it('blocks weak/placeholder secrets in production', () => {
      for (const weak of [
        'brewlite-super-secret-jwt-key-2026-sgu',
        'brewlite-super-secret-jwt-key-change-in-prod',
        'ci-only-jwt-secret-not-for-production',
        'short',
      ]) {
        process.env = { ...prevEnv, NODE_ENV: 'production', JWT_SECRET: weak };
        expect(() => getJwtSecret()).toThrow(/FATAL SECURITY CONFIGURATION/);
      }
    });
  });

  describe('H-01 — JWT tokenVersion invalidation', () => {
    it('rejects stale JWT tokens whose tokenVersion does not match user.tokenVersion', async () => {
      const prisma: any = {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 7,
            email: 'u@brewlite.vn',
            role: Role.CUSTOMER,
            isActive: true,
            tokenVersion: 2,
          }),
        },
      };
      const strategy = new JwtStrategy(prisma);

      await expect(
        strategy.validate({ sub: 7, email: 'u@brewlite.vn', role: Role.CUSTOMER, tokenVersion: 1 }),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        strategy.validate({ sub: 7, email: 'u@brewlite.vn', role: Role.CUSTOMER, tokenVersion: 2 }),
      ).resolves.toEqual({ userId: 7, email: 'u@brewlite.vn', role: Role.CUSTOMER });
    });
  });

  describe('H-03 — ProductsService.findOne visibility for inactive products', () => {
    it('hides isActive=false products from customers (404) while allowing STAFF/ADMIN', async () => {
      const prisma: any = {
        product: {
          findUnique: jest.fn().mockResolvedValue({
            id: 9,
            name: 'Seasonal Drink',
            basePrice: 49000,
            category: 'espresso',
            isActive: false,
            recipes: [],
          }),
        },
        toppingRecipe: { findMany: jest.fn().mockResolvedValue([]) },
      };
      const svc = new ProductsService(prisma);

      await expect(svc.findOne(9, false, false)).rejects.toThrow(NotFoundException);
      const staffView = await svc.findOne(9, false, true);
      expect(staffView.data.id).toBe(9);
      expect((staffView.data as any).isActive).toBe(false);
    });
  });

  describe('H-04, H-06, M-05, M-06, M-07 — InventoryService security & integrity', () => {
    it('H-04: strips costPerUnit, totalInventoryValue, and inactive recipes for STAFF', async () => {
      const prisma: any = {
        ingredient: {
          findMany: jest.fn().mockResolvedValue([
            { id: 1, code: 'ING_A', name: 'Coffee', unit: 'g', stock: 100, minThreshold: 10, costPerUnit: 500, recipes: [] },
          ]),
        },
        product: {
          findMany: jest.fn().mockResolvedValue([
            { id: 1, name: 'Active', isActive: true, recipes: [{ id: 1, ingredient: { id: 1, name: 'Coffee', costPerUnit: 500 } }] },
          ]),
        },
        toppingRecipe: {
          findMany: jest.fn().mockResolvedValue([
            { id: 1, toppingId: 'boba', isActive: true, ingredient: { id: 1, name: 'Boba', costPerUnit: 200 } },
          ]),
        },
      };
      const svc = new InventoryService(prisma);

      const staffIngredients = await svc.getAllIngredients(false);
      expect(staffIngredients[0].costPerUnit).toBeUndefined();
      expect(staffIngredients[0].totalInventoryValue).toBeUndefined();

      const matrix = await svc.getRecipeMatrix(false);
      expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { isActive: true } }));
      expect((matrix.products[0].recipes[0].ingredient as any).costPerUnit).toBeUndefined();
      expect((matrix.toppingRecipes[0].ingredient as any).costPerUnit).toBeUndefined();
    });

    it('H-06 & M-05: preserves explicit maxDiscountAmount=0, performs no DB writes in GET vouchers, filters inactive toppings', async () => {
      const prisma: any = {
        discountCode: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockImplementation(async ({ data }: any) => ({ id: 1, ...data })),
          findMany: jest.fn().mockResolvedValue([
            { id: 1, code: 'FREE0', description: 'Test', discountPercent: 10, minOrderAmount: 0, maxDiscountAmount: 0, isActive: true, usageCount: 99, createdAt: new Date() },
          ]),
          update: jest.fn(),
        },
        storeSetting: { findMany: jest.fn().mockResolvedValue([]) },
        toppingRecipe: {
          findMany: jest.fn().mockResolvedValue([
            { toppingId: 'hidden', toppingName: 'Hidden', price: 8000, isActive: false, amount: 10, ingredient: { stock: 100, costPerUnit: 100 } },
            { toppingId: 'boba', toppingName: 'Boba', price: 8000, isActive: true, amount: 10, ingredient: { stock: 100, costPerUnit: 100 } },
          ]),
        },
      };
      const svc = new InventoryService(prisma);

      const created = await svc.createVoucher({ code: 'ZERO_CAP', discountPercent: 15, maxDiscountAmount: 0 });
      expect(created.maxDiscountAmount).toBe(0);

      const vouchers = await svc.getAllVouchers(false);
      expect(vouchers).toHaveLength(1);
      expect(prisma.discountCode.update).not.toHaveBeenCalled();

      const config = await svc.getPublicPricingConfig();
      expect(config.allToppings.map((t: any) => t.id)).toEqual(['boba']);
      expect((config.vouchers[0] as any).usageCount).toBeUndefined();
      expect((config.vouchers[0] as any).createdAt).toBeUndefined();
    });

    it('M-06 & M-07: deleteToppingRecipe deletes all rows of toppingId; PKG_* cannot be deleted or renamed', async () => {
      const prisma: any = {
        toppingRecipe: {
          findUnique: jest.fn().mockResolvedValue({ id: 5, toppingId: 'combo_top', toppingName: 'Combo' }),
          deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
        },
        ingredient: {
          findUnique: jest.fn().mockResolvedValue({ id: 9, code: 'PKG_CUP_M', version: 1, recipes: [] }),
        },
      };
      const svc = new InventoryService(prisma);

      await svc.deleteToppingRecipe(5);
      expect(prisma.toppingRecipe.deleteMany).toHaveBeenCalledWith({ where: { toppingId: 'combo_top' } });

      await expect(svc.deleteIngredient(9)).rejects.toThrow(BadRequestException);
      await expect(svc.updateIngredient(9, { code: 'CUSTOM_CUP' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('M-01 & M-04 — UsersService CUSTOMER isolation & AuthService catalog discount enforcement', () => {
    it('M-01: blocks getStaffById, updateStaff, toggleStaffStatus, deleteStaff on CUSTOMER accounts', async () => {
      const prisma: any = {
        user: {
          findUnique: jest.fn().mockResolvedValue({ id: 20, email: 'c@b.vn', role: Role.CUSTOMER }),
        },
      };
      const svc = new UsersService(prisma);
      await expect(svc.getStaffById(20)).rejects.toThrow(NotFoundException);
      await expect(svc.updateStaff(20, { fullName: 'X' }, 1)).rejects.toThrow(NotFoundException);
      await expect(svc.toggleStaffStatus(20, false, 1)).rejects.toThrow(NotFoundException);
      await expect(svc.deleteStaff(20, 1)).rejects.toThrow(NotFoundException);
    });

    it('M-04: requires voucherCode and blocks redeeming catalog voucher when DB DiscountCode.isActive is false', async () => {
      const prisma: any = {
        user: { findUnique: jest.fn().mockResolvedValue({ id: 1, loyaltyPoints: 200 }) },
        discountCode: { findUnique: jest.fn().mockResolvedValue({ code: 'BREW10', isActive: false }) },
      };
      const jwt: any = { sign: jest.fn() };
      const svc = new AuthService(prisma, jwt);

      await expect(svc.redeemPoints(1, 10)).rejects.toThrow(BadRequestException);
      await expect(svc.redeemPoints(1, 10, 'Test', 'BREW10')).rejects.toThrow(
        'Mã voucher đổi thưởng hiện đang tạm ngưng áp dụng',
      );
    });
  });

  describe('C-01, C-02, M-11, LOW-5, Phần 4.2 — Orders & Payments hardening', () => {
    it('C-01: rejects empty, unknown, inactive, and cross-category toppings without 8000đ fallback', async () => {
      const prisma: any = {
        product: {
          findMany: jest.fn().mockResolvedValue([
            { id: 1, name: 'Coffee', basePrice: 30000, category: 'vietnamese', isActive: true },
            { id: 8, name: 'Croissant', basePrice: 35000, category: 'bakery', isActive: true },
          ]),
        },
        toppingRecipe: {
          findMany: jest.fn().mockResolvedValue([
            { toppingId: 'boba', toppingName: 'Trân châu trắng', price: 8000, isActive: true },
            { toppingId: 'bakery_butter', toppingName: 'Bơ lạt', price: 5000, isActive: true },
          ]),
        },
        storeSetting: { findMany: jest.fn().mockResolvedValue([]) },
      };
      const svc = new OrdersService(prisma);

      await expect(
        svc.createOrder({ items: [{ productId: 1, size: 'M', toppings: [''], quantity: 1 }] }, 1),
      ).rejects.toThrow(BadRequestException);

      await expect(
        svc.createOrder({ items: [{ productId: 1, size: 'M', toppings: ['Trân châu'], quantity: 1 }] }, 1),
      ).rejects.toThrow(BadRequestException);

      await expect(
        svc.createOrder({ items: [{ productId: 1, size: 'M', toppings: ['Bơ lạt'], quantity: 1 }] }, 1),
      ).rejects.toThrow(BadRequestException);

      await expect(
        svc.createOrder({ items: [{ productId: 8, size: 'ALL', toppings: ['Trân châu trắng'], quantity: 1 }] }, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('C-02 & M-11: creates 0đ 100%-discount orders directly as PAID and snapshots voucher metadata for refund', async () => {
      let capturedCreateData: any;
      const prisma: any = {
        product: {
          findMany: jest.fn().mockResolvedValue([
            { id: 1, name: 'Coffee', basePrice: 30000, category: 'vietnamese', isActive: true },
          ]),
        },
        toppingRecipe: { findMany: jest.fn().mockResolvedValue([]) },
        storeSetting: { findMany: jest.fn().mockResolvedValue([]) },
        $transaction: jest.fn(async (cb: any) =>
          cb({
            $queryRaw: jest.fn(),
            order: {
              count: jest.fn().mockResolvedValue(0),
              create: jest.fn().mockImplementation(async ({ data }: any) => {
                capturedCreateData = data;
                return { id: 99, ...data, items: [] };
              }),
            },
            userVoucher: {
              findUnique: jest.fn().mockResolvedValue({
                id: 1,
                userId: 5,
                code: 'FREE100',
                quantity: 1,
                discountPercent: 100,
                minOrderAmount: 20000,
                maxDiscountAmount: 100000,
              }),
              updateMany: jest.fn().mockResolvedValue({ count: 1 }),
              deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
            },
            recipe: { findMany: jest.fn().mockResolvedValue([]) },
            ingredient: { findMany: jest.fn().mockResolvedValue([]) },
          }),
        ),
      };

      const orderRes = await new OrdersService(prisma).createOrder(
        { items: [{ productId: 1, size: 'S', toppings: [], quantity: 1 }], discountCode: 'FREE100' },
        5,
      );
      expect(orderRes.status).toBe(OrderStatus.PAID);
      expect(orderRes.totalAmount).toBe(0);
      expect(capturedCreateData.voucherDiscountPercent).toBe(100);
      expect(capturedCreateData.voucherMinOrderAmount).toBe(20000);
      expect(capturedCreateData.voucherMaxDiscountAmount).toBe(100000);

      const createMany = jest.fn().mockResolvedValue({ count: 1 });
      await refundOrderResources(
        {
          userVoucher: {
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
            createMany,
          },
        },
        {
          id: 99,
          userId: 5,
          discountCode: 'FREE100',
          voucherDeducted: true,
          voucherDiscountPercent: 100,
          voucherMinOrderAmount: 20000,
          voucherMaxDiscountAmount: 100000,
        },
        { performedBy: 'Admin', notePrefix: 'Hoàn kho' },
      );
      expect(createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [
            expect.objectContaining({
              code: 'FREE100',
              discountPercent: 100,
              minOrderAmount: 20000,
              maxDiscountAmount: 100000,
            }),
          ],
        }),
      );
    });

    it('C-02 & LOW-5 & Phần 4.2: ZaloPay redirect uses WEB_URL env, callback checks app_trans_id vs embed_data and numeric amount===0', async () => {
      const prevEnv = process.env;
      process.env = {
        ...prevEnv,
        ZALOPAY_APP_ID: '2554',
        ZALOPAY_KEY1: 'key1_secret',
        ZALOPAY_KEY2: 'key2_secret',
        ZALOPAY_ENDPOINT: 'https://custom-zalo.example/v2/create',
        WEB_URL: 'https://brewlite.example.com/',
      };
      delete process.env.ZALOPAY_CREATE_ENDPOINT;
      const zaloSvc = new ZaloPayService();
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ return_code: 1, order_url: 'https://sb.zalo/pay', zp_trans_token: 'tok' }),
      } as any);

      try {
        await zaloSvc.createOrder({ orderId: 12, amount: 50000 });
        expect(fetchSpy.mock.calls[0][0]).toBe('https://custom-zalo.example/v2/create');
        const formBody = new URLSearchParams(String(fetchSpy.mock.calls[0][1]?.body || ''));
        const sentEmbed = JSON.parse(formBody.get('embed_data') || '{}');
        expect(sentEmbed.redirecturl).toBe('https://brewlite.example.com/order-confirmation?orderId=12');

        const prisma: any = {
          order: {
            findUnique: jest.fn().mockResolvedValue({
              id: 12,
              userId: 1,
              status: OrderStatus.PENDING,
              totalAmount: 0,
              createdAt: new Date(),
            }),
          },
        };
        const paymentsSvc = new PaymentsService(prisma, undefined, zaloSvc);

        const mismatchPayload = JSON.stringify({
          app_trans_id: '261115_99_111111',
          amount: 0,
          embed_data: JSON.stringify({ orderId: 12 }),
        });
        const mismatchMac = createHmac('sha256', 'key2_secret').update(mismatchPayload).digest('hex');
        const mismatchRes = await paymentsSvc.handleZaloPayCallback({
          data: mismatchPayload,
          mac: mismatchMac,
        });
        expect(mismatchRes.return_code).toBe(0);
        expect(mismatchRes.return_message).toContain('does not match');

        await expect(
          paymentsSvc.createZaloPayOrder(12, 1, Role.CUSTOMER),
        ).rejects.toThrow(BadRequestException);
      } finally {
        fetchSpy.mockRestore();
        process.env = prevEnv;
      }
    });

    it('LOW-1: containsUnsafeHtml flags script/event payloads while allowing normal Vietnamese names', () => {
      expect(containsUnsafeHtml('<script>alert(1)</script>')).toBe(true);
      expect(containsUnsafeHtml('<img src=x onerror=alert(1)>')).toBe(true);
      expect(containsUnsafeHtml('<details open ontoggle=alert(1)>')).toBe(true);
      expect(containsUnsafeHtml('Nguyễn Văn A (Quận 1)')).toBe(false);
    });
  });

  describe('Security Audit Fixes — 7 Vulnerability Regression Suite', () => {
    it('Bug #3 (Loyalty): awards 0 points on PAID (processPayment & ZaloPay) and awards points only on COMPLETED without PAID->CANCELLED clawback', async () => {
      const userUpdate = jest.fn().mockResolvedValue({});
      const txOrder = {
        id: 201,
        userId: 11,
        totalAmount: 50000,
        status: OrderStatus.PENDING,
        version: 0,
        createdAt: new Date(),
      };
      const prismaPay: any = {
        order: {
          findUnique: jest.fn().mockResolvedValue(txOrder),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        payment: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({
            id: 501,
            orderId: 201,
            amount: 50000,
            method: PaymentMethod.EWALLET,
            status: PaymentStatus.SUCCESS,
          }),
        },
        user: { update: userUpdate },
        $transaction: jest.fn(async (cb: any) => cb(prismaPay)),
      };
      const gateway: any = {
        charge: jest.fn().mockResolvedValue({ success: true, transactionId: 'GW-201' }),
      };

      const payRes = await new PaymentsService(prismaPay, gateway).processPayment(
        { orderId: 201, method: PaymentMethod.EWALLET },
        11,
      );
      expect(payRes.pointsEarned).toBe(0);
      expect(userUpdate).not.toHaveBeenCalled();

      // ZaloPay callback -> PAID also does not award loyalty points
      const zaloSvc = new ZaloPayService();
      const cbPayload = JSON.stringify({
        app_trans_id: '261115_201_999',
        amount: 50000,
        zp_trans_id: 777001,
      });
      const cbMac = createHmac('sha256', zaloSvc.key2).update(cbPayload).digest('hex');
      const cbRes = await new PaymentsService(prismaPay, undefined, zaloSvc).handleZaloPayCallback({
        data: cbPayload,
        mac: cbMac,
      });
      expect(cbRes.return_code).toBe(1);
      expect(userUpdate).not.toHaveBeenCalled();

      // PAID -> CANCELLED does not touch user loyalty points
      const ordersPrisma: any = {
        order: {
          findUnique: jest.fn().mockResolvedValue({
            id: 201,
            userId: 11,
            totalAmount: 50000,
            status: OrderStatus.PAID,
            items: [],
          }),
        },
        user: { findUnique: jest.fn().mockResolvedValue({ id: 99, fullName: 'Staff' }) },
        $transaction: jest.fn(async (cb: any) =>
          cb({
            order: {
              updateMany: jest.fn().mockResolvedValue({ count: 1 }),
              findUnique: jest.fn().mockResolvedValue({
                id: 201,
                userId: 11,
                totalAmount: 50000,
                status: OrderStatus.CANCELLED,
                updatedAt: new Date(),
              }),
            },
            user: { update: userUpdate, updateMany: jest.fn() },
          }),
        ),
      };
      const ordersSvc = new OrdersService(ordersPrisma);
      await ordersSvc.updateOrderStatus(201, OrderStatus.CANCELLED, 99, Role.STAFF);
      expect(userUpdate).not.toHaveBeenCalled();

      // READY -> COMPLETED awards floor(50000 / 1000) = 50 points
      ordersPrisma.order.findUnique.mockResolvedValueOnce({
        id: 202,
        userId: 11,
        totalAmount: 50000,
        status: OrderStatus.READY,
        items: [],
      });
      ordersPrisma.$transaction.mockImplementationOnce(async (cb: any) =>
        cb({
          order: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            findUnique: jest.fn().mockResolvedValue({
              id: 202,
              userId: 11,
              totalAmount: 50000,
              status: OrderStatus.COMPLETED,
              updatedAt: new Date(),
            }),
          },
          user: { update: userUpdate },
        }),
      );
      const completeRes = await ordersSvc.updateOrderStatus(202, OrderStatus.COMPLETED, 99, Role.STAFF);
      expect((completeRes as any).pointsEarned).toBe(50);
      expect(userUpdate).toHaveBeenCalledWith({
        where: { id: 11 },
        data: { loyaltyPoints: { increment: 50 } },
      });
    });

    it('Bug #2 (Voucher): blocks personal UserVoucher when DiscountCode is inactive, blocks repeated global DiscountCode use, and blocks guest voucher use', async () => {
      const basePrisma = (txOverrides: any): any => ({
        product: {
          findMany: jest.fn().mockResolvedValue([
            { id: 1, name: 'Coffee', basePrice: 40000, category: 'vietnamese', isActive: true },
          ]),
        },
        toppingRecipe: { findMany: jest.fn().mockResolvedValue([]) },
        storeSetting: { findMany: jest.fn().mockResolvedValue([]) },
        $transaction: jest.fn(async (cb: any) =>
          cb({
            $queryRaw: jest.fn(),
            order: { count: jest.fn().mockResolvedValue(0) },
            userVoucher: { findUnique: jest.fn().mockResolvedValue(null) },
            discountCode: { findUnique: jest.fn().mockResolvedValue(null) },
            recipe: { findMany: jest.fn().mockResolvedValue([]) },
            ingredient: { findMany: jest.fn().mockResolvedValue([]) },
            ...txOverrides,
          }),
        ),
      });

      // 1) Personal voucher deactivated at DiscountCode level
      const svcInactivePersonal = new OrdersService(
        basePrisma({
          userVoucher: {
            findUnique: jest.fn().mockResolvedValue({
              id: 5,
              userId: 10,
              code: 'REWARD10',
              quantity: 1,
              discountPercent: 10,
              minOrderAmount: 0,
              maxDiscountAmount: 20000,
            }),
          },
          discountCode: {
            findUnique: jest.fn().mockResolvedValue({ code: 'REWARD10', isActive: false }),
          },
        }),
      );
      await expect(
        svcInactivePersonal.createOrder(
          { items: [{ productId: 1, size: 'M', toppings: [], quantity: 1 }], discountCode: 'REWARD10' },
          10,
        ),
      ).rejects.toThrow(BadRequestException);

      // 2) Repeat use of global DiscountCode by same user
      const svcRepeatGlobal = new OrdersService(
        basePrisma({
          discountCode: {
            findUnique: jest.fn().mockResolvedValue({
              id: 2,
              code: 'BREW10',
              isActive: true,
              discountPercent: 10,
              minOrderAmount: 0,
              maxDiscountAmount: 20000,
            }),
          },
          order: { count: jest.fn().mockResolvedValue(1) },
        }),
      );
      await expect(
        svcRepeatGlobal.createOrder(
          { items: [{ productId: 1, size: 'M', toppings: [], quantity: 1 }], discountCode: 'BREW10' },
          10,
        ),
      ).rejects.toThrow(BadRequestException);

      // 3) Guest user attempting to use DiscountCode
      await expect(
        svcRepeatGlobal.createOrder(
          { items: [{ productId: 1, size: 'M', toppings: [], quantity: 1 }], discountCode: 'BREW10' },
          undefined as any,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('Bug #1 (ZaloPay): handles missing/non-string callback fields without 500, rejects blank/unconfigured verifyCallback, and blocks cross-order P2002 collision', async () => {
      const zaloSvc = new ZaloPayService();
      expect(zaloSvc.verifyCallback('', 'abc')).toBe(false);
      expect(zaloSvc.verifyCallback('   ', '   ')).toBe(false);

      const prevEnv = process.env;
      try {
        process.env = { ...prevEnv, NODE_ENV: 'production' };
        delete process.env.ZALOPAY_KEY2;
        delete process.env.ALLOW_SANDBOX_CONFIRM;
        expect(() => zaloSvc.verifyCallback('{"a":1}', 'abcd')).toThrow(
          /Missing ZALOPAY_KEY1 or ZALOPAY_KEY2 in production environment/,
        );
      } finally {
        process.env = prevEnv;
      }

      const prismaMissing: any = { order: { findUnique: jest.fn() } };
      const paySvc = new PaymentsService(prismaMissing, undefined, zaloSvc);

      expect(await paySvc.handleZaloPayCallback(undefined as any)).toEqual({
        return_code: -1,
        return_message: 'invalid callback payload',
      });
      expect(await paySvc.handleZaloPayCallback({ data: { forged: true } as any, mac: 'abc' })).toEqual({
        return_code: -1,
        return_message: 'invalid callback payload',
      });
      expect(await paySvc.handleZaloPayCallback({ data: '{}', mac: '   ' })).toEqual({
        return_code: -1,
        return_message: 'invalid callback payload',
      });

      // Cross-order P2002 collision: zp_trans_id already used on order #99
      const p2002Err: any = new Error('Unique constraint failed');
      p2002Err.code = 'P2002';
      const txMock: any = {
        $executeRawUnsafe: jest.fn(),
        order: {
          findUnique: jest.fn().mockResolvedValue({
            id: 20,
            userId: 5,
            status: OrderStatus.PENDING,
            totalAmount: 50000,
            createdAt: new Date(),
            items: [],
          }),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        payment: {
          create: jest.fn().mockRejectedValue(p2002Err),
          findUnique: jest.fn().mockResolvedValue({ id: 1, orderId: 99, idempotencyKey: 'ZALOPAY_55555' }),
        },
      };
      const collisionPrisma: any = {
        order: txMock.order,
        $transaction: jest.fn(async (cb: any) => cb(txMock)),
      };
      const collisionZalo: any = {
        verifyCallback: jest.fn().mockReturnValue(true),
        queryStatus: jest.fn().mockResolvedValue({
          returnCode: 1,
          amount: 50000,
          zpTransId: 55555,
          isProcessing: false,
          returnMessage: 'ok',
        }),
      };
      const collisionPaySvc = new PaymentsService(collisionPrisma, undefined, collisionZalo);
      const cbPayload = JSON.stringify({
        app_trans_id: '261115_20_111',
        amount: 50000,
        zp_trans_id: 55555,
      });
      const collisionCb = await collisionPaySvc.handleZaloPayCallback({ data: cbPayload, mac: 'valid' });
      expect(collisionCb.return_code).toBe(0);
      expect(collisionCb.return_message).toContain('#99');

      await expect(
        collisionPaySvc.getZaloPayStatus(20, 5, '261115_20_111', Role.CUSTOMER),
      ).rejects.toThrow(ConflictException);
    });

    it('Bug #4 (BOM): rejects createOrder when ordered product/size lacks a BOM recipe while DB has recipes configured', async () => {
      // Case A: recipe table has recipes configured (count > 0), none for product #2 size L
      const prismaCountMock: any = {
        product: {
          findMany: jest.fn().mockResolvedValue([
            { id: 2, name: 'Latte Mới', basePrice: 45000, category: 'espresso', isActive: true },
          ]),
        },
        toppingRecipe: { findMany: jest.fn().mockResolvedValue([]) },
        storeSetting: { findMany: jest.fn().mockResolvedValue([]) },
        $transaction: jest.fn(async (cb: any) =>
          cb({
            $queryRaw: jest.fn(),
            recipe: {
              findMany: jest.fn().mockResolvedValue([]),
              count: jest.fn().mockResolvedValue(5),
            },
            toppingRecipe: { findMany: jest.fn().mockResolvedValue([]) },
            product: { findMany: jest.fn().mockResolvedValue([{ id: 2, category: 'espresso' }]) },
            ingredient: { findMany: jest.fn().mockResolvedValue([]) },
          }),
        ),
      };
      await expect(
        new OrdersService(prismaCountMock).createOrder(
          { items: [{ productId: 2, size: 'L', toppings: [], quantity: 1 }] },
          1,
        ),
      ).rejects.toThrow(BadRequestException);

      // Case B: matchedProduct.recipes is explicitly []
      const prismaEmptyRecipesProp: any = {
        product: {
          findMany: jest.fn().mockResolvedValue([
            { id: 3, name: 'Trà Chưa Cấu Hình', basePrice: 35000, category: 'tea', isActive: true, recipes: [] },
          ]),
        },
        toppingRecipe: { findMany: jest.fn().mockResolvedValue([]) },
        storeSetting: { findMany: jest.fn().mockResolvedValue([]) },
      };
      await expect(
        new OrdersService(prismaEmptyRecipesProp).createOrder(
          { items: [{ productId: 3, size: 'M', toppings: [], quantity: 1 }] },
          1,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('Bug #5 (RBAC deleteOrder): blocks STAFF deleting another user order while allowing ADMIN or owner', async () => {
      const makePrisma = (orderOwnerId: number): any => ({
        order: {
          findUnique: jest.fn().mockResolvedValue({
            id: 50,
            userId: orderOwnerId,
            status: OrderStatus.CANCELLED,
            items: [],
          }),
        },
        $transaction: jest.fn(async (cb: any) =>
          cb({
            payment: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
            orderItem: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
            order: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
          }),
        ),
      });

      await expect(
        new OrdersService(makePrisma(77)).deleteOrder(50, 99, Role.STAFF),
      ).rejects.toThrow(ForbiddenException);

      const adminRes = await new OrdersService(makePrisma(77)).deleteOrder(50, 1, Role.ADMIN);
      expect(adminRes.success).toBe(true);

      const ownerRes = await new OrdersService(makePrisma(77)).deleteOrder(50, 77, Role.CUSTOMER);
      expect(ownerRes.success).toBe(true);
    });

    it('Bug #6 (Auth): normalizes email on register/login, rejects whitespace passwords, and returns new accessToken on password change', async () => {
      const existingHash = await bcrypt.hash('OldPass123', 10);
      const prisma: any = {
        user: {
          findUnique: jest.fn(),
          create: jest.fn().mockImplementation(async ({ data }: any) => ({
            id: 42,
            ...data,
            isActive: true,
            loyaltyPoints: 0,
            tokenVersion: 0,
            createdAt: new Date(),
          })),
          update: jest.fn().mockResolvedValue({
            id: 42,
            email: 'user@brewlite.vn',
            fullName: 'Test User',
            phone: null,
            role: Role.CUSTOMER,
            isActive: true,
            loyaltyPoints: 0,
            createdAt: new Date(),
          }),
        },
      };
      const jwt: any = { sign: jest.fn().mockReturnValue('signed-token-v4') };
      const authSvc = new AuthService(prisma, jwt);

      // Register normalizes email
      prisma.user.findUnique.mockResolvedValueOnce(null);
      const regRes = await authSvc.register({
        email: '  User@BrewLite.VN  ',
        password: 'ValidPassword1',
        fullName: '  Nguyen Van A ',
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'user@brewlite.vn' } });
      expect(regRes.user.email).toBe('user@brewlite.vn');

      // Login normalizes email
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 42,
        email: 'user@brewlite.vn',
        passwordHash: existingHash,
        role: Role.CUSTOMER,
        isActive: true,
        tokenVersion: 3,
      });
      const loginRes = await authSvc.login({ email: '  USER@BREWLITE.VN  ', password: 'OldPass123' });
      expect(prisma.user.findUnique).toHaveBeenLastCalledWith({ where: { email: 'user@brewlite.vn' } });
      expect(loginRes.accessToken).toBe('signed-token-v4');

      // Whitespace-only password rejected in service + DTOs
      await expect(
        authSvc.register({ email: 'a@b.com', password: '      ', fullName: 'A' }),
      ).rejects.toThrow(BadRequestException);

      prisma.user.findUnique.mockResolvedValueOnce({
        id: 42,
        email: 'user@brewlite.vn',
        passwordHash: existingHash,
        role: Role.CUSTOMER,
        tokenVersion: 3,
      });
      await expect(
        authSvc.updateProfile(42, { currentPassword: 'OldPass123', newPassword: '      ' }),
      ).rejects.toThrow(BadRequestException);

      const regDtoErrors = await validate(
        plainToInstance(RegisterDto, { email: 'a@b.com', password: '      ', fullName: 'Nguyen A' }),
      );
      expect(regDtoErrors.length).toBeGreaterThan(0);

      const updDtoErrors = await validate(
        plainToInstance(UpdateProfileDto, { currentPassword: 'OldPass123', newPassword: '      ' }),
      );
      expect(updDtoErrors.length).toBeGreaterThan(0);

      // updateProfile issues new accessToken with incremented tokenVersion when password changes
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 42,
        email: 'user@brewlite.vn',
        passwordHash: existingHash,
        role: Role.CUSTOMER,
        tokenVersion: 3,
      });
      const profRes: any = await authSvc.updateProfile(42, {
        currentPassword: 'OldPass123',
        newPassword: 'NewStrongPassword9!',
      });
      expect(profRes.accessToken).toBe('signed-token-v4');
      expect(jwt.sign).toHaveBeenLastCalledWith(
        expect.objectContaining({ sub: 42, tokenVersion: 4 }),
      );
    });

    it('Bug #7 (Type guard & DTO): rejects non-string appTransId cleanly and blocks duplicate/HTML toppings in OrderItemDto', async () => {
      const prisma: any = {
        order: {
          findUnique: jest.fn().mockResolvedValue({
            id: 15,
            userId: 5,
            status: OrderStatus.PENDING,
            totalAmount: 50000,
          }),
        },
      };
      const paySvc = new PaymentsService(prisma, undefined, new ZaloPayService());

      await expect(
        paySvc.getZaloPayStatus(15, 5, ['261115_15_1', 'other'] as any, Role.CUSTOMER),
      ).rejects.toThrow(BadRequestException);
      await expect(
        paySvc.confirmZaloPaySandbox(15, 5, Role.CUSTOMER, { malicious: true } as any),
      ).rejects.toThrow(BadRequestException);

      const dupToppingsErrors = await validate(
        plainToInstance(OrderItemDto, {
          productId: 1,
          size: 'M',
          toppings: ['Trân châu trắng', '  trân châu trắng  '],
          quantity: 1,
        }),
      );
      expect(dupToppingsErrors.some((e) => e.property === 'toppings')).toBe(true);

      const xssItemErrors = await validate(
        plainToInstance(OrderItemDto, {
          productId: 1,
          productName: '<script>alert(1)</script>',
          size: 'M',
          toppings: ['<img src=x onerror=alert(1)>'],
          quantity: 1,
        }),
      );
      expect(xssItemErrors.some((e) => e.property === 'productName')).toBe(true);
      expect(xssItemErrors.some((e) => e.property === 'toppings')).toBe(true);
    });

    it('Final Pass — normalizes/rejects malformed Idempotency-Key, blocks whitespace-only Product/Customer/Redeem DTOs, and filters inactive DiscountCodes from wallet', async () => {
      // 1. Idempotency-Key: whitespace-only is ignored (no findUnique lookup), duplicate header array -> 400
      const orderPrisma: any = {
        order: {
          findUnique: jest.fn(),
        },
        product: {
          findMany: jest.fn().mockResolvedValue([]),
        },
        toppingRecipe: { findMany: jest.fn().mockResolvedValue([]) },
        storeSetting: { findMany: jest.fn().mockResolvedValue([]) },
      };
      const ordersSvc = new OrdersService(orderPrisma);
      await expect(
        ordersSvc.createOrder(
          { items: [{ productId: 1, size: 'M', toppings: [], quantity: 1 }] },
          1,
          ['k1', 'k2'] as any,
        ),
      ).rejects.toThrow(BadRequestException);

      // Whitespace-only idempotencyKey should NOT query userId_idempotencyKey
      await expect(
        ordersSvc.createOrder(
          { items: [{ productId: 999, size: 'M', toppings: [], quantity: 1 }] },
          1,
          '   ',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(orderPrisma.order.findUnique).not.toHaveBeenCalled();

      const payPrisma: any = {
        order: {
          findUnique: jest.fn().mockResolvedValue({
            id: 1,
            userId: 1,
            status: OrderStatus.CANCELLED,
            totalAmount: 30000,
          }),
        },
        payment: { findUnique: jest.fn() },
      };
      const paySvc = new PaymentsService(payPrisma);
      await expect(
        paySvc.processPayment({ orderId: 1, method: PaymentMethod.EWALLET }, 1, ['k1', 'k2'] as any),
      ).rejects.toThrow(BadRequestException);
      await expect(
        paySvc.processPayment({ orderId: 1, method: PaymentMethod.EWALLET }, 1, '   '),
      ).rejects.toThrow(BadRequestException);
      expect(payPrisma.payment.findUnique).not.toHaveBeenCalled();

      // 2. Whitespace-only & XSS DTO checks for Product, Customer, RedeemPoints
      const prodCreateErrs = await validate(
        plainToInstance(CreateProductDto, { name: '   ', basePrice: 30000 }),
      );
      expect(prodCreateErrs.some((e) => e.property === 'name')).toBe(true);

      const prodUpdErrs = await validate(plainToInstance(UpdateProductDto, { name: '   ' }));
      expect(prodUpdErrs.some((e) => e.property === 'name')).toBe(true);

      const custCreateErrs = await validate(
        plainToInstance(CreateCustomerDto, {
          email: 'c@brewlite.vn',
          fullName: '   ',
          password: '      ',
        }),
      );
      expect(custCreateErrs.some((e) => e.property === 'fullName')).toBe(true);
      expect(custCreateErrs.some((e) => e.property === 'password')).toBe(true);

      const custUpdErrs = await validate(
        plainToInstance(UpdateCustomerDto, { fullName: '   ', password: '      ' }),
      );
      expect(custUpdErrs.some((e) => e.property === 'fullName')).toBe(true);
      expect(custUpdErrs.some((e) => e.property === 'password')).toBe(true);

      const redeemErrs = await validate(
        plainToInstance(RedeemPointsDto, {
          points: 10,
          voucherCode: '   ',
          description: '<script>alert(1)</script>',
        }),
      );
      expect(redeemErrs.some((e) => e.property === 'voucherCode')).toBe(true);
      expect(redeemErrs.some((e) => e.property === 'description')).toBe(true);

      // 3. Inactive DiscountCode vouchers hidden in getUserVouchers & getProfile
      const authPrisma: any = {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 1,
            email: 'u@brewlite.vn',
            fullName: 'User',
            phone: null,
            role: Role.CUSTOMER,
            isActive: true,
            loyaltyPoints: 50,
            createdAt: new Date(),
            vouchers: [
              { id: 1, code: 'BREW10', quantity: 1 },
              { id: 2, code: 'DISABLED_CODE', quantity: 1 },
            ],
          }),
        },
        userVoucher: {
          findMany: jest.fn().mockResolvedValue([
            { id: 1, code: 'BREW10', quantity: 1 },
            { id: 2, code: 'DISABLED_CODE', quantity: 1 },
          ]),
        },
        discountCode: {
          findMany: jest.fn().mockResolvedValue([{ code: 'DISABLED_CODE' }]),
        },
      };
      const authSvc = new AuthService(authPrisma, { sign: jest.fn() } as any);
      const wallet = await authSvc.getUserVouchers(1);
      expect(wallet.map((v: any) => v.code)).toEqual(['BREW10']);
      const profile = await authSvc.getProfile(1);
      expect(profile.vouchers.map((v: any) => v.code)).toEqual(['BREW10']);
    });
  });
});
