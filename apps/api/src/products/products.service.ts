import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const products = await this.prisma.product.findMany({ orderBy: { id: 'asc' } });
    return { data: products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.basePrice,
      imageUrl: p.imageUrl,
      stock: p.stock,
    })) };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { toppings: { include: { topping: true } } },
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    return { data: {
      id: product.id,
      name: product.name,
      price: product.basePrice,
      imageUrl: product.imageUrl,
      stock: product.stock,
      toppings: product.toppings.map(({ topping }) => ({ id: topping.id, name: topping.name, price: topping.price })),
    } };
  }
}
