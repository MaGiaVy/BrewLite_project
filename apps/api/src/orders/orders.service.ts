import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { assertTransition } from '../payments/state-machine.helper';
import { fetchGlobalSizePricing } from '../inventory/inventory.service';
import { computeRequiredIngredients, RequiredIngredientItem } from './bom.helper';
import { expirePendingOrders, refundOrderResources } from './order-refund.helper';

export type { RequiredIngredientItem };

const POINTS_PER_VND = 1000;
const ORDER_PAYMENT_TTL_MS = 15 * 60 * 1000; // SRS v4.3 AC-05.4: 15 minutes
const PAID_CANCEL_GRACE_MS = 5 * 60 * 1000; // SRS v4.3 AC-13.2: 5-minute grace period
const MAX_INGREDIENT_LOCK_RETRIES = 3;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async cancelExpiredPendingOrders(): Promise<number> {
    return expirePendingOrders(this.prisma, this.logger, { timeoutMinutes: 15 });
  }

  private computeRequiredIngredients = computeRequiredIngredients;

  private serializeOrderPayload(dto: CreateOrderDto): string {
    return JSON.stringify({
      discountCode: dto.discountCode?.trim().toUpperCase() || null,
      items: (dto.items || []).map((item) => ({
        productId: item.productId,
        size: (item.size || 'M').toUpperCase(),
        sugarLevel: item.sugarLevel ?? '100%',
        iceLevel: item.iceLevel ?? '100%',
        temperature: item.temperature ?? 'COLD',
        notes: item.notes ?? null,
        toppings: [...(item.toppings || [])],
        quantity: item.quantity,
      })),
    });
  }

  private buildCreateOrderResponse(order: any, extra?: { isIdempotent?: boolean }) {
    return {
      id: order.id,
      orderId: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      discountCode: order.discountCode,
      discountAmount: order.discountAmount,
      items: order.items,
      ...(extra?.isIdempotent ? { isIdempotent: true } : {}),
    };
  }

  async createOrder(dto: CreateOrderDto, userId: number, idempotencyKey?: string) {
    const normalizedKey = idempotencyKey?.trim() || undefined;
    const payloadSnapshot = normalizedKey ? this.serializeOrderPayload(dto) : undefined;

    if (userId && normalizedKey && this.prisma.order?.findUnique) {
      const existingOrder = await this.prisma.order.findUnique({
        where: {
          userId_idempotencyKey: {
            userId,
            idempotencyKey: normalizedKey,
          },
        },
        include: { items: true },
      });
      if (existingOrder) {
        if (
          existingOrder.idempotencyPayload &&
          existingOrder.idempotencyPayload !== payloadSnapshot
        ) {
          throw new ConflictException(
            'Idempotency-Key đã được sử dụng với nội dung đơn hàng khác.',
          );
        }
        return this.buildCreateOrderResponse(existingOrder, { isIdempotent: true });
      }
    }

    // 0. Chống Spam đơn hàng ảo (Cart Hoarding DoS): Giới hạn tối đa 5 đơn PENDING / PAYMENT_FAILED
    if (userId && this.prisma.order?.count) {
      const activePendingCount = await this.prisma.order
        .count({
          where: {
            userId,
            status: { in: [OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED] },
          },
        })
        .catch(() => 0);
      if (activePendingCount >= 5) {
        throw new BadRequestException(
          'Bạn đang có 5 đơn hàng chờ thanh toán. Vui lòng hoàn tất thanh toán hoặc hủy đơn cũ trước khi đặt đơn mới.',
        );
      }
    }

    // 1. Tính rawSubtotal và serverUnitPrice hoàn toàn từ DB
    const productIds = [...new Set(dto.items.map((i) => i.productId))];

    const [products, toppingRecipes, globalSizePricing] = await Promise.all([
      (this.prisma as any).product?.findMany
        ? (this.prisma as any).product.findMany({
            where: { id: { in: productIds } },
          })
        : Promise.resolve([]),
      (this.prisma as any).toppingRecipe?.findMany
        ? (this.prisma as any).toppingRecipe.findMany({
            where: { isActive: true },
          })
        : Promise.resolve([]),
      fetchGlobalSizePricing(this.prisma),
    ]);

    const productMap = new Map<number, any>(
      products.map((p: any) => [p.id, p]),
    );

    let rawSubtotal = 0;
    const itemServerPrices: number[] = [];

    for (const item of dto.items) {
      const matchedProduct = productMap.get(item.productId);
      if (!matchedProduct || matchedProduct.isActive === false) {
        throw new BadRequestException(
          `Sản phẩm #${item.productId} không tồn tại hoặc đã ngừng kinh doanh`,
        );
      }

      if (matchedProduct.isSoldOutManual === true) {
        throw new BadRequestException(
          `Sản phẩm "${matchedProduct.name}" hiện đang tạm ngưng phục vụ (Hết hàng). Vui lòng chọn món khác.`,
        );
      }

      const normalizedSize = (item.size || 'M').toUpperCase();
      const sizeUpcharge =
        matchedProduct.category === 'bakery'
          ? 0
          : normalizedSize === 'L'
            ? (matchedProduct.sizeUpchargeL ?? globalSizePricing.sizeL)
            : normalizedSize === 'M'
              ? (matchedProduct.sizeUpchargeM ?? globalSizePricing.sizeM)
              : globalSizePricing.sizeS;

      let toppingSum = 0;
      if (Array.isArray(item.toppings) && item.toppings.length > 0) {
        for (const topStr of item.toppings) {
          if (!topStr || !topStr.trim()) continue;
          const lowerTop = topStr.toLowerCase().trim();
          // Prefer exact match before substring fallback; `.find` prices each selected topping once across multi-ingredient BOM rows
          const matchedTopping =
            toppingRecipes.find(
              (tr: any) =>
                tr.toppingId?.toLowerCase() === lowerTop ||
                tr.toppingName?.toLowerCase() === lowerTop,
            ) ??
            toppingRecipes.find(
              (tr: any) =>
                tr.toppingName?.toLowerCase().includes(lowerTop) ||
                lowerTop.includes(tr.toppingName?.toLowerCase()),
            );
          toppingSum += matchedTopping
            ? Number(matchedTopping.price ?? 8000)
            : 8000;
        }
      }

      const serverUnitPrice =
        Number(matchedProduct.basePrice || 0) + sizeUpcharge + toppingSum;
      itemServerPrices.push(serverUnitPrice);
      rawSubtotal += serverUnitPrice * item.quantity;
    }

    // 2. Transaction: Voucher + BOM Ingredient Optimistic Locking + tạo đơn PENDING
    try {
      const order = await this.prisma.$transaction(async (tx: any) => {
        let discountAmount = 0;
        let appliedDiscountCode: string | null = null;
        let voucherDeducted = false;

        if (dto.discountCode && dto.discountCode.trim()) {
          const code = dto.discountCode.trim().toUpperCase();

          const userVoucherModel = tx.userVoucher?.findUnique
            ? tx.userVoucher
            : (this.prisma as any).userVoucher;
          const personalVoucher =
            userId && userVoucherModel?.findUnique
              ? await userVoucherModel.findUnique({
                  where: {
                    userId_code: {
                      userId,
                      code,
                    },
                  },
                })
              : null;

          if (personalVoucher) {
            if (personalVoucher.quantity <= 0) {
              throw new BadRequestException(
                `Bạn đã sử dụng hết mã giảm giá cá nhân "${code}".`,
              );
            }

            const countModel = tx.order?.count ? tx.order : (this.prisma as any).order;
            if (countModel?.count) {
              const pendingWithVoucher = await countModel.count({
                where: {
                  userId,
                  discountCode: code,
                  status: { in: [OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED] },
                },
              });
              if (pendingWithVoucher >= (personalVoucher.quantity || 1)) {
                throw new BadRequestException(
                  `Voucher cá nhân "${code}" đang được áp dụng cho một đơn hàng chờ thanh toán khác của bạn.`,
                );
              }
            }

            if (
              personalVoucher.minOrderAmount &&
              rawSubtotal < Number(personalVoucher.minOrderAmount)
            ) {
              throw new BadRequestException(
                `Mã "${code}" yêu cầu đơn hàng tối thiểu ${Number(personalVoucher.minOrderAmount).toLocaleString('vi-VN')}đ.`,
              );
            }

            const rate = Number(personalVoucher.discountPercent || 0) / 100;
            const rawDiscount = Math.round(rawSubtotal * rate);
            const maxCap = personalVoucher.maxDiscountAmount
              ? Number(personalVoucher.maxDiscountAmount)
              : Infinity;
            discountAmount = Math.min(rawDiscount, maxCap, rawSubtotal);
            appliedDiscountCode = code;

            const voucherUpdateModel = tx.userVoucher?.update
              ? tx.userVoucher
              : (this.prisma as any).userVoucher;
            if (personalVoucher.quantity > 1) {
              if (voucherUpdateModel?.update) {
                await voucherUpdateModel.update({
                  where: { id: personalVoucher.id },
                  data: { quantity: { decrement: 1 } },
                });
              }
            } else {
              const voucherDeleteModel = tx.userVoucher?.delete
                ? tx.userVoucher
                : (this.prisma as any).userVoucher;
              if (voucherDeleteModel?.delete) {
                await voucherDeleteModel.delete({
                  where: { id: personalVoucher.id },
                });
              }
            }
            voucherDeducted = true;
          } else {
            const discountModel = tx.discountCode?.findUnique
              ? tx.discountCode
              : (this.prisma as any).discountCode;
            const dbVoucher = discountModel?.findUnique
              ? await discountModel.findUnique({ where: { code } })
              : null;

            if (dbVoucher) {
              if (!dbVoucher.isActive) {
                throw new BadRequestException(
                  `Mã giảm giá "${code}" hiện đang tạm ngưng áp dụng.`,
                );
              }
              if (
                dbVoucher.minOrderAmount &&
                rawSubtotal < Number(dbVoucher.minOrderAmount)
              ) {
                throw new BadRequestException(
                  `Mã "${code}" yêu cầu đơn hàng tối thiểu ${Number(dbVoucher.minOrderAmount).toLocaleString('vi-VN')}đ.`,
                );
              }
              const rate = Number(dbVoucher.discountPercent || 0) / 100;
              const rawDiscount = Math.round(rawSubtotal * rate);
              const maxCap = dbVoucher.maxDiscountAmount
                ? Number(dbVoucher.maxDiscountAmount)
                : Infinity;
              discountAmount = Math.min(rawDiscount, maxCap, rawSubtotal);
              appliedDiscountCode = code;

              if (tx.discountCode?.update) {
                await tx.discountCode.update({
                  where: { id: dbVoucher.id },
                  data: { usageCount: { increment: 1 } },
                });
              }
            } else {
              throw new BadRequestException(
                `Mã giảm giá "${dto.discountCode}" không hợp lệ hoặc đã hết hạn.`,
              );
            }
          }
        }

        // SRS v4.3 AC-03.3: 0% VAT
        const totalAmount = Math.max(0, rawSubtotal - discountAmount);

        const requiredIngredients = await this.computeRequiredIngredients(
          tx,
          dto.items,
        );
        requiredIngredients.sort((a, b) => a.ingredientId - b.ingredientId);

        const actualDeductedList: Array<{
          ingredientId: number;
          name: string;
          unit: string;
          deductedAmount: number;
          previousStock: number;
          newStock: number;
        }> = [];

        for (const reqIng of requiredIngredients) {
          let deductedAmount = 0;
          let previousStock = 0;
          let ingName = reqIng.name;
          let ingUnit = reqIng.unit;

          for (let attempt = 0; attempt < MAX_INGREDIENT_LOCK_RETRIES; attempt++) {
            const currentIng = await tx.ingredient.findUnique({
              where: { id: reqIng.ingredientId },
            });

            if (!currentIng) {
              throw new NotFoundException(
                `Không tìm thấy nguyên vật liệu "${reqIng.name}" trong kho.`,
              );
            }

            ingName = reqIng.name || currentIng.name;
            ingUnit = reqIng.unit || currentIng.unit;
            previousStock = Number(currentIng.stock);
            const isRequired = currentIng.isRequiredForSale ?? true;

            if (isRequired) {
              if (currentIng.stock < reqIng.requiredAmount) {
                const msg = `Nguyên vật liệu "${currentIng.name}" không đủ tồn kho (Cần ${reqIng.requiredAmount}${currentIng.unit}, hiện còn ${currentIng.stock}${currentIng.unit}).`;
                if (attempt === 0) {
                  throw new BadRequestException(msg);
                }
                throw new ConflictException(
                  `Xung đột đồng thời khi trừ kho nguyên vật liệu "${currentIng.name}". Vui lòng thử lại.`,
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

              if (updateRes.count > 0) {
                deductedAmount = reqIng.requiredAmount;
                break;
              }

              if (attempt === MAX_INGREDIENT_LOCK_RETRIES - 1) {
                throw new ConflictException(
                  `Xung đột đồng thời (Optimistic Lock) khi trừ kho nguyên vật liệu "${currentIng.name}". Vui lòng thử lại.`,
                );
              }
            } else {
              const deductAmount = Math.min(currentIng.stock, reqIng.requiredAmount);
              if (deductAmount <= 0) {
                break;
              }
              const packRes = await tx.ingredient.updateMany({
                where: {
                  id: currentIng.id,
                  version: currentIng.version,
                  stock: { gte: deductAmount },
                },
                data: {
                  stock: { decrement: deductAmount },
                  version: { increment: 1 },
                },
              });
              if ((packRes?.count ?? 1) > 0) {
                deductedAmount = deductAmount;
                break;
              }
            }
          }

          if (deductedAmount > 0) {
            const newStock = Number((previousStock - deductedAmount).toFixed(2));
            actualDeductedList.push({
              ingredientId: reqIng.ingredientId,
              name: ingName,
              unit: ingUnit,
              deductedAmount,
              previousStock,
              newStock,
            });
          }
        }

        const newOrder = await tx.order.create({
          data: {
            totalAmount,
            discountCode: appliedDiscountCode,
            discountAmount,
            voucherDeducted,
            userId,
            ...(normalizedKey
              ? {
                  idempotencyKey: normalizedKey,
                  idempotencyPayload: payloadSnapshot,
                }
              : {}),
            items: {
              create: dto.items.map((item, idx) => ({
                productId: item.productId,
                productName: productMap.get(item.productId)?.name || '',
                size: item.size,
                sugarLevel: item.sugarLevel ?? '100%',
                iceLevel: item.iceLevel ?? '100%',
                temperature: item.temperature ?? 'COLD',
                notes: item.notes ?? null,
                toppings: item.toppings,
                quantity: item.quantity,
                unitPrice: itemServerPrices[idx],
              })),
            },
          },
          include: { items: true },
        });

        if (tx.inventoryLog?.create) {
          for (const entry of actualDeductedList) {
            if (entry.deductedAmount <= 0) continue;
            await tx.inventoryLog.create({
              data: {
                ingredientId: entry.ingredientId,
                ingredientName: entry.name,
                unit: entry.unit,
                type: 'SALE',
                changeAmount: -entry.deductedAmount,
                previousStock: entry.previousStock,
                newStock: entry.newStock,
                unitCost: 0,
                totalCost: 0,
                note: `Xuất bán đơn hàng #${newOrder.id}`,
                performedBy: userId ? `User #${userId}` : 'Khách vãng lai',
              },
            });
          }
        }

        return newOrder;
      });

      return this.buildCreateOrderResponse(order);
    } catch (err: any) {
      if (err?.code === 'P2002' && userId && normalizedKey && this.prisma.order?.findUnique) {
        const concurrentOrder = await this.prisma.order.findUnique({
          where: {
            userId_idempotencyKey: {
              userId,
              idempotencyKey: normalizedKey,
            },
          },
          include: { items: true },
        });
        if (concurrentOrder) {
          if (
            concurrentOrder.idempotencyPayload &&
            concurrentOrder.idempotencyPayload !== payloadSnapshot
          ) {
            throw new ConflictException(
              'Idempotency-Key đã được sử dụng với nội dung đơn hàng khác.',
            );
          }
          return this.buildCreateOrderResponse(concurrentOrder, { isIdempotent: true });
        }
      }
      throw err;
    }
  }

  /**
   * GET /orders — Danh sách toàn bộ đơn hàng cho trang Admin (/admin)
   */
  async getAllOrdersForAdmin() {
    await expirePendingOrders(this.prisma, this.logger, { timeoutMinutes: 15 }).catch(() => 0);

    return this.prisma.order.findMany({
      include: {
        items: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        user: {
          select: { id: true, email: true, fullName: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Lấy danh sách toàn bộ đơn hàng của user (GET /orders/me)
   */
  async getMyOrders(userId: number) {
    await expirePendingOrders(this.prisma, this.logger, {
      userId,
      timeoutMinutes: 15,
    }).catch(() => 0);

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
   * Hàng đợi đơn hàng cho màn hình Barista KDS (/staff)
   */
  async getBaristaQueue() {
    const completedWindowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [orders, allRecipes, allToppingRecipes] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          OR: [
            {
              status: {
                in: [
                  OrderStatus.PAID,
                  OrderStatus.PREPARING,
                  OrderStatus.READY,
                ],
              },
            },
            {
              status: OrderStatus.COMPLETED,
              updatedAt: { gte: completedWindowStart },
            },
          ],
        },
        include: {
          items: true,
          user: {
            select: { id: true, fullName: true, phone: true },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 200,
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
   * Cập nhật trạng thái đơn hàng (PATCH /orders/:id/status)
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

    const isStaffOrAdmin = userRole === Role.STAFF || userRole === Role.ADMIN;

    if (!isStaffOrAdmin) {
      if (order.userId === null || order.userId !== userId) {
        throw new ForbiddenException('Bạn không có quyền thao tác trên đơn hàng này');
      }
      const isCustomerCancel = nextStatus === OrderStatus.CANCELLED;
      const isCustomerRetry =
        order.status === OrderStatus.PAYMENT_FAILED &&
        nextStatus === OrderStatus.PENDING;

      if (!isCustomerCancel && !isCustomerRetry) {
        throw new ForbiddenException(
          'Khách hàng không có quyền tự chuyển trạng thái đơn hàng sang trạng thái này',
        );
      }

      if (isCustomerCancel) {
        if (order.status === OrderStatus.PAID) {
          // SRS v4.3 AC-13.2: khách hàng chỉ được tự hủy đơn PAID trong 5 phút Grace Period trước khi pha chế
          const paidTimestamp = (order as any).updatedAt ?? (order as any).createdAt;
          if (
            paidTimestamp &&
            Date.now() - new Date(paidTimestamp).getTime() > PAID_CANCEL_GRACE_MS
          ) {
            throw new BadRequestException(
              'Đã quá thời gian 5 phút cho phép tự hủy đơn hàng đã thanh toán. Vui lòng liên hệ nhân viên quầy.',
            );
          }
        } else if (
          order.status !== OrderStatus.PENDING &&
          order.status !== OrderStatus.PAYMENT_FAILED
        ) {
          throw new BadRequestException(
            'Chỉ có thể hủy đơn hàng đang ở trạng thái Chờ thanh toán (PENDING), Thanh toán thất bại (PAYMENT_FAILED) hoặc Đã thanh toán (PAID) trong 5 phút.',
          );
        }
      }
    }

    if (nextStatus === OrderStatus.PAID) {
      throw new BadRequestException(
        'Trạng thái ĐÃ THANH TOÁN (PAID) chỉ được phép cập nhật thông qua Cổng thanh toán hoặc Xác nhận thanh toán hợp lệ.',
      );
    }

    if (nextStatus === OrderStatus.PAYMENT_FAILED) {
      throw new BadRequestException(
        'Trạng thái THANH TOÁN THẤT BẠI (PAYMENT_FAILED) chỉ được phép cập nhật thông qua luồng xử lý thanh toán.',
      );
    }

    const previousStatus = order.status;

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
        // Bỏ qua nếu bảng user chưa sẵn sàng trong mock
      }
    }

    assertTransition(previousStatus, nextStatus);

    // Retry thanh toán (PAYMENT_FAILED -> PENDING): kiểm tra TTL 15 phút
    if (
      previousStatus === OrderStatus.PAYMENT_FAILED &&
      nextStatus === OrderStatus.PENDING
    ) {
      if (
        order.createdAt &&
        Date.now() - new Date(order.createdAt).getTime() > ORDER_PAYMENT_TTL_MS
      ) {
        await this.prisma.$transaction(async (tx: any) => {
          const casResult = await tx.order.updateMany({
            where: {
              id: orderId,
              status: OrderStatus.PAYMENT_FAILED,
            },
            data: {
              status: OrderStatus.CANCELLED,
              voucherDeducted: false,
              version: { increment: 1 },
            },
          });
          if (casResult.count > 0) {
            await refundOrderResources(tx, order, {
              performedBy: userId ? `User #${userId}` : 'Hệ thống (Auto-Expire)',
              notePrefix: 'Hoàn kho do đơn hàng quá hạn 15 phút khi thử lại',
            });
          }
        });
        throw new BadRequestException(
          'Đơn hàng đã quá hạn thanh toán (15 phút) và đã được tự động hủy.',
        );
      }

      const updated = await this.prisma.$transaction(async (tx: any) => {
        const casResult = await tx.order.updateMany({
          where: {
            id: orderId,
            status: OrderStatus.PAYMENT_FAILED,
          },
          data: {
            status: OrderStatus.PENDING,
            version: { increment: 1 },
          },
        });
        if (casResult.count === 0) {
          throw new ConflictException(
            'Trạng thái đơn hàng đã thay đổi hoặc đang được xử lý bởi một tiến trình khác.',
          );
        }

        const updatedRecord = tx.order?.findUnique
          ? await tx.order.findUnique({ where: { id: orderId } })
          : null;

        return (
          updatedRecord || {
            id: orderId,
            status: OrderStatus.PENDING,
            updatedAt: new Date(),
          }
        );
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

    if (nextStatus === OrderStatus.CANCELLED && this.prisma.$transaction) {
      const updated = await this.prisma.$transaction(async (tx: any) => {
        const casResult = await tx.order.updateMany({
          where: {
            id: orderId,
            status: previousStatus,
          },
          data: {
            status: nextStatus,
            voucherDeducted: false,
            version: { increment: 1 },
            ...staffData,
          },
        });
        if (casResult.count === 0) {
          throw new ConflictException(
            'Trạng thái đơn hàng đã thay đổi hoặc đang được xử lý bởi một tiến trình khác.',
          );
        }

        await refundOrderResources(tx, order, {
          performedBy: userId ? `User #${userId}` : 'Hệ thống',
          notePrefix: 'Hoàn kho do hủy đơn hàng',
        });

        if (
          previousStatus === OrderStatus.PAID &&
          order.userId &&
          tx.user
        ) {
          const pointsToRevoke = Math.floor(
            order.totalAmount / POINTS_PER_VND,
          );
          if (pointsToRevoke > 0) {
            if (typeof tx.user.updateMany === 'function') {
              const decRes = await tx.user.updateMany({
                where: {
                  id: order.userId,
                  loyaltyPoints: { gte: pointsToRevoke },
                },
                data: {
                  loyaltyPoints: { decrement: pointsToRevoke },
                },
              });
              if ((decRes?.count ?? 0) === 0) {
                await tx.user.updateMany({
                  where: {
                    id: order.userId,
                    loyaltyPoints: { gt: 0, lt: pointsToRevoke },
                  },
                  data: {
                    loyaltyPoints: 0,
                  },
                });
              }
            } else {
              let currentPoints = 0;
              if (typeof tx.user.findUnique === 'function') {
                const currentUser = await tx.user.findUnique({
                  where: { id: order.userId },
                  select: { loyaltyPoints: true },
                });
                currentPoints = currentUser?.loyaltyPoints || 0;
              }
              const newPoints = Math.max(0, currentPoints - pointsToRevoke);
              await tx.user.update({
                where: { id: order.userId },
                data: {
                  loyaltyPoints: newPoints,
                },
              });
            }
          }
        }

        const updatedRecord = tx.order?.findUnique
          ? await tx.order.findUnique({ where: { id: orderId } })
          : null;

        return (
          updatedRecord || {
            id: orderId,
            status: nextStatus,
            ...staffData,
            updatedAt: new Date(),
          }
        );
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

    if (nextStatus === OrderStatus.COMPLETED && this.prisma.$transaction) {
      const updated = await this.prisma.$transaction(async (tx: any) => {
        const casResult = await tx.order.updateMany({
          where: {
            id: orderId,
            status: previousStatus,
          },
          data: {
            status: nextStatus,
            ...staffData,
            version: { increment: 1 },
          },
        });
        if (casResult.count === 0) {
          throw new ConflictException(
            'Trạng thái đơn hàng đã thay đổi hoặc đang được xử lý bởi một tiến trình khác.',
          );
        }

        const updatedRecord = tx.order?.findUnique
          ? await tx.order.findUnique({ where: { id: orderId } })
          : null;

        return (
          updatedRecord || {
            id: orderId,
            status: nextStatus,
            ...staffData,
            updatedAt: new Date(),
          }
        );
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

    const casResult = await this.prisma.order.updateMany({
      where: {
        id: orderId,
        status: previousStatus,
      },
      data: {
        status: nextStatus,
        ...staffData,
        version: { increment: 1 },
      },
    });

    if (casResult.count === 0) {
      throw new ConflictException(
        'Trạng thái đơn hàng đã thay đổi hoặc đang được xử lý bởi một tiến trình khác.',
      );
    }

    const updated = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    return {
      orderId: updated?.id ?? orderId,
      previousStatus,
      status: updated?.status ?? nextStatus,
      updatedAt: updated?.updatedAt ?? new Date(),
      staffId: (updated as any)?.staffId ?? staffData.staffId,
      staffName: (updated as any)?.staffName ?? staffData.staffName,
    };
  }

  async getOrderById(orderId: number, userId: number, userRole?: Role) {
    await expirePendingOrders(this.prisma, this.logger, {
      orderId,
      timeoutMinutes: 15,
    }).catch(() => 0);

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

    if (!isStaffOrAdmin && (order.userId === null || order.userId !== userId)) {
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
        // Fallback when product lookup is mocked out
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

    if (!isStaffOrAdmin && (order.userId === null || order.userId !== userId)) {
      throw new ForbiddenException('Bạn không có quyền xóa đơn hàng này');
    }

    if (
      order.status !== OrderStatus.CANCELLED &&
      order.status !== OrderStatus.PAYMENT_FAILED &&
      order.status !== OrderStatus.PENDING
    ) {
      throw new BadRequestException('Chỉ có thể xóa các đơn hàng đã hủy hoặc chưa thanh toán.');
    }

    if (
      (order.status === OrderStatus.PENDING ||
        order.status === OrderStatus.PAYMENT_FAILED) &&
      this.prisma.$transaction
    ) {
      return await this.prisma.$transaction(async (tx: any) => {
        const casResult = await tx.order.updateMany({
          where: {
            id: orderId,
            status: { in: [OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED] },
          },
          data: {
            status: OrderStatus.CANCELLED,
            voucherDeducted: false,
            version: { increment: 1 },
          },
        });
        if (casResult.count === 0) {
          throw new ConflictException(
            'Trạng thái đơn hàng đã thay đổi hoặc đang được xử lý bởi một tiến trình khác.',
          );
        }

        await refundOrderResources(tx, order, {
          performedBy: userId ? `User #${userId}` : 'Hệ thống',
          notePrefix: 'Hoàn kho do xóa đơn hàng chưa thanh toán',
        });

        await tx.payment.deleteMany({ where: { orderId } });
        await tx.orderItem.deleteMany({ where: { orderId } });
        await tx.order.delete({ where: { id: orderId } });
        return { success: true, message: `Đã xóa đơn hàng #${orderId}` };
      });
    }

    return await this.prisma.$transaction(async (tx: any) => {
      await tx.payment.deleteMany({ where: { orderId } });
      await tx.orderItem.deleteMany({ where: { orderId } });
      const delResult = await tx.order.deleteMany({
        where: { id: orderId, status: OrderStatus.CANCELLED },
      });
      if (delResult.count === 0) {
        throw new ConflictException(
          'Đơn hàng đã bị xóa hoặc trạng thái đã thay đổi bởi một tiến trình khác.',
        );
      }
      return { success: true, message: `Đã xóa đơn hàng #${orderId}` };
    });
  }
}
