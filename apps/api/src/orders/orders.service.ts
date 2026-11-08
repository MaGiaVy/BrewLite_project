import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { assertTransition } from '../payments/state-machine.helper';

const EXPIRE_MS = 15 * 60 * 1000;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(dto: CreateOrderDto, userId: number, idempotencyKey?: string) {
    const payload = JSON.stringify(dto);
    if (idempotencyKey) {
      const existing = await (this.prisma as any).order.findUnique({
        where: { userId_idempotencyKey: { userId, idempotencyKey } },
        include: { items: true },
      });
      if (existing) {
        if (existing.idempotencyPayload && existing.idempotencyPayload !== payload) {
          throw new ConflictException('Idempotency-Key đã được sử dụng với payload khác.');
        }
        return { ...existing, orderId: existing.id, isIdempotent: true };
      }
    }

    const products: any[] = await (this.prisma as any).product.findMany({
      where: { id: { in: dto.items.map((item) => item.productId) } },
    });
    const toppings: any[] = (this.prisma as any).toppingRecipe
      ? await (this.prisma as any).toppingRecipe.findMany({ where: { isActive: true } })
      : [];
    const productMap = new Map(products.map((product: any) => [product.id, product]));
    const toppingMap = new Map(toppings.map((topping: any) => [topping.toppingId, topping]));

    const items = dto.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);
      const sizeExtra = item.size === 'M' ? product.sizeUpchargeM ?? 0 : item.size === 'L' ? product.sizeUpchargeL ?? 0 : 0;
      const toppingsTotal = item.toppings.reduce((sum, id) => sum + (toppingMap.get(id)?.price ?? 0), 0);
      const unitPrice = Number(product.basePrice) + Number(sizeExtra) + toppingsTotal;
      return { productId: item.productId, productName: item.productName, size: item.size, toppings: item.toppings, quantity: item.quantity, unitPrice };
    });
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    let discountAmount = 0;
    let voucher: any = null;
    if (dto.discountCode) {
      const voucherStore = (this.prisma as any).voucher ?? (this.prisma as any).discountCode;
      voucher = await voucherStore.findUnique({ where: { code: dto.discountCode } });
      if (!voucher || !voucher.isActive || (voucher.expiresAt && new Date(voucher.expiresAt) <= new Date()) || subtotal < voucher.minOrderAmount) {
        throw new BadRequestException('Voucher không hợp lệ.');
      }
      discountAmount = voucher.discountAmount ?? subtotal * (voucher.discountPercent / 100);
      if (voucher.maxDiscountAmount != null) discountAmount = Math.min(discountAmount, voucher.maxDiscountAmount);
      discountAmount = Math.min(discountAmount, subtotal);
    }
    const totalAmount = subtotal - discountAmount;
    return this.prisma.$transaction(async (tx: any) => {
      for (const item of dto.items) {
        let updated = false;
        for (let attempt = 0; attempt < 3; attempt++) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product || product.stock < item.quantity) {
            throw new ConflictException(`Sản phẩm #${item.productId} không đủ số lượng tồn kho.`);
          }
          const result = await tx.product.updateMany({
            where: { id: item.productId, version: product.version, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity }, version: { increment: 1 } },
          });
          if (result.count === 1) {
            updated = true;
            break;
          }
        }
        if (!updated) {
          throw new ConflictException(`Xung đột tồn kho cho sản phẩm #${item.productId}, vui lòng thử lại.`);
        }
      }
      const order = await tx.order.create({
        data: { userId, status: OrderStatus.PENDING, totalAmount, discountCode: dto.discountCode ?? null, discountAmount, idempotencyKey: idempotencyKey ?? null, idempotencyPayload: payload, items: { create: items } },
        include: { items: true },
      });
      const voucherStore = tx.voucher ?? tx.discountCode;
      if (voucher && voucherStore?.update) await voucherStore.update({ where: { id: voucher.id }, data: { usageCount: { increment: 1 } } });
      return { ...order, orderId: order.id };
    });
  }

  async updateOrderStatus(id: number, next: OrderStatus, userId: number, role?: 'ADMIN' | 'STAFF' | 'CUSTOMER') {
    const order = await (this.prisma as any).order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new NotFoundException('Order not found');
    if (role !== 'ADMIN' && role !== 'STAFF' && order.userId !== userId) throw new ForbiddenException();
    assertTransition(order.status, next);
    if (!(this.prisma as any).$transaction) {
      return (this.prisma as any).order.update({ where: { id }, data: { status: next } });
    }
    return this.prisma.$transaction(async (tx: any) => {
      const result = await tx.order.updateMany({ where: { id, version: order.version, status: order.status }, data: { status: next, version: { increment: 1 } } });
      if (result.count !== 1) throw new ConflictException('Order was changed by another request');
      if (next === OrderStatus.CANCELLED && order.status === OrderStatus.PAID && tx.user?.update) {
        await tx.user.update({ where: { id: order.userId }, data: { loyaltyPoints: { decrement: Math.floor(order.totalAmount / 1000) } } });
      }
      if (next === OrderStatus.CANCELLED && tx.recipe?.findMany && tx.ingredient?.update) {
        const recipes = await tx.recipe.findMany({
          where: { productId: { in: order.items.map((item: any) => item.productId) } },
          include: { ingredient: true },
        });
        for (const recipe of recipes) {
          const item = order.items.find((candidate: any) => candidate.productId === recipe.productId);
          await tx.ingredient.update({
            where: { id: recipe.ingredient.id },
            data: {
              stock: { increment: recipe.amount * (item?.quantity ?? 1) },
              version: { increment: 1 },
            },
          });
        }
      }
      return tx.order.update ? tx.order.update({ where: { id }, data: {} }) : { ...order, status: next };
    });
  }

  async cancelExpiredPendingOrders(): Promise<number> {
    const orders = await (this.prisma as any).order.findMany({ where: { status: { in: [OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED] }, createdAt: { lte: new Date(Date.now() - EXPIRE_MS) } }, include: { items: true } });
    let count = 0;
    for (const order of orders) {
      const claimed = await this.prisma.$transaction(async (tx: any) => {
        const result = await tx.order.updateMany({ where: { id: order.id, version: order.version, status: { in: [OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED] } }, data: { status: OrderStatus.CANCELLED, version: { increment: 1 } } });
        if (result.count !== 1) return false;
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity }, version: { increment: 1 } },
          });
        }
        if (order.discountCode) {
          const voucherStore = tx.voucher ?? tx.discountCode;
          if (voucherStore?.update) {
            await voucherStore.update({
              where: { code: order.discountCode },
              data: { usageCount: { decrement: 1 } },
            });
          }
        }
        return true;
      });
      if (claimed) count++;
    }
    return count;
  }
}
