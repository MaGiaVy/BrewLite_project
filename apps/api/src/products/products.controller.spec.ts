import 'reflect-metadata';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

const product = {
  id: 1,
  name: 'Cà phê sữa',
  price: 35000,
  imageUrl: '/images/products/1.svg',
  stock: 5,
};
const findMany = vi.fn();
const findUnique = vi.fn();

describe('T4.3 Product HTTP API', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const testingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        { provide: PrismaService, useValue: { product: { findMany, findUnique } } },
        {
          provide: ProductsService,
          useFactory: (db: PrismaService) => new ProductsService(db),
          inject: [PrismaService],
        },
      ],
    }).compile();

    app = testingModule.createNestApplication();
    await app.listen(0, '127.0.0.1');
    const address = app.getHttpServer().address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  beforeEach(() => {
    findMany.mockReset();
    findUnique.mockReset();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('API-T01: GET /products responds 200 with ProductSummary[]', async () => {
    findMany.mockResolvedValueOnce([product, { ...product, id: 2, stock: 0 }]);
    const response = await fetch(`${baseUrl}/products`);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ data: [product, { ...product, id: 2, stock: 0 }] });
    for (const item of body.data) {
      expect(item).toEqual({
        id: expect.any(Number),
        name: expect.any(String),
        price: expect.any(Number),
        imageUrl: expect.any(String),
        stock: expect.any(Number),
      });
    }
  });

  it('API-T02: GET /products/:id responds 200 with toppings[]', async () => {
    findUnique.mockResolvedValueOnce({
      ...product,
      toppings: [{ topping: { id: 3, name: 'Kem cheese', price: 10000 } }],
    });
    const response = await fetch(`${baseUrl}/products/1`);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.toppings).toEqual([{ id: 3, name: 'Kem cheese', price: 10000 }]);
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: { toppings: { include: { topping: true } } },
    });
  });

  it('API-T03: GET /products/:id responds 404 for missing product', async () => {
    findUnique.mockResolvedValueOnce(null);
    const response = await fetch(`${baseUrl}/products/9999`);
    expect(response.status).toBe(404);
  });

  it('GET /products/:id responds 400 for invalid id', async () => {
    const response = await fetch(`${baseUrl}/products/abc`);
    expect(response.status).toBe(400);
    expect(findUnique).not.toHaveBeenCalled();
  });
});
