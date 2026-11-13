import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { OrderStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { PrismaService } from '../prisma/prisma.service';

const runInt = process.env.TEST_DATABASE_URL ? describe : describe.skip;

runInt('Security & Concurrency Integration (Real PostgreSQL)', () => {
  jest.setTimeout(30000);
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let baseUrl: string;

  const savedEnv = {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    MOCK_PAYMENT_MODE: process.env.MOCK_PAYMENT_MODE,
    NODE_ENV: process.env.NODE_ENV,
    ALLOW_SANDBOX_CONFIRM: process.env.ALLOW_SANDBOX_CONFIRM,
  };

  let activeBeverageId: number;
  let inactiveBeverageId: number;
  let bakeryProductId: number;
  let beverageIngredientId: number;
  let bakeryIngredientId: number;
  let rootAdmin: { id: number; email: string; fullName: string | null; passwordHash: string };
  let nonRootAdmin: { id: number; email: string };
  let staffUser: { id: number; email: string };
  let customerUser: { id: number; email: string };

  async function truncateAll(): Promise<void> {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "Payment",
        "OrderItem",
        "Order",
        "UserVoucher",
        "InventoryLog",
        "Recipe",
        "ToppingRecipe",
        "Product",
        "Ingredient",
        "DiscountCode",
        "StoreSetting",
        "User"
      RESTART IDENTITY CASCADE
    `);
  }

  function signToken(user: { id: number; email: string; role: Role }): string {
    return jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async function requestJson(
    method: string,
    path: string,
    options?: {
      token?: string;
      body?: unknown;
      headers?: Record<string, string>;
    },
  ): Promise<{ status: number; data: any }> {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(options?.body !== undefined
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...(options?.headers ?? {}),
      },
      body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    return { status: res.status, data };
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.JWT_SECRET =
      process.env.JWT_SECRET || 'test_jwt_secret_key_at_least_16_chars';
    process.env.MOCK_PAYMENT_MODE = process.env.MOCK_PAYMENT_MODE || 'success';
    process.env.NODE_ENV = 'test';

    const [{ AppModule }, { AuthModule }, { PrismaService }] = await Promise.all([
      import('../app.module'),
      import('../auth/auth.module'),
      import('../prisma/prisma.service'),
    ]);

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();

    prisma = app.get(PrismaService);
    jwtService = app.select(AuthModule).get(JwtService);

    await truncateAll();

    const passwordHash = await bcrypt.hash('TestPass123!', 10);

    const [createdRoot, createdOtherAdmin, createdStaff, createdCustomer] =
      await Promise.all([
        prisma.user.create({
          data: {
            email: 'admin@brewlite.vn',
            passwordHash,
            fullName: 'Root Admin',
            role: Role.ADMIN,
            isActive: true,
          },
        }),
        prisma.user.create({
          data: {
            email: 'secondary-admin@brewlite.vn',
            passwordHash,
            fullName: 'Secondary Admin',
            role: Role.ADMIN,
            isActive: true,
          },
        }),
        prisma.user.create({
          data: {
            email: 'staff-main@brewlite.vn',
            passwordHash,
            fullName: 'Staff Main',
            role: Role.STAFF,
            isActive: true,
          },
        }),
        prisma.user.create({
          data: {
            email: 'customer-main@brewlite.vn',
            passwordHash,
            fullName: 'Customer Main',
            role: Role.CUSTOMER,
            isActive: true,
            loyaltyPoints: 200,
          },
        }),
      ]);

    rootAdmin = createdRoot;
    nonRootAdmin = createdOtherAdmin;
    staffUser = createdStaff;
    customerUser = createdCustomer;

    const [bevIng, bakeIng] = await Promise.all([
      prisma.ingredient.create({
        data: {
          code: 'ING_COFFEE_TEST',
          name: 'Cà phê hạt Test',
          unit: 'g',
          stock: 100000,
          minThreshold: 100,
          costPerUnit: 200,
          type: 'INGREDIENT',
          isRequiredForSale: true,
        },
      }),
      prisma.ingredient.create({
        data: {
          code: 'ING_PAIN_TEST',
          name: 'Bánh Test',
          unit: 'chiếc',
          stock: 10000,
          minThreshold: 10,
          costPerUnit: 15000,
          type: 'INGREDIENT',
          isRequiredForSale: true,
        },
      }),
    ]);

    beverageIngredientId = bevIng.id;
    bakeryIngredientId = bakeIng.id;

    const [activeBev, inactiveBev, bakery] = await Promise.all([
      prisma.product.create({
        data: {
          name: 'Cà phê Sữa Test',
          basePrice: 35000,
          category: 'vietnamese',
          isActive: true,
          recipes: {
            create: [
              { ingredientId: beverageIngredientId, size: 'S', amount: 15 },
              { ingredientId: beverageIngredientId, size: 'M', amount: 20 },
              { ingredientId: beverageIngredientId, size: 'L', amount: 25 },
            ],
          },
        },
      }),
      prisma.product.create({
        data: {
          name: 'Sản phẩm ẩn Test',
          basePrice: 40000,
          category: 'vietnamese',
          isActive: false,
          recipes: {
            create: [
              { ingredientId: beverageIngredientId, size: 'M', amount: 20 },
            ],
          },
        },
      }),
      prisma.product.create({
        data: {
          name: 'Bánh Pain au Chocolat Test',
          basePrice: 39000,
          category: 'bakery',
          isActive: true,
          recipes: {
            create: [
              { ingredientId: bakeryIngredientId, size: 'ALL', amount: 1 },
            ],
          },
        },
      }),
    ]);

    activeBeverageId = activeBev.id;
    inactiveBeverageId = inactiveBev.id;
    bakeryProductId = bakery.id;
  }, 60000);

  afterAll(async () => {
    if (prisma) {
      await truncateAll().catch(() => undefined);
    }
    if (app) {
      await app.close();
    }
    process.env.DATABASE_URL = savedEnv.DATABASE_URL;
    process.env.JWT_SECRET = savedEnv.JWT_SECRET;
    process.env.MOCK_PAYMENT_MODE = savedEnv.MOCK_PAYMENT_MODE;
    process.env.NODE_ENV = savedEnv.NODE_ENV;
    if (savedEnv.ALLOW_SANDBOX_CONFIRM === undefined) {
      delete process.env.ALLOW_SANDBOX_CONFIRM;
    } else {
      process.env.ALLOW_SANDBOX_CONFIRM = savedEnv.ALLOW_SANDBOX_CONFIRM;
    }
  }, 30000);

  it('1. [BE-C01] locked or deleted STAFF/ADMIN token is rejected on /auth/me and treated as anonymous on /products', async () => {
    const passwordHash = await bcrypt.hash('LockTest123!', 10);
    const lockedStaff = await prisma.user.create({
      data: {
        email: 'locked-staff@brewlite.vn',
        passwordHash,
        fullName: 'Locked Staff',
        role: Role.STAFF,
        isActive: true,
      },
    });
    const lockedAdmin = await prisma.user.create({
      data: {
        email: 'locked-admin@brewlite.vn',
        passwordHash,
        fullName: 'Locked Admin',
        role: Role.ADMIN,
        isActive: true,
      },
    });

    const lockedStaffToken = signToken({
      id: lockedStaff.id,
      email: lockedStaff.email,
      role: Role.STAFF,
    });
    const lockedAdminToken = signToken({
      id: lockedAdmin.id,
      email: lockedAdmin.email,
      role: Role.ADMIN,
    });

    // Sanity check while active ADMIN: includes inactive items and COGS/recipes
    const preLockAdminList = await requestJson(
      'GET',
      '/products?includeInactive=true',
      { token: lockedAdminToken },
    );
    expect(preLockAdminList.status).toBe(200);
    expect(
      preLockAdminList.data.data.some((p: any) => p.id === inactiveBeverageId),
    ).toBe(true);
    const preLockActiveItem = preLockAdminList.data.data.find(
      (p: any) => p.id === activeBeverageId,
    );
    expect(preLockActiveItem.recipes).toBeDefined();
    expect(preLockActiveItem.cogsSizeS).toBeDefined();

    // Lock both accounts
    await prisma.user.updateMany({
      where: { id: { in: [lockedStaff.id, lockedAdmin.id] } },
      data: { isActive: false },
    });

    for (const token of [lockedStaffToken, lockedAdminToken]) {
      const meRes = await requestJson('GET', '/auth/me', { token });
      expect(meRes.status).toBe(401);

      const listRes = await requestJson(
        'GET',
        '/products?includeInactive=true',
        { token },
      );
      expect(listRes.status).toBe(200);
      expect(
        listRes.data.data.some((p: any) => p.id === inactiveBeverageId),
      ).toBe(false);
      const activeItem = listRes.data.data.find(
        (p: any) => p.id === activeBeverageId,
      );
      expect(activeItem).toBeDefined();
      expect(activeItem.recipes).toBeUndefined();
      expect(activeItem.cogsSizeS).toBeUndefined();
      expect(activeItem.cogsSizeM).toBeUndefined();
      expect(activeItem.cogsSizeL).toBeUndefined();

      const activeDetailRes = await requestJson(
        'GET',
        `/products/${activeBeverageId}`,
        { token },
      );
      expect(activeDetailRes.status).toBe(200);
      expect(activeDetailRes.data.data.recipes).toBeUndefined();
      expect(activeDetailRes.data.data.cogsSizeS).toBeUndefined();
      expect(activeDetailRes.data.data.cogsSizeM).toBeUndefined();
      expect(activeDetailRes.data.data.cogsSizeL).toBeUndefined();

      const inactiveDetailRes = await requestJson(
        'GET',
        `/products/${inactiveBeverageId}`,
        { token },
      );
      expect(inactiveDetailRes.status).toBe(404);
    }

    // Deleted STAFF and ADMIN users
    const deletedStaff = await prisma.user.create({
      data: {
        email: 'deleted-staff@brewlite.vn',
        passwordHash,
        fullName: 'Deleted Staff',
        role: Role.STAFF,
        isActive: true,
      },
    });
    const deletedAdmin = await prisma.user.create({
      data: {
        email: 'deleted-admin@brewlite.vn',
        passwordHash,
        fullName: 'Deleted Admin',
        role: Role.ADMIN,
        isActive: true,
      },
    });

    const deletedStaffToken = signToken({
      id: deletedStaff.id,
      email: deletedStaff.email,
      role: Role.STAFF,
    });
    const deletedAdminToken = signToken({
      id: deletedAdmin.id,
      email: deletedAdmin.email,
      role: Role.ADMIN,
    });

    await prisma.user.deleteMany({
      where: { id: { in: [deletedStaff.id, deletedAdmin.id] } },
    });

    for (const token of [deletedStaffToken, deletedAdminToken]) {
      const meRes = await requestJson('GET', '/auth/me', { token });
      expect(meRes.status).toBe(401);

      const listRes = await requestJson(
        'GET',
        '/products?includeInactive=true',
        { token },
      );
      expect(listRes.status).toBe(200);
      expect(
        listRes.data.data.some((p: any) => p.id === inactiveBeverageId),
      ).toBe(false);
      const activeItem = listRes.data.data.find(
        (p: any) => p.id === activeBeverageId,
      );
      expect(activeItem).toBeDefined();
      expect(activeItem.recipes).toBeUndefined();
      expect(activeItem.cogsSizeS).toBeUndefined();
      expect(activeItem.cogsSizeM).toBeUndefined();
      expect(activeItem.cogsSizeL).toBeUndefined();

      const activeDetailRes = await requestJson(
        'GET',
        `/products/${activeBeverageId}`,
        { token },
      );
      expect(activeDetailRes.status).toBe(200);
      expect(activeDetailRes.data.data.recipes).toBeUndefined();
      expect(activeDetailRes.data.data.cogsSizeS).toBeUndefined();
      expect(activeDetailRes.data.data.cogsSizeM).toBeUndefined();
      expect(activeDetailRes.data.data.cogsSizeL).toBeUndefined();

      const inactiveDetailRes = await requestJson(
        'GET',
        `/products/${inactiveBeverageId}`,
        { token },
      );
      expect(inactiveDetailRes.status).toBe(404);
    }
  });

  it('2. [BE-C02] blocks creating ADMIN accounts and blocks non-root users from mutating admin@brewlite.vn', async () => {
    const staffToken = signToken({
      id: staffUser.id,
      email: staffUser.email,
      role: Role.STAFF,
    });
    const nonRootAdminToken = signToken({
      id: nonRootAdmin.id,
      email: nonRootAdmin.email,
      role: Role.ADMIN,
    });
    const rootAdminToken = signToken({
      id: rootAdmin.id,
      email: rootAdmin.email,
      role: Role.ADMIN,
    });

    const staffCreateRes = await requestJson('POST', '/staff', {
      token: staffToken,
      body: {
        email: 'rogue-admin-1@brewlite.vn',
        password: 'Password123!',
        fullName: 'Rogue Admin',
        role: 'ADMIN',
      },
    });
    expect([400, 403]).toContain(staffCreateRes.status);
    expect(staffCreateRes.status).toBe(403);

    const nonRootCreateRes = await requestJson('POST', '/staff', {
      token: nonRootAdminToken,
      body: {
        email: 'rogue-admin-2@brewlite.vn',
        password: 'Password123!',
        fullName: 'Rogue Admin 2',
        role: 'ADMIN',
      },
    });
    expect(nonRootCreateRes.status).toBe(400);

    const rootCreateRes = await requestJson('POST', '/staff', {
      token: rootAdminToken,
      body: {
        email: 'rogue-admin-3@brewlite.vn',
        password: 'Password123!',
        fullName: 'Rogue Admin 3',
        role: 'ADMIN',
      },
    });
    expect(rootCreateRes.status).toBe(400);

    const staffPatchRoot = await requestJson('PATCH', `/staff/${rootAdmin.id}`, {
      token: staffToken,
      body: {
        fullName: 'Tampered By Staff',
        password: 'HackedPassword123!',
      },
    });
    expect(staffPatchRoot.status).toBe(403);

    const nonRootPatchRoot = await requestJson(
      'PATCH',
      `/staff/${rootAdmin.id}`,
      {
        token: nonRootAdminToken,
        body: {
          fullName: 'Tampered By NonRoot Admin',
          password: 'HackedPassword123!',
        },
      },
    );
    expect(nonRootPatchRoot.status).toBe(403);

    const freshRoot = await prisma.user.findUnique({
      where: { id: rootAdmin.id },
    });
    expect(freshRoot?.fullName).toBe(rootAdmin.fullName);
    expect(freshRoot?.passwordHash).toBe(rootAdmin.passwordHash);
  });

  it('3. UserVoucher qty: 2 under Promise.all x4 POST /orders allows strictly 2 (201) and rejects 2 (400) with 0 remaining rows', async () => {
    const passwordHash = await bcrypt.hash('TestPass123!', 10);
    const voucherUser2 = await prisma.user.create({
      data: {
        email: 'voucher-qty2@brewlite.vn',
        passwordHash,
        fullName: 'Voucher Qty 2',
        role: Role.CUSTOMER,
        isActive: true,
      },
    });
    await prisma.userVoucher.create({
      data: {
        userId: voucherUser2.id,
        code: 'BREWCOZY',
        quantity: 2,
        discountPercent: 15,
        minOrderAmount: 0,
        maxDiscountAmount: 25000,
      },
    });

    const token = signToken({
      id: voucherUser2.id,
      email: voucherUser2.email,
      role: Role.CUSTOMER,
    });

    const responses = await Promise.all(
      Array.from({ length: 4 }, () =>
        requestJson('POST', '/orders', {
          token,
          body: {
            items: [
              {
                productId: activeBeverageId,
                size: 'M',
                toppings: [],
                quantity: 1,
              },
            ],
            discountCode: 'BREWCOZY',
          },
        }),
      ),
    );

    const statuses = responses.map((r) => r.status);
    expect(statuses.filter((s) => s >= 500)).toHaveLength(0);
    expect(statuses.filter((s) => s === 201)).toHaveLength(2);
    expect(statuses.filter((s) => s === 400)).toHaveLength(2);

    const remainingRows = await prisma.userVoucher.findMany({
      where: { userId: voucherUser2.id, code: 'BREWCOZY' },
    });
    expect(remainingRows).toHaveLength(0);
  });

  it('4. UserVoucher qty: 1 under Promise.all x5 POST /orders allows strictly 1 (201), rejects 4 (400), and produces zero 500s', async () => {
    const passwordHash = await bcrypt.hash('TestPass123!', 10);
    const voucherUser1 = await prisma.user.create({
      data: {
        email: 'voucher-qty1@brewlite.vn',
        passwordHash,
        fullName: 'Voucher Qty 1',
        role: Role.CUSTOMER,
        isActive: true,
      },
    });
    await prisma.userVoucher.create({
      data: {
        userId: voucherUser1.id,
        code: 'BREWCOZY',
        quantity: 1,
        discountPercent: 15,
        minOrderAmount: 0,
        maxDiscountAmount: 25000,
      },
    });

    const token = signToken({
      id: voucherUser1.id,
      email: voucherUser1.email,
      role: Role.CUSTOMER,
    });

    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        requestJson('POST', '/orders', {
          token,
          body: {
            items: [
              {
                productId: activeBeverageId,
                size: 'M',
                toppings: [],
                quantity: 1,
              },
            ],
            discountCode: 'BREWCOZY',
          },
        }),
      ),
    );

    const statuses = responses.map((r) => r.status);
    expect(statuses.filter((s) => s >= 500)).toHaveLength(0);
    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(statuses.filter((s) => s === 400)).toHaveLength(4);

    const remainingRows = await prisma.userVoucher.findMany({
      where: { userId: voucherUser1.id, code: 'BREWCOZY' },
    });
    expect(remainingRows).toHaveLength(0);
  });

  it('5. Max-5 PENDING limit under Promise.all x8 POST /orders allows at most 5 (201) and rejects the rest (400)', async () => {
    const passwordHash = await bcrypt.hash('TestPass123!', 10);
    const hoardUser = await prisma.user.create({
      data: {
        email: 'hoard-user@brewlite.vn',
        passwordHash,
        fullName: 'Hoard User',
        role: Role.CUSTOMER,
        isActive: true,
      },
    });
    const token = signToken({
      id: hoardUser.id,
      email: hoardUser.email,
      role: Role.CUSTOMER,
    });

    const responses = await Promise.all(
      Array.from({ length: 8 }, () =>
        requestJson('POST', '/orders', {
          token,
          body: {
            items: [
              {
                productId: activeBeverageId,
                size: 'M',
                toppings: [],
                quantity: 1,
              },
            ],
          },
        }),
      ),
    );

    const statuses = responses.map((r) => r.status);
    const createdCount = statuses.filter((s) => s === 201).length;
    const rejectedCount = statuses.filter((s) => s === 400).length;

    expect(statuses.filter((s) => s >= 500)).toHaveLength(0);
    expect(createdCount).toBe(5);
    expect(rejectedCount).toBe(3);

    const dbPendingCount = await prisma.order.count({
      where: {
        userId: hoardUser.id,
        status: { in: [OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED] },
      },
    });
    expect(dbPendingCount).toBe(5);
  });

  it('6. Payment & sandbox security: STAFF/ADMIN cannot pay customer order (403) and zalopay/confirm is 403 without ALLOW_SANDBOX_CONFIRM=true even in development', async () => {
    const customerToken = signToken({
      id: customerUser.id,
      email: customerUser.email,
      role: Role.CUSTOMER,
    });
    const staffToken = signToken({
      id: staffUser.id,
      email: staffUser.email,
      role: Role.STAFF,
    });
    const rootAdminToken = signToken({
      id: rootAdmin.id,
      email: rootAdmin.email,
      role: Role.ADMIN,
    });

    const createOrderRes = await requestJson('POST', '/orders', {
      token: customerToken,
      body: {
        items: [
          {
            productId: activeBeverageId,
            size: 'M',
            toppings: [],
            quantity: 1,
          },
        ],
      },
    });
    expect(createOrderRes.status).toBe(201);
    const orderId = createOrderRes.data.id;

    const staffPayRes = await requestJson('POST', '/payments', {
      token: staffToken,
      body: { orderId, method: 'EWALLET' },
    });
    expect(staffPayRes.status).toBe(403);

    const adminPayRes = await requestJson('POST', '/payments', {
      token: rootAdminToken,
      body: { orderId, method: 'EWALLET' },
    });
    expect(adminPayRes.status).toBe(403);

    const prevNodeEnv = process.env.NODE_ENV;
    const prevSandbox = process.env.ALLOW_SANDBOX_CONFIRM;
    try {
      process.env.NODE_ENV = 'development';
      delete process.env.ALLOW_SANDBOX_CONFIRM;

      const confirmRes = await requestJson('POST', '/payments/zalopay/confirm', {
        token: customerToken,
        body: { orderId },
      });
      expect(confirmRes.status).toBe(403);
    } finally {
      process.env.NODE_ENV = prevNodeEnv;
      if (prevSandbox === undefined) {
        delete process.env.ALLOW_SANDBOX_CONFIRM;
      } else {
        process.env.ALLOW_SANDBOX_CONFIRM = prevSandbox;
      }
    }
  });

  it('7. Rejects beverage size ALL (standalone & mixed), inactive DiscountCode redemption, logged ingredient deletion (409), and empty PATCH .../status body (400)', async () => {
    const passwordHash = await bcrypt.hash('TestPass123!', 10);
    const valUser = await prisma.user.create({
      data: {
        email: 'validation-user@brewlite.vn',
        passwordHash,
        fullName: 'Validation User',
        role: Role.CUSTOMER,
        isActive: true,
        loyaltyPoints: 100,
      },
    });
    const valUserToken = signToken({
      id: valUser.id,
      email: valUser.email,
      role: Role.CUSTOMER,
    });
    const rootAdminToken = signToken({
      id: rootAdmin.id,
      email: rootAdmin.email,
      role: Role.ADMIN,
    });

    // 7a. Standalone beverage with size: "ALL" -> 400
    const standaloneAllRes = await requestJson('POST', '/orders', {
      token: valUserToken,
      body: {
        items: [
          {
            productId: activeBeverageId,
            size: 'ALL',
            toppings: [],
            quantity: 1,
          },
        ],
      },
    });
    expect(standaloneAllRes.status).toBe(400);

    // 7b. Mixed bakery (size: "ALL") + beverage (size: "ALL") -> 400
    const mixedAllRes = await requestJson('POST', '/orders', {
      token: valUserToken,
      body: {
        items: [
          {
            productId: bakeryProductId,
            size: 'ALL',
            toppings: [],
            quantity: 1,
          },
          {
            productId: activeBeverageId,
            size: 'ALL',
            toppings: [],
            quantity: 1,
          },
        ],
      },
    });
    expect(mixedAllRes.status).toBe(400);

    // 7c. Inactive DiscountCode on POST /auth/redeem-points -> 400
    await prisma.discountCode.create({
      data: {
        code: 'INACTIVE_PROMO',
        description: 'Inactive Discount',
        discountPercent: 15,
        minOrderAmount: 0,
        maxDiscountAmount: 20000,
        isActive: false,
      },
    });

    const redeemInactiveRes = await requestJson('POST', '/auth/redeem-points', {
      token: valUserToken,
      body: {
        points: 15,
        voucherCode: 'INACTIVE_PROMO',
      },
    });
    expect(redeemInactiveRes.status).toBe(400);
    const reloadedValUser = await prisma.user.findUnique({
      where: { id: valUser.id },
    });
    expect(reloadedValUser?.loyaltyPoints).toBe(100);

    // 7d. DELETE /inventory/ingredients/:id with InventoryLog -> 409 Conflict
    const loggedIng = await prisma.ingredient.create({
      data: {
        code: 'ING_LOGGED_ONLY',
        name: 'Logged Ingredient',
        unit: 'g',
        stock: 500,
        minThreshold: 50,
        costPerUnit: 100,
      },
    });
    await prisma.inventoryLog.create({
      data: {
        ingredientId: loggedIng.id,
        ingredientName: loggedIng.name,
        unit: loggedIng.unit,
        type: 'RESTOCK',
        changeAmount: 500,
        previousStock: 0,
        newStock: 500,
        unitCost: 100,
        totalCost: 50000,
        performedBy: 'admin@brewlite.vn',
      },
    });

    const deleteLoggedRes = await requestJson(
      'DELETE',
      `/inventory/ingredients/${loggedIng.id}`,
      { token: rootAdminToken },
    );
    expect(deleteLoggedRes.status).toBe(409);

    // 7e. PATCH .../status with empty {} body -> 400 BadRequest
    const staffStatusEmptyRes = await requestJson(
      'PATCH',
      `/staff/${staffUser.id}/status`,
      { token: rootAdminToken, body: {} },
    );
    expect(staffStatusEmptyRes.status).toBe(400);

    const customerStatusEmptyRes = await requestJson(
      'PATCH',
      `/admin/customers/${valUser.id}/status`,
      { token: rootAdminToken, body: {} },
    );
    expect(customerStatusEmptyRes.status).toBe(400);

    const validOrderRes = await requestJson('POST', '/orders', {
      token: valUserToken,
      body: {
        items: [
          {
            productId: bakeryProductId,
            size: 'ALL',
            toppings: [],
            quantity: 1,
          },
        ],
      },
    });
    expect(validOrderRes.status).toBe(201);

    const orderStatusEmptyRes = await requestJson(
      'PATCH',
      `/orders/${validOrderRes.data.id}/status`,
      { token: rootAdminToken, body: {} },
    );
    expect(orderStatusEmptyRes.status).toBe(400);
  });
});
