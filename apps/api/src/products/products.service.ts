import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
@Injectable()
export class ProductsService {
 constructor(private readonly db: PrismaService) {}
 async findAll() {
  const products = await this.db.product.findMany({ orderBy: { id: 'asc' } });
  return { data: products.map(({ id, name, price, imageUrl, stock }) => ({ id, name, price, imageUrl, stock })) };
 }
 async findOne(id: number) {
  const product = await this.db.product.findUnique({
   where: { id }, include: { toppings: { include: { topping: true } } },
  });
  if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
  return { data: {
   id: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl, stock: product.stock,
   toppings: product.toppings.map(({ topping }) => ({ id: topping.id, name: topping.name, price: topping.price })),
  } };
 }
}
