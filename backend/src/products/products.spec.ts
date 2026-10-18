import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { ProductsService } from './products.service.js';

describe('ProductsService - Task 2 & Task 4 Test Suite', () => {
  let prisma: PrismaClient;
  let productsService: ProductsService;

  beforeAll(async () => {
    prisma = new PrismaClient();
    productsService = new ProductsService(prisma as any);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('findAll() trả về danh sách sản phẩm với đầy đủ thuộc tính (giá, tồn kho, category)', async () => {
    const products = await productsService.findAll();
    expect(products).toBeDefined();
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThan(0);

    const firstProduct = products[0];
    expect(firstProduct.id).toBeDefined();
    expect(firstProduct.name).toBeDefined();
    expect(firstProduct.price).toBeGreaterThan(0);
    expect(typeof firstProduct.stock).toBe('number');
    expect(firstProduct.category).toBeDefined();
  });

  it('findAll({ category: "COFFEE_VN" }) lọc đúng danh mục cà phê truyền thống', async () => {
    const products = await productsService.findAll({ category: 'COFFEE_VN' });
    expect(products).toBeDefined();
    for (const p of products) {
      expect(p.category).toBe('COFFEE_VN');
    }
  });

  it('findOne() trả về chi tiết sản phẩm kèm danh sách toppings có sẵn', async () => {
    const allProducts = await productsService.findAll();
    const target = allProducts[0];

    const detail = await productsService.findOne(target.id);
    expect(detail).toBeDefined();
    expect(detail.id).toBe(target.id);
    expect(detail.availableToppings).toBeDefined();
    expect(Array.isArray(detail.availableToppings)).toBe(true);
  });

  it('findOne() với mã không tồn tại ném lỗi NotFoundException 404', async () => {
    await expect(productsService.findOne('non-existent-uuid-123')).rejects.toThrow(
      /Không tìm thấy sản phẩm/
    );
  });
});
