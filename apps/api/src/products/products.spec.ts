import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
const product = { id: 1, name: 'Cà phê sữa', price: 35000, imageUrl: '/p.jpg', stock: 5 };
describe('Product API behavior', () => {
 it('API-T01 GET /products returns seed-like products with required fields', async () => {
  const db = { product: { findMany: vi.fn().mockResolvedValue([product]) } };
  const response = await new ProductsService(db as never).findAll();
  expect(response).toEqual({ data: [product] });
  expect(db.product.findMany).toHaveBeenCalled();
 });
 it('API-T02 GET /products/:id returns available toppings', async () => {
  const db = { product: { findUnique: vi.fn().mockResolvedValue({ ...product, toppings: [{ topping: { id: 1, name: 'Thạch', price: 5000 } }] }) } };
  const response = await new ProductsService(db as never).findOne(1);
  expect(response.data.toppings).toEqual([{ id: 1, name: 'Thạch', price: 5000 }]);
 });
 it('API-T03 GET /products/:id returns 404 for unknown product', async () => {
  const db = { product: { findUnique: vi.fn().mockResolvedValue(null) } };
  await expect(new ProductsService(db as never).findOne(999)).rejects.toBeInstanceOf(NotFoundException);
 });
});
