import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { assertTransition } from './state-machine.js';

describe('Order State Machine - Tiêu chí kiểm thử (a): Chặn chuyển trạng thái sai', () => {
  describe('Các chuyển đổi trạng thái HỢP LỆ (Valid Transitions)', () => {
    it('cho phép chuyển từ PENDING sang PAID', () => {
      expect(() => assertTransition(OrderStatus.PENDING, OrderStatus.PAID)).not.toThrow();
    });

    it('cho phép chuyển từ PENDING sang PAYMENT_FAILED khi thanh toán lỗi', () => {
      expect(() => assertTransition(OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED)).not.toThrow();
    });

    it('cho phép chuyển từ PENDING sang CANCELLED khi khách hủy', () => {
      expect(() => assertTransition(OrderStatus.PENDING, OrderStatus.CANCELLED)).not.toThrow();
    });

    it('cho phép chuyển từ PAYMENT_FAILED sang PENDING để thử lại', () => {
      expect(() => assertTransition(OrderStatus.PAYMENT_FAILED, OrderStatus.PENDING)).not.toThrow();
    });

    it('cho phép chuyển từ PAID sang PREPARING', () => {
      expect(() => assertTransition(OrderStatus.PAID, OrderStatus.PREPARING)).not.toThrow();
    });

    it('cho phép chuyển từ PAID sang CANCELLED (hỗ trợ rollback test)', () => {
      expect(() => assertTransition(OrderStatus.PAID, OrderStatus.CANCELLED)).not.toThrow();
    });

    it('cho phép chuyển từ PREPARING sang READY', () => {
      expect(() => assertTransition(OrderStatus.PREPARING, OrderStatus.READY)).not.toThrow();
    });

    it('cho phép chuyển từ READY sang COMPLETED', () => {
      expect(() => assertTransition(OrderStatus.READY, OrderStatus.COMPLETED)).not.toThrow();
    });
  });

  describe('Các chuyển đổi trạng thái BỊ CHẶN (Invalid Transitions)', () => {
    it('CHẶN chuyển từ PENDING thẳng sang COMPLETED', () => {
      expect(() => assertTransition(OrderStatus.PENDING, OrderStatus.COMPLETED)).toThrow(
        BadRequestException
      );
    });

    it('CHẶN chuyển từ CANCELLED sang PAID', () => {
      expect(() => assertTransition(OrderStatus.CANCELLED, OrderStatus.PAID)).toThrow(
        BadRequestException
      );
    });

    it('CHẶN chuyển từ COMPLETED sang PENDING', () => {
      expect(() => assertTransition(OrderStatus.COMPLETED, OrderStatus.PENDING)).toThrow(
        BadRequestException
      );
    });

    it('CHẶN chuyển từ PREPARING lùi lại PAID', () => {
      expect(() => assertTransition(OrderStatus.PREPARING, OrderStatus.PAID)).toThrow(
        BadRequestException
      );
    });

    it('CHẶN chuyển từ READY lùi lại PENDING', () => {
      expect(() => assertTransition(OrderStatus.READY, OrderStatus.PENDING)).toThrow(
        BadRequestException
      );
    });
  });
});
