import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { NoUnsafeHtml } from '../../common/validators/no-unsafe-html.validator';

export class OrderItemDto {
  @IsInt()
  @Min(1)
  @Max(2147483647)
  productId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  @NoUnsafeHtml()
  productName?: string;

  @IsIn(['S', 'M', 'L', 'ALL'])
  size!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @NoUnsafeHtml()
  sugarLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @NoUnsafeHtml()
  iceLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @NoUnsafeHtml()
  temperature?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @NoUnsafeHtml()
  notes?: string;

  @IsArray()
  @ArrayMaxSize(10, { message: 'Mỗi món chỉ được chọn tối đa 10 topping' })
  @ArrayUnique(
    (val: string) => (typeof val === 'string' ? val.trim().toLowerCase() : val),
    { message: 'Danh sách topping không được trùng lặp' },
  )
  @IsString({ each: true })
  @IsNotEmpty({ each: true, message: 'Tên topping không được để trống' })
  @Matches(/\S/, { each: true, message: 'Tên topping không được chứa toàn khoảng trắng' })
  @MaxLength(50, { each: true, message: 'Tên topping không được vượt quá 50 ký tự' })
  @NoUnsafeHtml({ each: true })
  toppings!: string[];

  @IsInt()
  @Min(1)
  @Max(50)
  quantity!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000000)
  unitPrice?: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(50)
  discountCode?: string;
}
