import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class RedeemPointsDto {
  @IsInt({ message: 'Số Hạt Vàng cần đổi phải là số nguyên' })
  @Min(1, { message: 'Số Hạt Vàng cần đổi phải lớn hơn hoặc bằng 1' })
  @Max(2147483647, { message: 'Số Hạt Vàng không hợp lệ' })
  points!: number;

  @IsString({ message: 'Mã voucher phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Vui lòng chọn mã voucher cần đổi' })
  @MaxLength(50, { message: 'Mã voucher không được vượt quá 50 ký tự' })
  voucherCode!: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  @MaxLength(200, { message: 'Mô tả không được vượt quá 200 ký tự' })
  description?: string;
}
