import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { assertTransition } from '../payments/state-machine.helper.js';

const POINTS_PER_VND = 1000;

export interface RequiredIngredientItem {
  ingredientId: number;
  code: string;
  name: string;
  unit: string;
  requiredAmount: number;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tự động quét và hủy các đơn hàng chưa thanh toán đã quá 15 phút.
   * Hoàn trả 100% nguyên vật liệu vào kho thông qua Transaction.
   */
  async cancelExpiredPendingOrders(): Promise<number> {
    const EXPIRE_TIMEOUT_MS = 15 * 60 * 1000;
    const expiryThreshold = new Date(Date.now() - EXPIRE_TIMEOUT_MS);

    const expiredOrders = await this.prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED] },
        createdAt: { lte: expiryThreshold },
      },
      include: { items: true },
    });

    if (!expiredOrders || expiredOrders.length === 0) {
      return 0;
    }

    let cancelledCount = 0;
    for (const order of expiredOrders) {
      try {
        const claimed = await this.prisma.$transaction(async (tx: any) => {
          const result = await tx.order.updateMany({
            where: {
              id: order.id,
              version: order.version,
              status: { in: [OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED] },
            },
            data: {
              status: OrderStatus.CANCELLED,
              version: { increment: 1 },
            },
          });
          if (result.count !== 1) return false;

          if (tx.recipe && tx.ingredient && Array.isArray(order.items)) {
            const requiredIngredients = await this.computeRequiredIngredients(
              tx,
              order.items,
            );
            for (const reqIng of requiredIngredients) {
              await tx.ingredient.update({
                where: { id: reqIng.ingredientId },
                data: {
                  stock: { increment: reqIng.requiredAmount },
                  version: { increment: 1 },
                },
              });
            }
          }

          return true;
        });
        if (!claimed) continue;
        cancelledCount++;
        this.logger.log(
          `[Auto-Expire 15m] Đơn hàng #${order.id} đã tự động hủy do quá hạn. Đã hoàn trả nguyên liệu vào kho.`,
        );
      } catch (err) {
        this.logger.error(
          `Lỗi khi tự động hủy đơn hết hạn #${order.id}:`,
          err,
        );
      }
    }

    return cancelledCount;
  }

  /**
   * Tính toán tổng định lượng nguyên vật liệu tiêu hao cho danh sách món + topping
   */
  private async computeRequiredIngredients(
    tx: any,
    items: Array<{
      productId: number;
      size: string;
      toppings: string[];
      quantity: number;
    }>,
  ): Promise<RequiredIngredientItem[]> {
    if (!tx.recipe || !tx.ingredient) {
      return [];
    }

    const productIds = [...new Set(items.map((i) => i.productId))];
    const [recipes, toppingRecipes] = await Promise.all([
      tx.recipe.findMany({
        where: { productId: { in: productIds } },
        include: { ingredient: true },
      }),
      tx.toppingRecipe
        ? tx.toppingRecipe.findMany({
            include: { ingredient: true },
          })
        : Promise.resolve([]),
    ]);

    const reqMap = new Map<number, RequiredIngredientItem>();

    const addRequirement = (ing: any, amount: number) => {
      if (!ing || amount <= 0) return;
      const existing = reqMap.get(ing.id);
      if (existing) {
        existing.requiredAmount = Number(
          (existing.requiredAmount + amount).toFixed(2),
        );
      } else {
        reqMap.set(ing.id, {
          ingredientId: ing.id,
          code: ing.code,
          name: ing.name,
          unit: ing.unit,
          requiredAmount: Number(amount.toFixed(2)),
        });
      }
    };

    for (const item of items) {
      const normalizedSize = (item.size || 'M').toUpperCase();
      // Lấy công thức theo size hoặc ALL (đối với bánh ngọt)
      const matchedRecipes = recipes.filter(
        (r: any) =>
          r.productId === item.productId &&
          (r.size === normalizedSize || r.size === 'ALL'),
      );

      for (const r of matchedRecipes) {
        addRequirement(r.ingredient, r.amount * item.quantity);
      }

      // Tính nguyên liệu cho Toppings đi kèm
      if (Array.isArray(item.toppings) && item.toppings.length > 0) {
        for (const topStr of item.toppings) {
          const lowerTop = topStr.toLowerCase();
          const matchedTops = toppingRecipes.filter(
            (tr: any) =>
              tr.toppingId.toLowerCase() === lowerTop ||
              tr.toppingName.toLowerCase().includes(lowerTop) ||
              lowerTop.includes(tr.toppingName.toLowerCase()),
          );
          for (const tr of matchedTops) {
            addRequirement(tr.ingredient, tr.amount * item.quantity);
          }
        }
      }
    }

    return Array.from(reqMap.values());
  }

  async createOrder(dto: CreateOrderDto, userId: number, idempotencyKey?: string) {
    const idempotencyPayload = JSON.stringify(dto);
    if (idempotencyKey) {
      const existingOrder = await (this.prisma as any).order.findUnique({
        where: { userId_idempotencyKey: { userId, idempotencyKey } },
        include: { items: true },
      });
      if (existingOrder) {
        if (
          existingOrder.idempotencyPayload &&
          existingOrder.idempotencyPayload !== idempotencyPayload
        ) {
          throw new ConflictException(
            'Idempotency-Key đã được sử dụng với payload khác.',
          );
        }
        return {
          orderId: existingOrder.id,
          status: existingOrder.status,
          totalAmount: existingOrder.totalAmount,
          discountCode: existingOrder.discountCode,
          discountAmount: existingOrder.discountAmount,
          items: existingOrder.items,
          isIdempotent: true,
        };
      }
    }

    const products = (this.prisma as any).product?.findMany
      ? await (this.prisma as any).product.findMany({
          where: { id: { in: dto.items.map((item) => item.productId) } },
        })
      : [];
    const toppings = (this.prisma as any).toppingRecipe?.findMany
      ? await (this.prisma as any).toppingRecipe.findMany({
          where: { isActive: true },
        })
      : [];
    const settings = (this.prisma as any).storeSetting?.findMany
      ? await (this.prisma as any).storeSetting.findMany({
          where: { key: { in: ['SIZE_UPCHARGE_M', 'SIZE_UPCHARGE_L'] } },
        })
      : [];
    const settingMap = new Map(settings.map((setting: any) => [setting.key, Number(setting.value)]));
    const productMap = new Map<number, any>(
      products.map((product: any) => [product.id, product]),
    );
    const toppingMap = new Map<string, any>(
      toppings.map((topping: any) => [topping.toppingId.toLowerCase(), topping]),
    );

    // 1. Tính rawSubtotal server-side
    const pricedItems = dto.items.map((item) => {
        const product = productMap.get(item.productId);
        const basePrice = product ? Number(product.basePrice) : item.unitPrice;
        const sizeUpcharge =
          item.size === 'M'
            ? Number(product?.sizeUpchargeM ?? settingMap.get('SIZE_UPCHARGE_M') ?? 5000)
            : item.size === 'L'
              ? Number(product?.sizeUpchargeL ?? settingMap.get('SIZE_UPCHARGE_L') ?? 10000)
              : 0;
        const toppingsTotal = item.toppings.reduce(
          (toppingSum, topping) =>
            toppingSum + Number(toppingMap.get(topping.toLowerCase())?.price ?? 0),
          0,
        );
        return {
          productId: item.productId,
          productName: item.productName,
          size: item.size,
          toppings: item.toppings,
          quantity: item.quantity,
          unitPrice: basePrice + sizeUpcharge + toppingsTotal,
        };
      });
    const rawSubtotal = pricedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    // 2. Xử lý mã giảm giá (Voucher / Discount Code từ DB + Fallback mặc định)
    let discountAmount = 0;
    let appliedDiscountCode: string | null = null;

    if (dto.discountCode && dto.discountCode.trim()) {
      const code = dto.discountCode.trim().toUpperCase();
      const DISCOUNT_RATES: Record<string, number> = {
        BREW10: 0.1, // Giảm 10% (Tối đa 15.000đ, Đơn tối thiểu 0đ)
        BREWLITE10: 0.1, // Giảm 10%
        BREWCOZY: 0.15, // Giảm 15% (Khách hàng thân thiết)
        BREW20: 0.2, // Giảm 20% (Tối đa 25.000đ, Đơn tối thiểu 60.000đ)
        WELCOME20: 0.2, // Giảm 20%
        BREW50: 0.5, // Giảm 50% (Tối đa 60.000đ, Đơn tối thiểu 120.000đ)
      };

      const MIN_ORDERS: Record<string, number> = {
        BREW10: 0,
        BREWLITE10: 0,
        BREWCOZY: 0,
        BREW20: 60000,
        WELCOME20: 50000,
        BREW50: 120000,
      };

      const MAX_DISCOUNTS: Record<string, number> = {
        BREW10: 15000,
        BREWLITE10: 15000,
        BREWCOZY: 25000,
        BREW20: 25000,
        WELCOME20: 25000,
        BREW50: 60000,
      };

      let matchedRate: number | null = null;
      let minOrderReq = MIN_ORDERS[code] ?? 0;
      let maxDiscountCap = MAX_DISCOUNTS[code] ?? Infinity;

      if ((this.prisma as any).discountCode?.findUnique) {
        const dbVoucher = await (this.prisma as any).discountCode.findUnique({
          where: { code },
        });
        if (dbVoucher) {
          if (!dbVoucher.isActive) {
            throw new BadRequestException(
              `Mã giảm giá "${code}" hiện đang tạm ngưng áp dụng.`,
            );
          }
          if (dbVoucher.expiresAt && new Date(dbVoucher.expiresAt).getTime() <= Date.now()) {
            throw new BadRequestException(`Mã giảm giá "${code}" đã hết hạn.`);
          }
          if (dbVoucher.minOrderAmount) {
            minOrderReq = Math.max(minOrderReq, Number(dbVoucher.minOrderAmount));
          }
          if (
            dbVoucher.maxDiscountAmount !== null &&
            dbVoucher.maxDiscountAmount !== undefined &&
            Number(dbVoucher.maxDiscountAmount) > 0
          ) {
            maxDiscountCap = Number(dbVoucher.maxDiscountAmount);
          }
          matchedRate = Number(dbVoucher.discountPercent || 0) / 100;
          if (dbVoucher.discountAmount !== null && dbVoucher.discountAmount !== undefined) {
            discountAmount = Math.min(Number(dbVoucher.discountAmount), rawSubtotal);
          }
        } else if (userId && (this.prisma as any).userVoucher?.findUnique) {
          const personalVoucher = await (this.prisma as any).userVoucher.findUnique({
            where: {
              userId_code: {
                userId,
                code,
              },
            },
          }).catch(() => null);

          if (personalVoucher) {
            if (personalVoucher.minOrderAmount) {
              minOrderReq = Math.max(minOrderReq, Number(personalVoucher.minOrderAmount));
            }
            if (
              personalVoucher.maxDiscountAmount !== null &&
              personalVoucher.maxDiscountAmount !== undefined &&
              Number(personalVoucher.maxDiscountAmount) > 0
            ) {
              maxDiscountCap = Number(personalVoucher.maxDiscountAmount);
            }
            matchedRate = Number(personalVoucher.discountPercent || 0) / 100;
          }
        }
      }

      if (matchedRate === null && DISCOUNT_RATES[code] !== undefined) {
        matchedRate = DISCOUNT_RATES[code];
      }

      if (matchedRate === null) {
        throw new BadRequestException(
          `Mã giảm giá "${dto.discountCode}" không hợp lệ hoặc đã hết hạn.`,
        );
      }

      if (rawSubtotal < minOrderReq) {
        throw new BadRequestException(
          `Mã "${code}" yêu cầu đơn hàng tối thiểu ${minOrderReq.toLocaleString('vi-VN')}đ.`,
        );
      }

      if (discountAmount === 0) {
        const rawDiscount = Math.round(rawSubtotal * matchedRate);
        discountAmount = Math.min(rawDiscount, maxDiscountCap);
      }
      appliedDiscountCode = code;
    }

    const afterDiscount = Math.max(0, rawSubtotal - discountAmount);
    const totalAmount = Math.floor(afterDiscount / 1000) * 1000;

    // 3. Transaction: Trừ tồn kho nguyên vật liệu bằng Optimistic Locking + Tạo đơn PENDING
    let order: any;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        order = await this.prisma.$transaction(async (tx) => {
          const requiredIngredients = await this.computeRequiredIngredients(
            tx,
            dto.items,
          );

          for (const reqIng of requiredIngredients) {
            const currentIng = await tx.ingredient.findUnique({
              where: { id: reqIng.ingredientId },
            });
            if (!currentIng) {
          throw new NotFoundException(
            `Không tìm thấy nguyên vật liệu "${reqIng.name}" trong kho.`,
          );
            }

            if (currentIng.stock < reqIng.requiredAmount) {
          throw new BadRequestException(
            `Nguyên vật liệu "${currentIng.name}" không đủ tồn kho (Cần ${reqIng.requiredAmount}${currentIng.unit}, hiện còn ${currentIng.stock}${currentIng.unit}).`,
          );
            }

            const updateRes = await tx.ingredient.updateMany({
              where: {
                id: currentIng.id,
                version: currentIng.version,
                stock: { gte: reqIng.requiredAmount },
              },
              data: {
                stock: { decrement: reqIng.requiredAmount },
                version: { increment: 1 },
              },
            });

            if (updateRes.count === 0) {
          throw new ConflictException(
            `Xung đột đồng thời (Optimistic Lock) khi trừ kho nguyên vật liệu "${currentIng.name}". Vui lòng thử lại.`,
          );
            }
          }

          const newOrder = await tx.order.create({
            data: {
              totalAmount,
              idempotencyKey: idempotencyKey || null,
              idempotencyPayload: idempotencyKey ? idempotencyPayload : null,
              discountCode: appliedDiscountCode,
              discountAmount,
              userId,
              items: {
                create: pricedItems.map((item) => ({
                  productId: item.productId,
                  productName: item.productName,
                  size: item.size,
                  toppings: item.toppings,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                })),
              },
            },
            include: { items: true },
          });
          if (appliedDiscountCode && tx.discountCode?.update) {
            await tx.discountCode.update({
              where: { code: appliedDiscountCode },
              data: { usageCount: { increment: 1 } },
            });
          }
          return newOrder;
        });
        break;
      } catch (error) {
        if (
          idempotencyKey &&
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'P2002'
        ) {
          const concurrentOrder = await (this.prisma as any).order.findUnique({
            where: { userId_idempotencyKey: { userId, idempotencyKey } },
            include: { items: true },
          });
          if (concurrentOrder) {
            if (
              concurrentOrder.idempotencyPayload &&
              concurrentOrder.idempotencyPayload !== idempotencyPayload
            ) {
              throw new ConflictException(
                'Idempotency-Key đã được sử dụng với payload khác.',
              );
            }
            return {
              orderId: concurrentOrder.id,
              status: concurrentOrder.status,
              totalAmount: concurrentOrder.totalAmount,
              discountCode: concurrentOrder.discountCode,
              discountAmount: concurrentOrder.discountAmount,
              items: concurrentOrder.items,
              isIdempotent: true,
            };
          }
        }
        if (!(error instanceof ConflictException) || attempt === 3) {
          throw error;
        }
      }
    }

    return {
      orderId: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      discountCode: order.discountCode,
      discountAmount: order.discountAmount,
      items: order.items,
    };
  }

  /**
   * Lấy danh sách toàn bộ đơn hàng của user (Task 9 — GET /orders/me)
   */
  async getMyOrders(userId: number) {
    // Tự động kiểm tra và hủy các đơn quá 5 phút trước khi trả về danh sách
    await this.cancelExpiredPendingOrders().catch(() => {});

    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => ({
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      staffId: (order as any).staffId,
      staffName: (order as any).staffName,
      items: order.items,
      payments: order.payments,
    }));
  }

  /**
   * Lấy hàng đợi đơn hàng cho màn hình Barista KDS (/staff)
   * Kèm thông tin định lượng công thức cho từng món để Barista xem nhanh (Quick Recipe Popover)
   */
  async getBaristaQueue() {
    const [orders, allRecipes, allToppingRecipes] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          status: {
            in: [
              OrderStatus.PAID,
              OrderStatus.PREPARING,
              OrderStatus.READY,
              OrderStatus.COMPLETED,
            ],
          },
        },
        include: {
          items: true,
          user: {
            select: { id: true, email: true, fullName: true, phone: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.recipe
        ? this.prisma.recipe.findMany({ include: { ingredient: true } })
        : Promise.resolve([]),
      this.prisma.toppingRecipe
        ? this.prisma.toppingRecipe.findMany({ include: { ingredient: true } })
        : Promise.resolve([]),
    ]);

    return orders.map((order) => ({
      ...order,
      items: order.items.map((item) => {
        const normalizedSize = (item.size || 'M').toUpperCase();
        const itemRecipes = allRecipes
          .filter(
            (r: any) =>
              r.productId === item.productId &&
              (r.size === normalizedSize || r.size === 'ALL'),
          )
          .map((r: any) => ({
            ingredientCode: r.ingredient.code,
            ingredientName: r.ingredient.name,
            unit: r.ingredient.unit,
            amountPerUnit: r.amount,
            totalAmount: Number((r.amount * item.quantity).toFixed(2)),
          }));

        const toppingBreakdown: Array<{
          toppingName: string;
          ingredientName: string;
          unit: string;
          totalAmount: number;
        }> = [];

        if (Array.isArray(item.toppings)) {
          for (const topStr of item.toppings) {
            const lowerTop = topStr.toLowerCase();
            const matchedTops = allToppingRecipes.filter(
              (tr: any) =>
                tr.toppingId.toLowerCase() === lowerTop ||
                tr.toppingName.toLowerCase().includes(lowerTop) ||
                lowerTop.includes(tr.toppingName.toLowerCase()),
            );
            for (const tr of matchedTops) {
              toppingBreakdown.push({
                toppingName: tr.toppingName,
                ingredientName: tr.ingredient.name,
                unit: tr.ingredient.unit,
                totalAmount: Number((tr.amount * item.quantity).toFixed(2)),
              });
            }
          }
        }

        return {
          ...item,
          recipeBreakdown: itemRecipes,
          toppingBreakdown,
        };
      }),
    }));
  }

  /**
   * Cập nhật trạng thái đơn hàng (Task 10 & Sprint 4 — PATCH /orders/:id/status)
   * Dùng assertTransition để đảm bảo State Machine Guard.
   * Khi chuyển sang CANCELLED: tự động hoàn kho nguyên vật liệu & thu hồi điểm Loyalty (nếu đơn đã PAID).
   */
  async updateOrderStatus(
    orderId: number,
    nextStatus: OrderStatus,
    userId: number,
    userRole?: Role,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với mã #${orderId}`);
    }

    const isStaffOrAdmin =
      userRole === Role.STAFF || userRole === Role.ADMIN;

    if (!isStaffOrAdmin && order.userId !== null && order.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật đơn hàng này');
    }

    const previousStatus = order.status;

    // State Machine Guard: chặn các transition không hợp lệ
    // Lấy thông tin nhân viên pha chế khi Barista/Admin nhận đơn (PREPARING) hoặc cập nhật đơn
    let staffData: { staffId?: number | null; staffName?: string | null } = {};
    if (isStaffOrAdmin && (nextStatus === OrderStatus.PREPARING || !(order as any).staffId)) {
      try {
        const staffUser = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, fullName: true },
        });
        if (staffUser) {
          staffData = {
            staffId: staffUser.id,
            staffName: staffUser.fullName,
          };
        }
      } catch {
        // bỏ qua nếu lỗi
      }
    }

    assertTransition(previousStatus, nextStatus);

    // Nếu hủy đơn (CANCELLED) và có $transaction + recipe -> hoàn lại kho nguyên vật liệu & trừ lại điểm thưởng
    if (nextStatus === OrderStatus.CANCELLED && this.prisma.$transaction) {
      const updated = await this.prisma.$transaction(async (tx: any) => {
        if (typeof tx.order.updateMany === 'function') {
          const claimed = await tx.order.updateMany({
            where: {
              id: orderId,
              version: order.version,
              status: previousStatus,
            },
            data: {
              version: { increment: 1 },
            },
          });
          if (claimed.count !== 1) {
            throw new ConflictException(
              `Đơn hàng #${orderId} đã được xử lý bởi request khác.`,
            );
          }
        }

        if (tx.recipe && tx.ingredient && Array.isArray(order.items)) {
          const requiredIngredients = await this.computeRequiredIngredients(
            tx,
            order.items,
          );
          for (const reqIng of requiredIngredients) {
            await tx.ingredient.update({
              where: { id: reqIng.ingredientId },
              data: {
                stock: { increment: reqIng.requiredAmount },
                version: { increment: 1 },
              },
            });
          }
        }

        // Nếu hủy từ trạng thái PAID -> thu hồi điểm Loyalty đã cộng
        if (
          previousStatus === OrderStatus.PAID &&
          order.userId &&
          tx.user
        ) {
          const pointsToRevoke = Math.floor(
            order.totalAmount / POINTS_PER_VND,
          );
          if (pointsToRevoke > 0) {
            await tx.user.update({
              where: { id: order.userId },
              data: {
                loyaltyPoints: { decrement: pointsToRevoke },
              },
            });
          }
        }

        // Nếu đơn hàng đã từng bị trừ mã voucher (voucherDeducted === true) -> trả lại mã cho khách
        if (
          order.userId &&
          order.discountCode &&
          (order as any).voucherDeducted &&
          tx.userVoucher
        ) {
          try {
            const userVoucher = await tx.userVoucher.findUnique({
              where: {
                userId_code: {
                  userId: order.userId,
                  code: order.discountCode,
                },
              },
            });
            if (userVoucher) {
              await tx.userVoucher.update({
                where: { id: userVoucher.id },
                data: { quantity: { increment: 1 } },
              });
            } else {
              await tx.userVoucher.create({
                data: {
                  userId: order.userId,
                  code: order.discountCode,
                  quantity: 1,
                  discountPercent: 10,
                  minOrderAmount: 0,
                },
              });
            }
          } catch {
            // Bỏ qua lỗi
          }
        }

        return tx.order.update({
          where: { id: orderId },
          data: { status: nextStatus, voucherDeducted: false },
        });
      });

      return {
      orderId: updated.id,
      previousStatus,
      status: updated.status,
      updatedAt: updated.updatedAt,
      staffId: (updated as any).staffId,
      staffName: (updated as any).staffName,
    };
    }

    // Khi đơn hàng thành công (COMPLETED - Sau khi nhận món):
    // Trừ 1 vé voucher cá nhân của người dùng nếu có áp dụng mã và chưa từng trừ
    if (nextStatus === OrderStatus.COMPLETED && this.prisma.$transaction) {
      const updated = await this.prisma.$transaction(async (tx: any) => {
        if (order.userId && order.discountCode && !(order as any).voucherDeducted) {
          try {
            if (tx.userVoucher) {
              const userVoucher = await tx.userVoucher.findUnique({
                where: {
                  userId_code: {
                    userId: order.userId,
                    code: order.discountCode,
                  },
                },
              });
              if (userVoucher) {
                if (userVoucher.quantity > 1) {
                  await tx.userVoucher.update({
                    where: { id: userVoucher.id },
                    data: { quantity: { decrement: 1 } },
                  });
                } else {
                  await tx.userVoucher.delete({
                    where: { id: userVoucher.id },
                  });
                }
              }
            }
          } catch {
            // Bỏ qua lỗi nếu bảng userVoucher chưa sẵn sàng
          }
        }

        return tx.order.update({
          where: { id: orderId },
          data: {
            status: nextStatus,
            voucherDeducted: order.discountCode ? true : false,
          },
        });
      });

      return {
      orderId: updated.id,
      previousStatus,
      status: updated.status,
      updatedAt: updated.updatedAt,
      staffId: (updated as any).staffId,
      staffName: (updated as any).staffName,
    };
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: nextStatus,
        ...staffData,
      },
    });

    return {
      orderId: updated.id,
      previousStatus,
      status: updated.status,
      updatedAt: updated.updatedAt,
      staffId: (updated as any).staffId,
      staffName: (updated as any).staffName,
    };
  }

  async getOrderById(orderId: number, userId: number, userRole?: Role) {
    // Tự động kiểm tra và hủy các đơn quá 5 phút trước khi trả về chi tiết đơn
    await this.cancelExpiredPendingOrders().catch(() => {});

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với mã #${orderId}`);
    }

    const isStaffOrAdmin =
      userRole === Role.STAFF || userRole === Role.ADMIN;

    if (!isStaffOrAdmin && order.userId !== null && order.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập đơn hàng này');
    }

    const productIds = (order.items || []).map((i) => i.productId);
    let productMap = new Map<number, { imageUrl: string | null }>();
    if (this.prisma.product?.findMany && productIds.length > 0) {
      try {
        const products = await this.prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, imageUrl: true },
        });
        productMap = new Map(products.map((p) => [p.id, p]));
      } catch {
        // fallback if product table not accessible
      }
    }

    return {
      ...order,
      items: order.items.map((item) => ({
        ...item,
        imageUrl: productMap.get(item.productId)?.imageUrl || null,
      })),
    };
  }

  /**
   * Xóa đơn hàng đã hủy hoặc chưa thanh toán (Task xóa đơn)
   * Chỉ cho phép xóa đơn CANCELLED, PAYMENT_FAILED, hoặc PENDING.
   * Nếu đơn PENDING bị xóa, tự động hoàn trả nguyên vật liệu vào kho.
   */
  async deleteOrder(orderId: number, userId: number, userRole?: Role) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với mã #${orderId}`);
    }

    const isStaffOrAdmin =
      userRole === Role.STAFF || userRole === Role.ADMIN;

    if (!isStaffOrAdmin && order.userId !== null && order.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa đơn hàng này');
    }

    // Chỉ cho phép xóa nếu đơn đã CANCELLED hoặc PAYMENT_FAILED hoặc PENDING
    if (
      order.status !== OrderStatus.CANCELLED &&
      order.status !== OrderStatus.PAYMENT_FAILED &&
      order.status !== OrderStatus.PENDING
    ) {
      throw new BadRequestException('Chỉ có thể xóa các đơn hàng đã hủy hoặc chưa thanh toán.');
    }

    // Nếu đơn PENDING bị xóa, hoàn lại nguyên vật liệu
    if (order.status === OrderStatus.PENDING && this.prisma.$transaction) {
      return await this.prisma.$transaction(async (tx: any) => {
        if (tx.recipe && tx.ingredient && Array.isArray(order.items)) {
          const requiredIngredients = await this.computeRequiredIngredients(
            tx,
            order.items,
          );
          for (const reqIng of requiredIngredients) {
            await tx.ingredient.update({
              where: { id: reqIng.ingredientId },
              data: {
                stock: { increment: reqIng.requiredAmount },
                version: { increment: 1 },
              },
            });
          }
        }
        await tx.payment.deleteMany({ where: { orderId } });
        await tx.orderItem.deleteMany({ where: { orderId } });
        await tx.order.delete({ where: { id: orderId } });
        return { success: true, message: `Đã xóa đơn hàng #${orderId}` };
      });
    }

    return await this.prisma.$transaction(async (tx: any) => {
      await tx.payment.deleteMany({ where: { orderId } });
      await tx.orderItem.deleteMany({ where: { orderId } });
      await tx.order.delete({ where: { id: orderId } });
      return { success: true, message: `Đã xóa đơn hàng #${orderId}` };
    });
  }
}
