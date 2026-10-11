import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProcessPaymentDto } from './dto/process-payment.dto.js';
import { assertTransition } from '../orders/state-machine.js';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async processPayment(
    userId: string,
    idempotencyKey: string,
    dto: ProcessPaymentDto
  ) {
    if (!idempotencyKey) {
      throw new BadRequestException('Bắt buộc phải có header "Idempotency-Key"');
    }

    // 1. Kiểm tra Idempotency thanh toán
    const existingPayment = await this.prisma.payment.findUnique({
      where: { idempotencyKey },
    });

    if (existingPayment && existingPayment.status === PaymentStatus.SUCCESS) {
      return {
        statusCode: 200,
        message: 'Giao dịch thanh toán đã thành công trước đó (Idempotent replay)',
        data: {
          status: 'SUCCESS',
          paymentId: existingPayment.id,
          orderId: existingPayment.orderId,
          amount: existingPayment.amount,
        },
      };
    }

    // 2. Tìm đơn hàng
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng: ${dto.orderId}`);
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền thanh toán cho đơn hàng này');
    }

    if (dto.amount !== order.finalTotal) {
      throw new BadRequestException(
        `Số tiền gửi lên (${dto.amount.toLocaleString('vi-VN')}đ) không khớp với giá trị đơn hàng (${order.finalTotal.toLocaleString('vi-VN')}đ)`
      );
    }

    // 3. Quyết định cổng thanh toán Mock Gateway
    let isSuccess = true;
    if (typeof dto.forceSuccess === 'boolean') {
      isSuccess = dto.forceSuccess;
    } else {
      // Mặc định tỷ lệ thành công 80% cho trải nghiệm mượt mà
      isSuccess = Math.random() < 0.8;
    }

    // 4. Thực thi trong Transaction
    return await this.prisma.$transaction(async (tx) => {
      if (isSuccess) {
        // Kiểm tra chuyển trạng thái: PENDING -> PAID
        assertTransition(order.status, OrderStatus.PAID);

        // Lưu giao dịch thanh toán thành công
        const payment = await tx.payment.create({
          data: {
            orderId: order.id,
            idempotencyKey,
            amount: dto.amount,
            method: dto.method,
            status: PaymentStatus.SUCCESS,
          },
        });

        // Cập nhật trạng thái đơn hàng sang PAID
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.PAID,
            paymentMethod: dto.method,
          },
        });

        // Cập nhật lượt dùng của Voucher (nếu có)
        if (order.voucherId) {
          await tx.voucher.update({
            where: { id: order.voucherId },
            data: { usedCount: { increment: 1 } },
          });
        }

        // Tích lũy điểm thưởng thành viên (Loyalty points: 1 điểm cho mỗi 10.000đ)
        const earnedPoints = Math.floor(order.finalTotal / 10000);
        if (earnedPoints > 0) {
          await tx.user.update({
            where: { id: userId },
            data: { loyaltyPoints: { increment: earnedPoints } },
          });
        }

        return {
          statusCode: 200,
          message: 'Thanh toán thành công! Đơn hàng đã chuyển sang quầy pha chế.',
          data: {
            status: 'SUCCESS',
            paymentId: payment.id,
            orderId: order.id,
            orderStatus: OrderStatus.PAID,
            earnedPoints,
          },
        };
      } else {
        // Thanh toán thất bại
        assertTransition(order.status, OrderStatus.PAYMENT_FAILED);

        const payment = await tx.payment.create({
          data: {
            orderId: order.id,
            idempotencyKey,
            amount: dto.amount,
            method: dto.method,
            status: PaymentStatus.FAILURE,
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.PAYMENT_FAILED,
            paymentMethod: dto.method,
          },
        });

        return {
          statusCode: 200,
          message: 'Thanh toán không thành công, vui lòng thử lại hoặc chọn phương thức khác.',
          data: {
            status: 'FAILURE',
            paymentId: payment.id,
            orderId: order.id,
            orderStatus: OrderStatus.PAYMENT_FAILED,
          },
        };
      }
    });
  }
}
