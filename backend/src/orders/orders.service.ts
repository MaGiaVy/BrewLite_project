import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { VouchersService } from '../vouchers/vouchers.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { assertTransition } from './state-machine.js';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vouchersService: VouchersService
  ) {}

  /**
   * Tạo đơn hàng mới với Idempotency Key và Optimistic Locking trừ kho
   */
  async createOrder(userId: string, idempotencyKey: string, dto: CreateOrderDto) {
    if (!idempotencyKey) {
      throw new BadRequestException('Bắt buộc phải có header "Idempotency-Key"');
    }

    // 1. Kiểm tra Idempotency: Nếu đã có đơn với cùng cặp (userId, idempotencyKey)
    const existingOrder = await this.prisma.order.findUnique({
      where: {
        userId_idempotencyKey: {
          userId,
          idempotencyKey,
        },
      },
      include: {
        items: {
          include: {
            toppings: true,
          },
        },
        voucher: true,
      },
    });

    if (existingOrder) {
      // Trả lại đúng đơn hàng đã tạo trước đó (chống tạo trùng đơn)
      return {
        ...existingOrder,
        isIdempotentReplay: true,
      };
    }

    // 2. Thực hiện tạo đơn và trừ tồn kho trong Database Transaction
    return await this.prisma.$transaction(async (tx) => {
      let orderTotal = 0;
      const orderItemsToCreate: Array<{
        productId: string;
        size: string;
        ice?: string;
        sugar?: string;
        quantity: number;
        priceAtPurchase: number;
        lineTotal: number;
        toppings: Array<{ toppingId: string; toppingName: string; toppingPrice: number }>;
      }> = [];

      // Xử lý từng món trong đơn
      for (const itemDto of dto.items) {
        // Áp dụng Optimistic Locking để trừ kho
        let updated = false;
        let attempts = 0;
        const maxRetries = 3;

        while (attempts < maxRetries && !updated) {
          attempts++;
          const product = await tx.product.findUnique({
            where: { id: itemDto.productId },
          });

          if (!product) {
            throw new NotFoundException(`Không tìm thấy sản phẩm: ${itemDto.productId}`);
          }

          if (product.stock < itemDto.quantity) {
            throw new ConflictException(
              `Sản phẩm "${product.name}" không đủ số lượng tồn kho (còn ${product.stock}, yêu cầu ${itemDto.quantity})`
            );
          }

          // Cập nhật tồn kho có kiểm tra version
          const updateResult = await tx.product.updateMany({
            where: {
              id: product.id,
              version: product.version,
            },
            data: {
              stock: product.stock - itemDto.quantity,
              version: { increment: 1 },
            },
          });

          if (updateResult.count > 0) {
            updated = true;
          }
        }

        if (!updated) {
          throw new ConflictException(
            'Hệ thống đang xử lý đơn hàng khác cho sản phẩm này, vui lòng thử lại'
          );
        }

        // Lấy lại thông tin sản phẩm để tính giá
        const currentProduct = await tx.product.findUnique({
          where: { id: itemDto.productId },
        });

        const sizeUpcharge = itemDto.size === 'M' ? 5000 : itemDto.size === 'L' ? 10000 : 0;

        // Lấy thông tin toppings
        let toppingsTotal = 0;
        const resolvedToppings: Array<{
          toppingId: string;
          toppingName: string;
          toppingPrice: number;
        }> = [];

        if (itemDto.toppingIds && itemDto.toppingIds.length > 0) {
          const toppings = await tx.topping.findMany({
            where: { id: { in: itemDto.toppingIds } },
          });

          for (const t of toppings) {
            toppingsTotal += t.price;
            resolvedToppings.push({
              toppingId: t.id,
              toppingName: t.name,
              toppingPrice: t.price,
            });
          }
        }

        const priceAtPurchase = (currentProduct?.price || 0) + sizeUpcharge + toppingsTotal;
        const lineTotal = priceAtPurchase * itemDto.quantity;
        orderTotal += lineTotal;

        orderItemsToCreate.push({
          productId: itemDto.productId,
          size: itemDto.size,
          ice: itemDto.ice,
          sugar: itemDto.sugar,
          quantity: itemDto.quantity,
          priceAtPurchase,
          lineTotal,
          toppings: resolvedToppings,
        });
      }

      // 3. Tính toán Voucher (nếu có)
      let voucherId: string | null = null;
      let discountAmount = 0;

      if (dto.voucherCode) {
        const voucherRes = await this.vouchersService.validateVoucher(
          dto.voucherCode,
          orderTotal
        );
        voucherId = voucherRes.voucherId;
        discountAmount = voucherRes.discountAmount;
      }

      const finalTotal = Math.max(0, orderTotal - discountAmount);

      // 4. Tạo bản ghi Order
      const createdOrder = await tx.order.create({
        data: {
          userId,
          idempotencyKey,
          status: OrderStatus.PENDING,
          total: orderTotal,
          discountAmount,
          finalTotal,
          paymentMethod: dto.paymentMethod || 'WALLET',
          voucherId,
        },
      });

      // 5. Tạo các bản ghi OrderItem và OrderItemTopping
      for (const it of orderItemsToCreate) {
        const createdOrderItem = await tx.orderItem.create({
          data: {
            orderId: createdOrder.id,
            productId: it.productId,
            size: it.size,
            ice: it.ice,
            sugar: it.sugar,
            quantity: it.quantity,
            priceAtPurchase: it.priceAtPurchase,
            lineTotal: it.lineTotal,
          },
        });

        if (it.toppings.length > 0) {
          await tx.orderItemTopping.createMany({
            data: it.toppings.map((top) => ({
              orderItemId: createdOrderItem.id,
              toppingId: top.toppingId,
              toppingName: top.toppingName,
              toppingPrice: top.toppingPrice,
            })),
          });
        }
      }

      return await tx.order.findUnique({
        where: { id: createdOrder.id },
        include: {
          items: {
            include: {
              toppings: true,
            },
          },
          voucher: true,
        },
      });
    });
  }

  /**
   * Lấy danh sách lịch sử đơn hàng của người dùng
   */
  async findAllByUser(userId: string) {
    return await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: true,
            toppings: true,
          },
        },
        voucher: true,
      },
    });
  }

  /**
   * Lấy chi tiết một đơn hàng theo ID
   */
  async findOne(id: string, userId?: string) {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }

    const order = await this.prisma.order.findFirst({
      where,
      include: {
        items: {
          include: {
            product: true,
            toppings: true,
          },
        },
        voucher: true,
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng: ${id}`);
    }

    return order;
  }

  /**
   * Khách hàng hủy đơn (trả lại số lượng tồn kho cho sản phẩm)
   */
  async cancelOrder(id: string, userId: string) {
    const order = await this.findOne(id, userId);

    // Kiểm tra chuyển trạng thái hợp lệ
    assertTransition(order.status, OrderStatus.CANCELLED);

    return await this.prisma.$transaction(async (tx) => {
      // Hoàn lại tồn kho cho các sản phẩm trong đơn
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
            version: { increment: 1 },
          },
        });
      }

      // Cập nhật trạng thái đơn sang CANCELLED
      return await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELLED },
        include: { items: true },
      });
    });
  }
}
