import { NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import * as crypto from 'node:crypto';
import { getJwtSecret } from '../auth/jwt-secret.helper';
import {
  extractUserFromRequest,
  ProductsController,
} from './products.controller';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { ROLES_KEY } from '../auth/roles.decorator';

const signTestJwt = (payload: Record<string, unknown>) => {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const b = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  const sig = crypto.createHmac('sha256', getJwtSecret()).update(`${h}.${b}`).digest('base64url');
  return `${h}.${b}.${sig}`;
};

describe('ProductsController (T4.3 + Ass1 BOM Integration)', () => {
  let controller: ProductsController;
  let service: ProductsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      toppingRecipe: {
        findMany: jest.fn(),
      },
      orderItem: {
        findMany: jest.fn(),
      },
    };

    service = new ProductsService(mockPrisma as unknown as PrismaService);
    controller = new ProductsController(service);
  });

  describe('API-T01: Public Catalog & BOM Enrichment', () => {
    it('returns { data: [...] } with price/stock aliases alongside BOM fields, hiding sensitive cost data', async () => {
      mockPrisma.product.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'Cà phê Đen',
          description: 'Cà phê đậm đà',
          imageUrl: '/images/products/ca-phe-den.png',
          basePrice: 29000,
          sizeUpchargeM: 5000,
          sizeUpchargeL: 10000,
          category: 'vietnamese',
          tag: 'Đậm vị',
          isActive: true,
          isSoldOutManual: false,
          recipes: [
            {
              id: 1,
              size: 'S',
              amount: 20,
              ingredient: { id: 10, name: 'Hạt Robusta', stock: 200, costPerUnit: 200, isRequiredForSale: true },
            },
          ],
        },
      ]);

      const res = await controller.findAll();

      expect(res).toHaveProperty('data');
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data[0]).toMatchObject({
        id: 1,
        name: 'Cà phê Đen',
        price: 29000,
        basePrice: 29000,
        stock: 10,
        availableServings: 10,
        isOutOfStock: false,
        outOfStockSizes: [],
        imageUrl: '/images/products/ca-phe-den.png',
        category: 'vietnamese',
      });
      // Bảo mật BOM bí mật kinh doanh đối với khách thường
      expect((res.data[0] as any).recipes).toBeUndefined();
      expect((res.data[0] as any).cogsSizeS).toBeUndefined();
      expect((res.data[0] as any).grossProfitS).toBeUndefined();
      expect((res.data[0] as any).marginPercentS).toBeUndefined();
    });

    it('forces showAll = false and isAdmin = false for non-admin callers even with includeInactive=true', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);

      await controller.findAll('true', { user: { role: Role.CUSTOMER } });

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        }),
      );
    });
  });

  describe('API-T02 + API-T03: Product Detail & Active Toppings', () => {
    it('returns { data: { ..., toppings: [...] } } with deduplicated toppings for active product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 1,
        name: 'Cà phê Đen',
        description: 'Chiết xuất nguyên bản',
        imageUrl: '/images/products/ca-phe-den.png',
        basePrice: 29000,
        category: 'vietnamese',
        isActive: true,
        isSoldOutManual: false,
        recipes: [
          {
            id: 1,
            size: 'S',
            amount: 20,
            ingredient: { id: 10, stock: 100, costPerUnit: 200, isRequiredForSale: true },
          },
        ],
      });
      mockPrisma.toppingRecipe.findMany.mockResolvedValue([
        { id: 1, toppingId: 'boba', toppingName: 'Trân châu trắng', price: 8000, subtext: 'Giòn ngon', isActive: true, ingredientId: 1, amount: 30 },
        { id: 2, toppingId: 'cream', toppingName: 'Kem muối', price: 10000, subtext: 'Béo mặn', isActive: true, ingredientId: 2, amount: 20 },
        { id: 3, toppingId: 'cream', toppingName: 'Kem muối', price: 10000, subtext: 'Béo mặn', isActive: true, ingredientId: 3, amount: 15 }, // Duplicate toppingId
      ]);

      const res = await controller.findOne(1);

      expect(res).toMatchObject({
        data: {
          id: 1,
          name: 'Cà phê Đen',
          price: 29000,
          basePrice: 29000,
          stock: 5,
          availableServings: 5,
          toppings: [
            { id: 'boba', toppingId: 'boba', name: 'Trân châu trắng', toppingName: 'Trân châu trắng', price: 8000, subtext: 'Giòn ngon' },
            { id: 'cream', toppingId: 'cream', name: 'Kem muối', toppingName: 'Kem muối', price: 10000, subtext: 'Béo mặn' },
          ],
        },
      });
      expect(res.data.toppings).toHaveLength(2);
    });

    it('throws NotFoundException when product does not exist (API-T03)', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(controller.findOne(99999)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when product is inactive and caller is not admin', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 5,
        name: 'Món Ẩn',
        isActive: false,
        recipes: [],
      });

      await expect(controller.findOne(5)).rejects.toThrow(NotFoundException);
    });
  });

  describe('BOM Stock & Out of Stock Calculation', () => {
    it('calculates outOfStockSizes when specific size lacks packaging without disabling entire product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 1,
        name: 'Cà phê Đen',
        basePrice: 29000,
        isActive: true,
        isSoldOutManual: false,
        recipes: [
          { id: 1, size: 'S', amount: 1, ingredient: { stock: 50, isRequiredForSale: true } },
          { id: 2, size: 'M', amount: 1, ingredient: { stock: 0, isRequiredForSale: true } },
          { id: 3, size: 'L', amount: 1, ingredient: { stock: 25, isRequiredForSale: true } },
        ],
      });
      mockPrisma.toppingRecipe.findMany.mockResolvedValue([]);

      const res = await controller.findOne(1);

      expect(res.data.outOfStockSizes).toEqual(['M']);
      expect(res.data.isOutOfStock).toBe(false);
      expect(res.data.availableServings).toBe(25);
      expect(res.data.stock).toBe(25);
    });

    it('marks entire product out of stock and sets stock alias to 0 when all beverage sizes are exhausted', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 1,
        name: 'Cà phê Đen',
        basePrice: 29000,
        isActive: true,
        isSoldOutManual: false,
        recipes: [
          { id: 1, size: 'S', amount: 1, ingredient: { stock: 0, isRequiredForSale: true } },
          { id: 2, size: 'M', amount: 1, ingredient: { stock: 0, isRequiredForSale: true } },
          { id: 3, size: 'L', amount: 1, ingredient: { stock: 0, isRequiredForSale: true } },
        ],
      });
      mockPrisma.toppingRecipe.findMany.mockResolvedValue([]);

      const res = await controller.findOne(1);

      expect(res.data.isOutOfStock).toBe(true);
      expect(res.data.outOfStockSizes).toEqual(['S', 'M', 'L']);
      expect(res.data.availableServings).toBe(0);
      expect(res.data.stock).toBe(0);
    });

    it('sets stock alias to 0 when product is manually marked sold out', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 1,
        name: 'Cà phê Đen',
        basePrice: 29000,
        isActive: true,
        isSoldOutManual: true,
        recipes: [
          { id: 1, size: 'S', amount: 1, ingredient: { stock: 100, isRequiredForSale: true } },
        ],
      });
      mockPrisma.toppingRecipe.findMany.mockResolvedValue([]);

      const res = await controller.findOne(1);

      expect(res.data.isOutOfStock).toBe(true);
      expect(res.data.availableServings).toBe(0);
      expect(res.data.stock).toBe(0);
    });
  });

  describe('Admin Access & BOM Details', () => {
    it('returns full BOM recipes, COGS, grossProfit, and marginPercent for ADMIN in findAll', async () => {
      mockPrisma.product.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'Cà phê Đen',
          basePrice: 29000,
          isActive: true,
          isSoldOutManual: false,
          recipes: [
            {
              id: 1,
              size: 'S',
              amount: 20,
              ingredient: { id: 10, stock: 200, costPerUnit: 200, isRequiredForSale: true },
            },
          ],
        },
      ]);

      const res = await controller.findAll('true', { user: { role: Role.ADMIN } });

      expect(res.data[0]).toMatchObject({
        id: 1,
        price: 29000,
        basePrice: 29000,
        cogsSizeS: 4000,
        grossProfitS: 25000,
        marginPercentS: 86,
      });
      expect(res.data[0].recipes).toBeDefined();
    });

    it('returns inactive product with BOM details when ADMIN calls findOne', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 99,
        name: 'Món Cũ Ẩn',
        basePrice: 40000,
        isActive: false,
        isSoldOutManual: false,
        recipes: [
          {
            id: 10,
            size: 'S',
            amount: 1,
            ingredient: { id: 1, stock: 10, costPerUnit: 15000, isRequiredForSale: true },
          },
        ],
      });
      mockPrisma.toppingRecipe.findMany.mockResolvedValue([]);

      const res = await controller.findOne(99, { user: { role: Role.ADMIN } });

      expect(res.data).toMatchObject({
        id: 99,
        isActive: false,
        cogsSizeS: 15000,
        grossProfitS: 25000,
      });
    });
  });

  describe('Admin RBAC & Mutations', () => {
    const reflector = new Reflector();

    it('guards mutation endpoints with @Roles(Role.ADMIN)', () => {
      const createRoles = reflector.get(ROLES_KEY, controller.create);
      const updateRoles = reflector.get(ROLES_KEY, controller.update);
      const toggleRoles = reflector.get(ROLES_KEY, ProductsController.prototype.toggleVisibility);
      const removeRoles = reflector.get(ROLES_KEY, controller.remove);

      expect(createRoles).toEqual([Role.ADMIN]);
      expect(updateRoles).toEqual([Role.ADMIN]);
      expect(toggleRoles).toEqual([Role.ADMIN]);
      expect(removeRoles).toEqual([Role.ADMIN]);
    });

    it('guards toggleSoldOut with @Roles(Role.STAFF, Role.ADMIN) while keeping toggleVisibility strictly @Roles(Role.ADMIN)', () => {
      const soldOutRoles = reflector.get(
        ROLES_KEY,
        ProductsController.prototype.toggleSoldOut,
      );
      const visibilityRoles = reflector.get(
        ROLES_KEY,
        ProductsController.prototype.toggleVisibility,
      );

      expect(soldOutRoles).toEqual([Role.STAFF, Role.ADMIN]);
      expect(visibilityRoles).toEqual([Role.ADMIN]);
    });

    it('delegates controller.toggleSoldOut(1, { isSoldOutManual: true }) to productsService.toggleSoldOut without touching isActive and hides recipes/COGS from STAFF', async () => {
      const dto = { isSoldOutManual: true };
      const spy = jest.spyOn(service, 'toggleSoldOut');
      mockPrisma.product.findUnique.mockResolvedValue({ id: 1, name: 'Cà phê Đen', isActive: true });
      mockPrisma.product.update.mockResolvedValue({
        id: 1,
        name: 'Cà phê Đen',
        basePrice: 29000,
        category: 'vietnamese',
        isActive: true,
        isSoldOutManual: true,
        recipes: [
          {
            id: 1,
            size: 'S',
            amount: 20,
            ingredient: { id: 10, stock: 200, costPerUnit: 200, isRequiredForSale: true },
          },
        ],
      });

      const staffRes: any = await controller.toggleSoldOut(1, dto, {
        user: { role: Role.STAFF },
      });

      expect(spy).toHaveBeenCalledWith(1, dto, false);
      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { isSoldOutManual: true },
        }),
      );
      expect(staffRes).toMatchObject({ id: 1, isSoldOutManual: true, isOutOfStock: true });
      expect(staffRes.recipes).toBeUndefined();
      expect(staffRes.cogsSizeS).toBeUndefined();
      expect(staffRes.cogsSizeM).toBeUndefined();
      expect(staffRes.cogsSizeL).toBeUndefined();
      expect(staffRes.grossProfitS).toBeUndefined();
      expect(staffRes.marginPercentS).toBeUndefined();

      const adminRes: any = await controller.toggleSoldOut(1, dto, {
        user: { role: Role.ADMIN },
      });
      expect(spy).toHaveBeenCalledWith(1, dto, true);
      expect(adminRes.isSoldOutManual).toBe(true);
      expect(adminRes.recipes).toBeDefined();
      expect(adminRes.cogsSizeS).toBe(4000);
    });

    it('calls service.create on controller.create', async () => {
      const dto = { name: 'Cold Brew Mới', basePrice: 45000 };
      mockPrisma.product.create.mockResolvedValue({
        id: 11,
        ...dto,
        isActive: true,
        isSoldOutManual: false,
        recipes: [],
      });

      const res = await controller.create(dto as any);
      expect(res).toMatchObject({ id: 11, name: 'Cold Brew Mới' });
    });

    it('calls service.update on controller.update', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 1, name: 'Cà phê Đen' });
      mockPrisma.product.update.mockResolvedValue({
        id: 1,
        name: 'Cà phê Đen Đặc Biệt',
        basePrice: 32000,
        recipes: [],
      });

      const res = await controller.update(1, { name: 'Cà phê Đen Đặc Biệt', basePrice: 32000 });
      expect(res).toMatchObject({ id: 1, name: 'Cà phê Đen Đặc Biệt' });
    });

    it('calls service.toggleVisibility on controller.toggleVisibility', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 1, name: 'Cà phê Đen' });
      mockPrisma.product.update.mockResolvedValue({
        id: 1,
        name: 'Cà phê Đen',
        isActive: false,
        isSoldOutManual: true,
        recipes: [],
      });

      const res = await controller.toggleVisibility(1, { isActive: false, isSoldOutManual: true });
      expect(res).toMatchObject({ id: 1, isActive: false, isSoldOutManual: true });
    });

    it('calls service.remove on controller.remove', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 1, name: 'Cà phê Đen', recipes: [] });
      mockPrisma.product.delete.mockResolvedValue({});

      const res = await controller.remove(1);
      expect(res).toEqual({ deleted: true, id: 1, name: 'Cà phê Đen', removedRecipesCount: 0 });
    });
  });

  describe('BE-C01: Raw Authorization header fallback removal', () => {
    it('extractUserFromRequest returns null when req.user is absent even with valid signed ADMIN Bearer token', () => {
      const token = signTestJwt({ userId: 99, email: 'locked@brewlite.vn', role: Role.ADMIN });
      expect(extractUserFromRequest({ headers: { authorization: `Bearer ${token}` } })).toBeNull();
    });

    it('GET /products?includeInactive=true and GET /products/:id hide inactive items and COGS when req.user is null despite raw ADMIN header', async () => {
      const token = signTestJwt({ userId: 99, email: 'locked@brewlite.vn', role: Role.ADMIN });
      const req = { user: null, headers: { authorization: `Bearer ${token}` } };
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.product.findUnique.mockResolvedValue({ id: 5, name: 'Hidden', isActive: false, recipes: [] });

      await controller.findAll('true', req);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { isActive: true } }));
      await expect(controller.findOne(5, req)).rejects.toThrow(NotFoundException);
    });
  });
});
