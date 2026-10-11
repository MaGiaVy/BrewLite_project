import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { VouchersService } from './vouchers.service.js';
import { ValidateVoucherDto } from './dto/validate-voucher.dto.js';

@Controller(['vouchers', 'api/v1/vouchers'])
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateVoucher(@Body() dto: ValidateVoucherDto) {
    const data = await this.vouchersService.validateVoucher(dto.code, dto.total);
    return {
      statusCode: 200,
      message: 'Áp dụng mã giảm giá thành công',
      data,
    };
  }
}
