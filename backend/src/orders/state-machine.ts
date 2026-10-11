import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [
    OrderStatus.PAID,
    OrderStatus.PAYMENT_FAILED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PAYMENT_FAILED]: [
    OrderStatus.PENDING,     // Khách bấm "Thử lại thanh toán"
    OrderStatus.CANCELLED,   // Khách bấm "Hủy đơn"
  ],
  [OrderStatus.PAID]: [
    OrderStatus.PREPARING,
    OrderStatus.CANCELLED,   // Hỗ trợ rollback test theo đề bài thầy
  ],
  [OrderStatus.PREPARING]: [OrderStatus.READY],
  [OrderStatus.READY]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [], // Trạng thái kết thúc
  [OrderStatus.CANCELLED]: [], // Trạng thái kết thúc
};

export function assertTransition(current: OrderStatus, next: OrderStatus): void {
  const allowed = VALID_TRANSITIONS[current] || [];
  if (!allowed.includes(next)) {
    throw new BadRequestException(
      `Không thể chuyển trạng thái đơn hàng từ ${current} sang ${next}`
    );
  }
}
