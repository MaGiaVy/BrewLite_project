import { IsBoolean, IsEnum, IsInt, IsOptional } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @IsInt()
  orderId!: number;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsBoolean()
  @IsOptional()
  simulateFailure?: boolean;
}
