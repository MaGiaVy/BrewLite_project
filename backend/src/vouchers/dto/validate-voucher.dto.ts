import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class ValidateVoucherDto {
  @IsNotEmpty({ message: 'Mã voucher không được để trống' })
  @IsString({ message: 'Mã voucher phải là chuỗi ký tự' })
  code: string;

  @IsNotEmpty({ message: 'Tổng tiền đơn hàng không được để trống' })
  @IsNumber({}, { message: 'Tổng tiền phải là số nguyên' })
  @Min(0, { message: 'Tổng tiền không được âm' })
  total: number;
}
