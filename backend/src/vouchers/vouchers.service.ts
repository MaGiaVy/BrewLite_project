import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DiscountType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class VouchersService {
  constructor(private readonly prisma: PrismaService) {}

  async validateVoucher(code: string, total: number) {
    const cleanCode = code.trim().toUpperCase();

    const voucher = await this.prisma.voucher.findUnique({
      where: { code: cleanCode },
    });

    if (!voucher) {
      throw new NotFoundException(`Mã giảm giá "${cleanCode}" không tồn tại`);
    }

    // Kiểm tra số lượt sử dụng
    if (voucher.usedCount >= voucher.usageLimit) {
      throw new BadRequestException(`Mã giảm giá "${cleanCode}" đã hết lượt sử dụng`);
    }

    // Kiểm tra hạn sử dụng
    if (voucher.expiresAt && new Date() > voucher.expiresAt) {
      throw new BadRequestException(`Mã giảm giá "${cleanCode}" đã hết hạn sử dụng`);
    }

    // Kiểm tra giá trị đơn hàng tối thiểu
    if (total < voucher.minOrderValue) {
      throw new BadRequestException(
        `Đơn hàng chưa đạt giá trị tối thiểu ${voucher.minOrderValue.toLocaleString('vi-VN')}đ để dùng mã này`
      );
    }

    // Tính toán số tiền giảm giá
    let discountAmount = 0;
    if (voucher.discountType === DiscountType.PERCENT) {
      discountAmount = Math.floor((total * voucher.discountValue) / 100);
      if (voucher.maxDiscount > 0 && discountAmount > voucher.maxDiscount) {
        discountAmount = voucher.maxDiscount;
      }
    } else {
      // FIXED
      discountAmount = Math.min(total, voucher.discountValue);
    }

    const finalTotal = Math.max(0, total - discountAmount);

    return {
      valid: true,
      voucherId: voucher.id,
      code: voucher.code,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      discountAmount,
      finalTotal,
    };
  }
}
