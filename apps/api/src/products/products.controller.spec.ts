import { NotFoundException } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('T4.3 Product API', () => {
  const prisma = {
    product: { findMany: jest.fn(), findUnique: jest.fn() },
  } as unknown as PrismaService;
  const service = new ProductsService(prisma);
  const controller = new ProductsController(service);

  beforeEach(() => jest.clearAllMocks());

  it('API-T01: lists products with required fields', async () => {
    (prisma.product.findMany as jest.Mock).mockResolvedValue([
      { id: 1, name: 'Cà phê', basePrice: 25000, imageUrl: '/images/products/1.svg', stock: 3 },
    ]);
    await expect(controller.findAll()).resolves.toEqual({ data: [
      { id: 1, name: 'Cà phê', price: 25000, imageUrl: '/images/products/1.svg', stock: 3 },
    ] });
  });

  it('API-T02: returns product toppings', async () => {
    (prisma.product.findUnique as jest.Mock).mockResolvedValue({
      id: 1, name: 'Cà phê', basePrice: 25000, imageUrl: null, stock: 3,
      toppings: [{ topping: { id: 1, name: 'Thạch', price: 5000 } }],
    });
    await expect(controller.findOne(1)).resolves.toMatchObject({ data: {
      id: 1, price: 25000, toppings: [{ name: 'Thạch', price: 5000 }],
    } });
  });

  it('API-T03: returns 404 when a product does not exist', async () => {
    (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(controller.findOne(99999)).rejects.toThrow(NotFoundException);
  });
});
