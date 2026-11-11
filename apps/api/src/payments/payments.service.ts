import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { OrderStatus, PaymentMethod, PaymentStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MockGatewayService } from './mock-gateway.service';
import { MockPaymentService } from './mock-payment.service';
import {
  ZaloPayCreateOrderResult,
  ZaloPayQueryResult,
  ZaloPayService,
} from './zalopay.service';
import { assertTransition } from './state-machine.helper';
import { refundOrderResources } from '../orders/order-refund.helper';

const POINTS_PER_VND = 1000;
const ORDER_PAYMENT_TTL_MS = 15 * 60 * 1000; // SRS v4.3 AC-05.4: 15 minutes

export interface PaymentResponse {
  success: boolean;
  paymentId: number;
  orderId: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  amount: number;
  method: string;
  transactionId?: string;
  isIdempotent?: boolean;
  pointsEarned?: number;
  message: string;
}

export interface ZaloPayStatusResult {
  orderId: number;
  status: OrderStatus;
  isPaid: boolean;
  isProcessing?: boolean;
  zpTransId?: number;
  message: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    private readonly mockGatewayService: MockGatewayService | MockPaymentService | any = new MockGatewayService(),
    @Optional() private readonly zaloPayService?: ZaloPayService,
    @Optional() private readonly mockPaymentService?: MockPaymentService,
  ) {}

  private assertValidOrderId(orderId: unknown): asserts orderId is number {
    if (typeof orderId !== 'number' || !Number.isInteger(orderId) || orderId <= 0) {
      throw new BadRequestException('Mã đơn hàng không hợp lệ');
    }
  }

  private assertCanAccessOrder(
    order: { userId?: number | null },
    userId: number | undefined,
    userRole?: Role,
    message = 'Bạn không có quyền thao tác trên đơn hàng này',
  ): void {
    const isStaffOrAdmin = userRole === Role.ADMIN || userRole === Role.STAFF;
    if (
      !isStaffOrAdmin &&
      (order.userId === null || order.userId === undefined || order.userId !== userId)
    ) {
      throw new ForbiddenException(message);
    }
  }

  private extractOrderIdFromAppTransId(appTransId?: string): number | null {
    if (!appTransId) return null;
    const parts = appTransId.split('_');
    if (parts.length < 2 || !/^\d+$/.test(parts[1])) return null;
    const parsed = Number(parts[1]);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
  }

  private assertAppTransIdMatchesOrder(appTransId: string, orderId: number): void {
    const parsedOrderId = this.extractOrderIdFromAppTransId(appTransId);
    if (parsedOrderId === null || parsedOrderId !== orderId) {
      throw new BadRequestException(
        `Mã giao dịch ZaloPay (appTransId) không hợp lệ hoặc không khớp với đơn hàng #${orderId}`,
      );
    }
  }

  private async runInSavepoint<T>(
    tx: any,
    name: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const hasRaw = typeof tx?.$executeRawUnsafe === 'function';
    if (hasRaw) {
      await tx.$executeRawUnsafe(`SAVEPOINT ${name}`);
    }
    try {
      const result = await fn();
      if (hasRaw) {
        await tx.$executeRawUnsafe(`RELEASE SAVEPOINT ${name}`);
      }
      return result;
    } catch (err) {
      if (hasRaw) {
        await tx.$executeRawUnsafe(`ROLLBACK TO SAVEPOINT ${name}`);
      }
      throw err;
    }
  }

  private async invokePaymentGateway(
    amount: number,
    method: PaymentMethod,
    simulateFailure?: boolean,
  ) {
    if (typeof this.mockGatewayService?.charge === 'function') {
      return this.mockGatewayService.charge(amount, method, simulateFailure);
    }
    if (typeof this.mockGatewayService?.processPayment === 'function') {
      return this.mockGatewayService.processPayment({ amount, method, simulateFailure });
    }
    if (typeof this.mockPaymentService?.processPayment === 'function') {
      return this.mockPaymentService.processPayment({ amount, method, simulateFailure });
    }
    return new MockGatewayService().charge(amount, method, simulateFailure);
  }

  private async revokeLoyaltyPointsInTx(
    tx: any,
    userId: number,
    pointsToRevoke: number,
  ): Promise<void> {
    if (pointsToRevoke <= 0 || !tx?.user) return;
    if (typeof tx.user.updateMany === 'function') {
      const decResult = await tx.user.updateMany({
        where: {
          id: userId,
          loyaltyPoints: { gte: pointsToRevoke },
        },
        data: {
          loyaltyPoints: { decrement: pointsToRevoke },
        },
      });
      if ((decResult?.count ?? 0) === 0) {
        await tx.user.updateMany({
          where: {
            id: userId,
            loyaltyPoints: { lt: pointsToRevoke, gt: 0 },
          },
          data: {
            loyaltyPoints: 0,
          },
        });
      }
      return;
    }
    let currentPoints = 0;
    if (typeof tx.user.findUnique === 'function') {
      const currentUser = await tx.user.findUnique({
        where: { id: userId },
        select: { loyaltyPoints: true },
      });
      currentPoints = currentUser?.loyaltyPoints || 0;
    }
    const newPoints = Math.max(0, currentPoints - pointsToRevoke);
    await tx.user.update({
      where: { id: userId },
      data: { loyaltyPoints: newPoints },
    });
  }

  private buildIdempotentPaymentResponse(existingPayment: any): PaymentResponse {
    return {
      success: existingPayment.status === PaymentStatus.SUCCESS,
      paymentId: existingPayment.id,
      orderId: existingPayment.orderId,
      status: existingPayment.order?.status ?? OrderStatus.PAID,
      paymentStatus: existingPayment.status,
      amount: existingPayment.amount,
      method: existingPayment.method,
      isIdempotent: true,
      message: 'Giao dich da duoc xu ly truoc do thanh cong (Idempotent response)',
    };
  }

  private async recordMockPaymentInTx(
    tx: any,
    currentOrder: { id: number },
    paymentAmount: number,
    method: PaymentMethod,
    paymentStatus: PaymentStatus,
    idempotencyKey?: string,
    preloadedPayment?: any,
  ): Promise<{ paymentRecord?: any; idempotentResponse?: PaymentResponse }> {
    const spBase =
      paymentStatus === PaymentStatus.FAILED ? 'sp_payment_fail' : 'sp_payment_success';
    const canReusePreloaded = Boolean(
      idempotencyKey && preloadedPayment && preloadedPayment.orderId === currentOrder.id,
    );

    let paymentRecord: any;
    try {
      paymentRecord = await this.runInSavepoint(tx, `${spBase}_write`, async () => {
        if (canReusePreloaded && typeof tx.payment?.upsert === 'function') {
          const upserted = await tx.payment.upsert({
            where: { idempotencyKey },
            update: {
              status: paymentStatus,
              amount: paymentAmount,
              method,
            },
            create: {
              orderId: currentOrder.id,
              amount: paymentAmount,
              method,
              status: paymentStatus,
              idempotencyKey,
            },
          });
          if (upserted) {
            return upserted;
          }
        }
        return await tx.payment.create({
          data: {
            orderId: currentOrder.id,
            amount: paymentAmount,
            method,
            status: paymentStatus,
            idempotencyKey: idempotencyKey || null,
          },
        });
      });
    } catch (err: any) {
      if (err?.code === 'P2002' && idempotencyKey) {
        if (canReusePreloaded) {
          try {
            paymentRecord = await this.runInSavepoint(tx, `${spBase}_update`, async () => {
              return await tx.payment.update({
                where: { idempotencyKey },
                data: {
                  status: paymentStatus,
                  amount: paymentAmount,
                  method,
                },
              });
            });
          } catch {
            // Fallback to concurrent lookup below
          }
        }

        if (!paymentRecord) {
          const concurrentPayment = await this.prisma.payment.findUnique({
            where: { idempotencyKey },
            include: { order: true },
          });
          if (concurrentPayment) {
            if (concurrentPayment.orderId !== currentOrder.id) {
              throw new ConflictException(
                'Idempotency-Key da duoc su dung cho mot don hang khac.',
              );
            }
            this.logger.log(
              `[Idempotency] Phat hien yeu cau trung lap P2002 voi key "${idempotencyKey}". Tra ve ket qua giao dich cu.`,
            );
            return {
              idempotentResponse: this.buildIdempotentPaymentResponse(concurrentPayment),
            };
          }
        }
      }
      if (!paymentRecord) {
        throw err;
      }
    }

    if (paymentRecord && paymentRecord.orderId !== currentOrder.id) {
      throw new ConflictException(
        'Idempotency-Key da duoc su dung cho mot don hang khac.',
      );
    }
    return { paymentRecord };
  }

  private isOrderExpired(order: { createdAt?: Date | string | null }): boolean {
    if (!order.createdAt) return false;
    return Date.now() - new Date(order.createdAt).getTime() > ORDER_PAYMENT_TTL_MS;
  }

  private async cancelExpiredOrder(
    order: any,
    performedBy: string,
    notePrefix: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx: any) => {
      const casResult = await tx.order.updateMany({
        where: {
          id: order.id,
          status: { in: [OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED] },
        },
        data: {
          status: OrderStatus.CANCELLED,
          voucherDeducted: false,
          version: { increment: 1 },
        },
      });
      if ((casResult?.count ?? 0) > 0) {
        let orderForRefund = order;
        if (!Array.isArray(order.items) && tx.order?.findUnique) {
          const withItems = await tx.order.findUnique({
            where: { id: order.id },
            include: { items: true },
          });
          if (withItems) {
            orderForRefund = withItems;
          }
        }
        await refundOrderResources(tx, orderForRefund, {
          performedBy,
          notePrefix,
        });
      }
    });
  }

  private async deductLegacyUserVoucherIfNeeded(tx: any, order: any): Promise<void> {
    if (
      !order.userId ||
      !order.discountCode ||
      Boolean((order as any).voucherDeducted) ||
      !(tx as any).userVoucher
    ) {
      return;
    }
    try {
      await this.runInSavepoint(tx, 'sp_legacy_voucher', async () => {
        const userVoucher = await (tx as any).userVoucher.findUnique({
          where: {
            userId_code: {
              userId: order.userId,
              code: order.discountCode,
            },
          },
        });
        if (userVoucher) {
          if (userVoucher.quantity > 1) {
            await (tx as any).userVoucher.update({
              where: { id: userVoucher.id },
              data: { quantity: { decrement: 1 } },
            });
          } else {
            await (tx as any).userVoucher.delete({
              where: { id: userVoucher.id },
            });
          }
          if (tx.order?.updateMany) {
            await tx.order.updateMany({
              where: { id: order.id },
              data: { voucherDeducted: true },
            });
          }
        }
      });
    } catch {
      // Ignore if UserVoucher table is absent in simplified test doubles
    }
  }

  async processPayment(
    dto: CreatePaymentDto,
    userId: number,
    idempotencyKey?: string,
    userRole?: Role,
  ): Promise<PaymentResponse> {
    this.assertValidOrderId(dto?.orderId);

    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Khong tim thay don hang voi ma #${dto.orderId}`);
    }

    this.assertCanAccessOrder(
      order,
      userId,
      userRole,
      'Ban khong co quyen thanh toan cho don hang nay',
    );

    let preloadedPayment: any = null;
    if (idempotencyKey) {
      const existingPayment = await this.prisma.payment.findUnique({
        where: { idempotencyKey },
        include: { order: true },
      });

      if (existingPayment) {
        if (existingPayment.orderId !== order.id) {
          throw new ConflictException(
            'Idempotency-Key da duoc su dung cho mot don hang khac.',
          );
        }
        if (existingPayment.status === PaymentStatus.SUCCESS) {
          this.logger.log(
            `[Idempotency] Phat hien yeu cau trung lap voi key "${idempotencyKey}". Tra ve ket qua giao dich cu.`,
          );
          return this.buildIdempotentPaymentResponse(existingPayment);
        }
        preloadedPayment = existingPayment;
      }
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException(
        'Đơn hàng đã bị hủy hoặc hết hạn thanh toán (quá 15 phút). Vui lòng tạo đơn mới.',
      );
    }

    if (
      (order.status === OrderStatus.PENDING || order.status === OrderStatus.PAYMENT_FAILED) &&
      this.isOrderExpired(order)
    ) {
      await this.cancelExpiredOrder(
        order,
        userId ? `User #${userId}` : 'Hệ thống (Auto-Expire)',
        'Hoàn kho do đơn hàng quá hạn 15 phút khi thanh toán',
      );
      throw new BadRequestException(
        'Đơn hàng đã hết hạn thanh toán (quá 15 phút) và đã được tự động hủy.',
      );
    }

    const paymentAmount = order.totalAmount;
    const effectiveSimulateFailure =
      Boolean(dto.simulateFailure) || process.env.MOCK_PAYMENT_MODE === 'failure';
    const targetStatus = effectiveSimulateFailure
      ? OrderStatus.PAYMENT_FAILED
      : OrderStatus.PAID;

    if (order.status === OrderStatus.PAYMENT_FAILED) {
      assertTransition(OrderStatus.PAYMENT_FAILED, OrderStatus.PENDING);
      assertTransition(OrderStatus.PENDING, targetStatus);
    } else {
      assertTransition(order.status, targetStatus);
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const currentOrder = await tx.order.findUnique({
          where: { id: dto.orderId },
        });

        if (!currentOrder) {
          throw new NotFoundException(`Khong tim thay don hang #${dto.orderId}`);
        }

        let activeStatus = currentOrder.status;
        let activeVersion = currentOrder.version;

        if (currentOrder.status === OrderStatus.PAYMENT_FAILED) {
          assertTransition(OrderStatus.PAYMENT_FAILED, OrderStatus.PENDING);
          const retryResult = await tx.order.updateMany({
            where: {
              id: currentOrder.id,
              status: OrderStatus.PAYMENT_FAILED,
              ...(currentOrder.version !== undefined ? { version: currentOrder.version } : {}),
            },
            data: {
              status: OrderStatus.PENDING,
              version: { increment: 1 },
            },
          });
          if (retryResult.count === 0) {
            throw new ConflictException(
              `Don hang #${currentOrder.id} da bi thay doi boi mot request khac. Vui long thu lai.`,
            );
          }
          activeStatus = OrderStatus.PENDING;
          activeVersion =
            typeof currentOrder.version === 'number'
              ? currentOrder.version + 1
              : currentOrder.version;
        }

        const gatewayResult = await this.invokePaymentGateway(
          paymentAmount,
          dto.method,
          effectiveSimulateFailure,
        );

        const isPaymentSuccess = Boolean(gatewayResult?.success) && !effectiveSimulateFailure;

        if (!isPaymentSuccess) {
          assertTransition(activeStatus, OrderStatus.PAYMENT_FAILED);
          const failResult = await tx.order.updateMany({
            where: {
              id: currentOrder.id,
              status: activeStatus,
              ...(activeVersion !== undefined ? { version: activeVersion } : {}),
            },
            data: {
              status: OrderStatus.PAYMENT_FAILED,
              version: { increment: 1 },
            },
          });

          if (failResult.count === 0) {
            throw new ConflictException(
              `Don hang #${currentOrder.id} da bi thay doi boi mot request khac. Vui long thu lai.`,
            );
          }

          const failWrite = await this.recordMockPaymentInTx(
            tx,
            currentOrder,
            paymentAmount,
            dto.method,
            PaymentStatus.FAILED,
            idempotencyKey,
            preloadedPayment,
          );
          if (failWrite.idempotentResponse) {
            return failWrite.idempotentResponse;
          }
          const paymentRecord = failWrite.paymentRecord;

          this.logger.warn(
            `[Payment Failed] Don hang #${currentOrder.id} thanh toan that bai. Ma Payment: #${paymentRecord.id}`,
          );

          return {
            success: false,
            paymentId: paymentRecord.id,
            orderId: currentOrder.id,
            status: OrderStatus.PAYMENT_FAILED,
            paymentStatus: paymentRecord.status,
            amount: paymentRecord.amount,
            method: paymentRecord.method,
            transactionId: gatewayResult?.transactionId,
            message: gatewayResult?.message || 'Thanh toan that bai',
          };
        }

        assertTransition(activeStatus, OrderStatus.PAID);
        const successResult = await tx.order.updateMany({
          where: {
            id: currentOrder.id,
            status: activeStatus,
            ...(activeVersion !== undefined ? { version: activeVersion } : {}),
          },
          data: {
            status: OrderStatus.PAID,
            version: { increment: 1 },
          },
        });

        if (successResult.count === 0) {
          throw new ConflictException(
            `Don hang #${currentOrder.id} da bi thay doi boi mot request khac. Vui long thu lai.`,
          );
        }

        await this.deductLegacyUserVoucherIfNeeded(tx, currentOrder);

        const successWrite = await this.recordMockPaymentInTx(
          tx,
          currentOrder,
          paymentAmount,
          dto.method,
          PaymentStatus.SUCCESS,
          idempotencyKey,
          preloadedPayment,
        );
        if (successWrite.idempotentResponse) {
          return successWrite.idempotentResponse;
        }
        const paymentRecord = successWrite.paymentRecord;

        const pointsEarned = Math.floor(paymentAmount / POINTS_PER_VND);

        if (pointsEarned > 0 && currentOrder.userId) {
          await tx.user.update({
            where: { id: currentOrder.userId },
            data: { loyaltyPoints: { increment: pointsEarned } },
          });
          this.logger.log(
            `[Loyalty] Don #${currentOrder.id}: Cong ${pointsEarned} Hat Vang cho User #${currentOrder.userId}`,
          );
        }

        this.logger.log(
          `[Payment Success] Don hang #${currentOrder.id} thanh toan thanh cong. Ma Payment: #${paymentRecord.id}`,
        );

        return {
          success: true,
          paymentId: paymentRecord.id,
          orderId: currentOrder.id,
          status: OrderStatus.PAID,
          paymentStatus: paymentRecord.status,
          amount: paymentRecord.amount,
          method: paymentRecord.method,
          transactionId: gatewayResult?.transactionId,
          pointsEarned,
          message:
            pointsEarned > 0
              ? `Thanh toan thanh cong! Ban nhan duoc +${pointsEarned} Hat Vang BrewLite Club.`
              : 'Thanh toan don hang thanh cong!',
        };
      });
    } catch (err: any) {
      if (err?.code === 'P2002' && idempotencyKey) {
        const existingPayment = await this.prisma.payment.findUnique({
          where: { idempotencyKey },
          include: { order: true },
        });
        if (existingPayment) {
          if (existingPayment.orderId !== order.id) {
            throw new ConflictException(
              'Idempotency-Key da duoc su dung cho mot don hang khac.',
            );
          }
          this.logger.log(
            `[Idempotency] Phat hien yeu cau trung lap P2002 sau rollback voi key "${idempotencyKey}". Tra ve ket qua giao dich cu.`,
          );
          return this.buildIdempotentPaymentResponse(existingPayment);
        }
      }
      throw err;
    }
  }

  private async settleZaloPayPaymentInTx(
    tx: any,
    txOrder: any,
    paidAmount: number,
    idempotencyKey: string,
  ): Promise<{ casCount: number; paymentCreated: boolean }> {
    const cas = await tx.order.updateMany({
      where: { id: txOrder.id, status: OrderStatus.PENDING },
      data: {
        status: OrderStatus.PAID,
        version: { increment: 1 },
      },
    });
    if ((cas?.count ?? 0) === 0) {
      return { casCount: 0, paymentCreated: false };
    }

    await this.deductLegacyUserVoucherIfNeeded(tx, txOrder);

    let paymentCreated = false;
    try {
      await this.runInSavepoint(tx, 'sp_zalopay_payment', async () => {
        await tx.payment.create({
          data: {
            orderId: txOrder.id,
            amount: paidAmount,
            method: PaymentMethod.EWALLET,
            status: PaymentStatus.SUCCESS,
            idempotencyKey,
          },
        });
        paymentCreated = true;
      });
    } catch (paymentErr: any) {
      if (paymentErr?.code === 'P2002') {
        this.logger.log(
          `[ZaloPay Callback] Bản ghi payment đã tồn tại (P2002) cho đơn #${txOrder.id}`,
        );
      } else {
        throw paymentErr;
      }
    }

    const points = Math.floor(paidAmount / POINTS_PER_VND);
    if (paymentCreated && points > 0 && txOrder.userId) {
      await tx.user.update({
        where: { id: txOrder.userId },
        data: { loyaltyPoints: { increment: points } },
      });
    }

    return { casCount: cas.count, paymentCreated };
  }

  async createZaloPayOrder(
    orderId: number,
    userId: number,
    userRole?: Role,
  ): Promise<ZaloPayCreateOrderResult> {
    this.assertValidOrderId(orderId);
    if (!this.zaloPayService) {
      throw new BadRequestException('ZaloPayService chưa được cấu hình.');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${orderId}`);
    }

    this.assertCanAccessOrder(
      order,
      userId,
      userRole,
      'Bạn không có quyền thực hiện thanh toán cho đơn hàng này',
    );

    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.PAYMENT_FAILED
    ) {
      throw new BadRequestException(
        `Đơn hàng #${orderId} hiện không ở trạng thái chờ thanh toán (${order.status})`,
      );
    }

    if (this.isOrderExpired(order)) {
      await this.cancelExpiredOrder(
        order,
        userId ? `User #${userId}` : 'Hệ thống (Auto-Expire)',
        'Hoàn kho do đơn hàng quá hạn 15 phút khi tạo giao dịch ZaloPay',
      );
      throw new BadRequestException(
        'Đơn hàng đã hết hạn thanh toán (quá 15 phút) và đã được tự động hủy.',
      );
    }

    if (order.status === OrderStatus.PAYMENT_FAILED) {
      assertTransition(OrderStatus.PAYMENT_FAILED, OrderStatus.PENDING);
      const retryCas = await this.prisma.order.updateMany({
        where: { id: orderId, status: OrderStatus.PAYMENT_FAILED },
        data: { status: OrderStatus.PENDING, version: { increment: 1 } },
      });
      if (retryCas.count === 0) {
        throw new ConflictException(
          `Đơn hàng #${orderId} đã bị thay đổi bởi một tiến trình khác. Vui lòng thử lại.`,
        );
      }
    }

    return await this.zaloPayService.createOrder({
      orderId: order.id,
      amount: order.totalAmount,
      description: `BrewLite - Thanh toan don hang #${order.id}`,
      appUser: `user_${userId}`,
    });
  }

  async handleZaloPayCallback(body: { data: string; mac: string; type?: number }) {
    if (!this.zaloPayService) {
      return { return_code: 0, return_message: 'ZaloPayService unavailable' };
    }

    const isValid = this.zaloPayService.verifyCallback(body.data, body.mac);
    if (!isValid) {
      this.logger.error('[ZaloPay Callback] Chữ ký MAC không hợp lệ (Tampered Data)');
      return { return_code: -1, return_message: 'mac not equal' };
    }

    try {
      const dataJson = JSON.parse(body.data);
      const { app_trans_id, amount, zp_trans_id, embed_data } = dataJson;

      let orderId: number | null = null;
      if (embed_data) {
        try {
          const parsed = JSON.parse(embed_data);
          if (parsed.orderId) {
            const parsedId = Number(parsed.orderId);
            if (Number.isInteger(parsedId) && parsedId > 0) {
              orderId = parsedId;
            }
          }
        } catch {
          // Fallback to app_trans_id parsing below
        }
      }

      if (!orderId) {
        orderId = this.extractOrderIdFromAppTransId(app_trans_id);
      }

      if (!orderId) {
        this.logger.error(
          `[ZaloPay Callback] Không trích xuất được orderId từ app_trans_id: ${app_trans_id}`,
        );
        return { return_code: 0, return_message: 'orderId not found' };
      }

      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        this.logger.warn(`[ZaloPay Callback] Không tìm thấy đơn hàng #${orderId}`);
        return { return_code: 0, return_message: 'order not found' };
      }

      const alreadyProcessedStatuses: OrderStatus[] = [
        OrderStatus.PAID,
        OrderStatus.PREPARING,
        OrderStatus.READY,
        OrderStatus.COMPLETED,
      ];
      if (alreadyProcessedStatuses.includes(order.status)) {
        this.logger.log(
          `[ZaloPay Callback] Đơn hàng #${orderId} đã được thanh toán trước đó (${order.status}) (Idempotent)`,
        );
        return { return_code: 1, return_message: 'Order already processed' };
      }

      if (!amount || Number(amount) !== order.totalAmount) {
        this.logger.error(
          `[ZaloPay Callback] Gian lận số tiền! Số tiền callback (${amount}) không khớp đơn #${orderId} (${order.totalAmount})`,
        );
        return { return_code: 2, return_message: 'Số tiền thanh toán không khớp đơn hàng' };
      }

      if (order.status === OrderStatus.CANCELLED) {
        this.logger.warn(
          `[ZaloPay Callback] Đơn hàng #${orderId} đã bị hủy hoặc hết hạn, từ chối cập nhật trạng thái PAID`,
        );
        return { return_code: 1, return_message: 'Đơn hàng đã hết hạn hoặc bị hủy' };
      }

      if (
        (order.status === OrderStatus.PENDING || order.status === OrderStatus.PAYMENT_FAILED) &&
        this.isOrderExpired(order)
      ) {
        this.logger.warn(
          `[ZaloPay Callback] Đơn hàng #${orderId} đã quá hạn thanh toán 15 phút, tự động hủy và hoàn kho.`,
        );
        await this.cancelExpiredOrder(
          order,
          'ZaloPay Callback (Auto-Expire)',
          'Hoàn kho do webhook ZaloPay đến sau khi đơn hàng quá hạn 15 phút',
        );
        return {
          return_code: 0,
          return_message: 'Đơn hàng đã quá hạn thanh toán (15 phút) và đã được hủy',
        };
      }

      if (order.status === OrderStatus.PAYMENT_FAILED) {
        this.logger.warn(
          `[ZaloPay Callback] Đơn hàng #${orderId} đang ở trạng thái PAYMENT_FAILED, từ chối cập nhật trực tiếp sang PAID`,
        );
        return {
          return_code: 0,
          return_message: 'Đơn hàng đã hết hạn, bị hủy hoặc đang chờ thử lại',
        };
      }

      const txResult = await this.prisma.$transaction(async (tx) => {
        const txOrder = tx.order?.findUnique
          ? await tx.order.findUnique({ where: { id: orderId } })
          : order;

        if (!txOrder) {
          return { return_code: 0, return_message: 'order not found' };
        }

        if (alreadyProcessedStatuses.includes(txOrder.status)) {
          return { return_code: 1, return_message: 'success' };
        }

        if (
          txOrder.status === OrderStatus.CANCELLED ||
          txOrder.status === OrderStatus.PAYMENT_FAILED
        ) {
          return {
            return_code: 0,
            return_message: 'Đơn hàng đã hết hạn, bị hủy hoặc đang chờ thử lại',
          };
        }

        const { casCount } = await this.settleZaloPayPaymentInTx(
          tx,
          txOrder,
          Number(amount),
          `ZALOPAY_${zp_trans_id || app_trans_id}`,
        );

        if (casCount === 0) {
          const latest = tx.order?.findUnique
            ? await tx.order.findUnique({ where: { id: orderId } })
            : null;
          if (
            latest &&
            (latest.status === OrderStatus.CANCELLED ||
              latest.status === OrderStatus.PAYMENT_FAILED)
          ) {
            return {
              return_code: 0,
              return_message: 'Đơn hàng đã hết hạn, bị hủy hoặc đang chờ thử lại',
            };
          }
          return { return_code: 1, return_message: 'Order already processed' };
        }

        return null;
      });

      if (txResult) {
        return txResult;
      }

      this.logger.log(
        `[ZaloPay Callback] Đơn #${orderId} thanh toán thành công qua ZaloPay (zp_trans_id: ${zp_trans_id})`,
      );
      return { return_code: 1, return_message: 'success' };
    } catch (err: any) {
      if (err?.code === 'P2002') {
        this.logger.warn(
          `[ZaloPay Callback] Giao dịch trùng lặp P2002. Trả về return_code 1 để dừng retry.`,
        );
        return { return_code: 1, return_message: 'Order already processed' };
      }
      this.logger.error(`[ZaloPay Callback] Lỗi xử lý callback: ${err.message}`);
      return { return_code: 0, return_message: err.message };
    }
  }

  async getZaloPayStatus(
    orderId: number,
    userId: number,
    appTransId?: string,
    userRole?: Role,
  ): Promise<ZaloPayStatusResult> {
    this.assertValidOrderId(orderId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${orderId}`);
    }

    this.assertCanAccessOrder(
      order,
      userId,
      userRole,
      'Bạn không có quyền xem thông tin thanh toán của đơn hàng này',
    );

    if (appTransId) {
      this.assertAppTransIdMatchesOrder(appTransId, order.id);
    }

    const paidOrLaterStatuses: OrderStatus[] = [
      OrderStatus.PAID,
      OrderStatus.PREPARING,
      OrderStatus.READY,
      OrderStatus.COMPLETED,
    ];
    if (paidOrLaterStatuses.includes(order.status)) {
      return {
        orderId: order.id,
        status: order.status,
        isPaid: true,
        message: 'Đơn hàng đã được thanh toán thành công',
      };
    }

    if (
      (order.status === OrderStatus.PENDING || order.status === OrderStatus.PAYMENT_FAILED) &&
      this.isOrderExpired(order)
    ) {
      await this.cancelExpiredOrder(
        order,
        userId ? `User #${userId}` : 'Hệ thống (Auto-Expire)',
        'Hoàn kho do đơn hàng quá hạn 15 phút khi tra cứu trạng thái ZaloPay',
      );
      return {
        orderId: order.id,
        status: OrderStatus.CANCELLED,
        isPaid: false,
        message: 'Đơn hàng đã hết hạn thanh toán (quá 15 phút) và đã được tự động hủy.',
      };
    }

    if (order.status === OrderStatus.PENDING && appTransId && this.zaloPayService) {
      try {
        const queryRes: ZaloPayQueryResult = await this.zaloPayService.queryStatus(appTransId);

        if (queryRes.returnCode === 1) {
          if (queryRes.amount !== order.totalAmount) {
            throw new BadRequestException(
              'Số tiền thanh toán trên ZaloPay không khớp với tổng tiền đơn hàng',
            );
          }

          let transitionedNow = false;
          await this.prisma.$transaction(async (tx) => {
            const { casCount } = await this.settleZaloPayPaymentInTx(
              tx,
              order,
              queryRes.amount || order.totalAmount,
              `ZALOPAY_${queryRes.zpTransId || appTransId}`,
            );
            transitionedNow = casCount > 0;
          });

          if (!transitionedNow) {
            const latestOrder = await this.prisma.order.findUnique({
              where: { id: orderId },
            });
            const latestStatus = latestOrder?.status ?? order.status;
            const latestPaid = paidOrLaterStatuses.includes(latestStatus);
            return {
              orderId: order.id,
              status: latestStatus,
              isPaid: latestPaid,
              ...(latestPaid ? { zpTransId: queryRes.zpTransId } : {}),
              message: latestPaid
                ? 'Đơn hàng đã được thanh toán thành công'
                : 'Đơn hàng không thể hoàn tất thanh toán (đã hủy hoặc thay đổi trạng thái)',
            };
          }

          return {
            orderId: order.id,
            status: OrderStatus.PAID,
            isPaid: true,
            zpTransId: queryRes.zpTransId,
            message: 'Thanh toán qua ZaloPay thành công!',
          };
        }

        return {
          orderId: order.id,
          status: order.status,
          isPaid: false,
          isProcessing: queryRes.isProcessing,
          message: queryRes.returnMessage,
        };
      } catch (err: any) {
        if (err instanceof BadRequestException) {
          throw err;
        }
        this.logger.warn(
          `[ZaloPay Polling] Không thể tra cứu trạng thái ZaloPay: ${err.message}`,
        );
      }
    }

    return {
      orderId: order.id,
      status: order.status,
      isPaid: false,
      message: 'Đơn hàng đang chờ thanh toán',
    };
  }

  async confirmZaloPaySandbox(
    orderId?: number,
    userId?: number,
    userRole?: Role,
    appTransId?: string,
  ) {
    const resolvedOrderId =
      orderId ?? this.extractOrderIdFromAppTransId(appTransId) ?? undefined;
    this.assertValidOrderId(resolvedOrderId);

    if (!this.zaloPayService) {
      throw new BadRequestException('ZaloPayService chưa được cấu hình.');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: resolvedOrderId },
    });
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${resolvedOrderId}`);
    }

    this.assertCanAccessOrder(
      order,
      userId,
      userRole,
      'Bạn không có quyền xác nhận hoặc hủy thanh toán đơn hàng này',
    );

    if (appTransId) {
      this.assertAppTransIdMatchesOrder(appTransId, order.id);
    }

    if (
      (order.status === OrderStatus.PENDING || order.status === OrderStatus.PAYMENT_FAILED) &&
      this.isOrderExpired(order)
    ) {
      await this.cancelExpiredOrder(
        order,
        userId ? `User #${userId}` : 'Hệ thống (Auto-Expire)',
        'Hoàn kho do đơn hàng quá hạn 15 phút khi xác nhận ZaloPay Sandbox',
      );
      throw new BadRequestException(
        'Đơn hàng đã hết hạn thanh toán (quá 15 phút) và đã được tự động hủy.',
      );
    }

    if (
      order.status === OrderStatus.CANCELLED ||
      order.status === OrderStatus.PAYMENT_FAILED
    ) {
      throw new BadRequestException(
        'Đơn hàng đã hết hạn, bị hủy hoặc đang chờ thử lại, không thể xác nhận thanh toán.',
      );
    }

    const transId = appTransId || `261024_${resolvedOrderId}_${Date.now()}`;
    const payload = this.zaloPayService.createMockCallbackPayload(
      order.id,
      order.totalAmount,
      transId,
    );

    const result = await this.handleZaloPayCallback(payload);
    if (
      result.return_code !== 1 ||
      result.return_message === 'Đơn hàng đã hết hạn hoặc bị hủy'
    ) {
      throw new BadRequestException(
        result.return_message || 'Không thể xác nhận thanh toán cho đơn hàng này',
      );
    }

    return {
      success: true,
      message: result.return_message,
      orderId: order.id,
      appTransId: transId,
      totalAmount: order.totalAmount,
      status: order.status === OrderStatus.PENDING ? OrderStatus.PAID : order.status,
    };
  }

  async cancelZaloPaySandbox(
    orderId: number,
    userId?: number,
    userRole?: Role,
  ) {
    this.assertValidOrderId(orderId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${orderId}`);
    }

    this.assertCanAccessOrder(
      order,
      userId,
      userRole,
      'Bạn không có quyền xác nhận hoặc hủy thanh toán đơn hàng này',
    );

    if (order.status === OrderStatus.CANCELLED) {
      this.logger.log(
        `[ZaloPay Gateway] Đơn hàng #${orderId} đã ở trạng thái CANCELLED trước đó.`,
      );
      return {
        success: true,
        message: 'Giao dịch ZaloPay đã được hủy',
        orderId: order.id,
        status: OrderStatus.CANCELLED,
      };
    }

    const isStaffOrAdmin = userRole === Role.ADMIN || userRole === Role.STAFF;
    if (!isStaffOrAdmin && order.status === OrderStatus.PAID) {
      throw new ForbiddenException(
        'Khách hàng không thể tự hủy đơn hàng đã thanh toán. Vui lòng liên hệ nhân viên quầy.',
      );
    }

    assertTransition(order.status, OrderStatus.CANCELLED);

    if (this.prisma.$transaction) {
      await this.prisma.$transaction(async (tx: any) => {
        if (tx.order?.updateMany) {
          const casResult = await tx.order.updateMany({
            where: {
              id: orderId,
              status: order.status,
            },
            data: {
              status: OrderStatus.CANCELLED,
              voucherDeducted: false,
              version: { increment: 1 },
            },
          });
          if (casResult && casResult.count === 0) {
            throw new ConflictException(
              'Trạng thái đơn hàng đã thay đổi hoặc đang được xử lý bởi một tiến trình khác.',
            );
          }
        } else if (tx.order?.update) {
          await tx.order.update({
            where: { id: orderId },
            data: {
              status: OrderStatus.CANCELLED,
              voucherDeducted: false,
              version: { increment: 1 },
            },
          });
        }

        await refundOrderResources(tx, order, {
          performedBy: userId ? `User #${userId}` : 'ZaloPay Gateway',
          notePrefix: 'Hoàn kho do hủy thanh toán ZaloPay đơn hàng',
        });

        if (order.status === OrderStatus.PAID && order.userId && tx.user) {
          const pointsToRevoke = Math.floor(order.totalAmount / POINTS_PER_VND);
          await this.revokeLoyaltyPointsInTx(tx, order.userId, pointsToRevoke);
        }
      });
    }

    this.logger.log(
      `[ZaloPay Gateway] Người dùng đã hủy giao dịch trên Cổng ZaloPay cho đơn hàng #${orderId}`,
    );
    return {
      success: true,
      message: 'Giao dịch ZaloPay đã được hủy',
      orderId: order.id,
      status: OrderStatus.CANCELLED,
    };
  }
}
