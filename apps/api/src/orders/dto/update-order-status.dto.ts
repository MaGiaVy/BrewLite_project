import { IsEnum } from 'class-validator';
import { OrderStatus } from '@prisma/client';

/**
 * DTO cho endpoint PATCH /orders/:id/status
 * Barista / Customer / Admin dùng để cập nhật trạng thái đơn hàng
 */
export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, {
    message:
      'status phải là một trong các giá trị: PENDING, PAID, PREPARING, READY, COMPLETED, PAYMENT_FAILED, CANCELLED',
  })
  status!: OrderStatus;
}
