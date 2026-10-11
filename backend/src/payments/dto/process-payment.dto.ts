import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class ProcessPaymentDto {
  @IsNotEmpty({ message: 'Mã đơn hàng không được để trống' })
  @IsString({ message: 'Mã đơn hàng phải là chuỗi' })
  orderId: string;

  @IsNotEmpty({ message: 'Số tiền thanh toán không được để trống' })
  @IsInt({ message: 'Số tiền phải là số nguyên' })
  @Min(0, { message: 'Số tiền thanh toán không được âm' })
  amount: number;

  @IsNotEmpty({ message: 'Phương thức thanh toán không được để trống' })
  @IsIn(['WALLET', 'CARD'], { message: 'Phương thức thanh toán phải là WALLET hoặc CARD' })
  method: 'WALLET' | 'CARD';

  @IsOptional()
  @IsBoolean()
  forceSuccess?: boolean; // Hỗ trợ định hướng kết quả cho unit/e2e testing
}
