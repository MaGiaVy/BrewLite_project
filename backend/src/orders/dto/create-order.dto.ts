import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsNotEmpty({ message: 'Mã sản phẩm không được để trống' })
  @IsString({ message: 'Mã sản phẩm phải là chuỗi' })
  productId: string;

  @IsNotEmpty({ message: 'Kích cỡ ly không được để trống' })
  @IsIn(['S', 'M', 'L'], { message: 'Kích cỡ phải là S, M hoặc L' })
  size: 'S' | 'M' | 'L';

  @IsOptional()
  @IsString()
  ice?: string;

  @IsOptional()
  @IsString()
  sugar?: string;

  @IsNotEmpty({ message: 'Số lượng không được để trống' })
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  @Max(20, { message: 'Số lượng tối đa là 20 món' })
  quantity: number;

  @IsOptional()
  @IsArray({ message: 'Danh sách topping phải là mảng' })
  @IsString({ each: true, message: 'Mã topping phải là chuỗi' })
  toppingIds?: string[];
}

export class CreateOrderDto {
  @IsArray({ message: 'Danh sách món không được để trống' })
  @ArrayMinSize(1, { message: 'Đơn hàng phải có ít nhất 1 món' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsOptional()
  @IsString()
  voucherCode?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: 'WALLET' | 'CARD';
}
