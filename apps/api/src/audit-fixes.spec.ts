import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';
import { createHmac } from 'crypto';
import { AuthService } from './auth/auth.service';
import { getJwtSecret } from './auth/jwt-secret.helper';
import { JwtStrategy } from './auth/jwt.strategy';
import { ParseInt32Pipe } from './common/pipes/parse-int32.pipe';
import { containsUnsafeHtml } from './common/validators/no-unsafe-html.validator';
import { InventoryService } from './inventory/inventory.service';
import { refundOrderResources } from './orders/order-refund.helper';
import { OrdersService } from './orders/orders.service';
import { PaymentsService } from './payments/payments.service';
import { ZaloPayService } from './payments/zalopay.service';
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
});
