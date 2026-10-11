import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { GetProductsQueryDto } from './dto/get-products-query.dto.js';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query?: GetProductsQueryDto) {
    const where: any = {};

    if (query?.category) {
      where.category = query.category;
    }

    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const products = await this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    return products;
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm với mã: ${id}`);
    }

    const availableToppings = await this.prisma.topping.findMany({
      where: { isAvailable: true },
      orderBy: { price: 'asc' },
    });

    return {
      ...product,
      availableToppings,
    };
  }
}
