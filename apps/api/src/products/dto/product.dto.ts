import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { NoUnsafeHtml } from '../../common/validators/no-unsafe-html.validator';

const MAX_VND_AMOUNT = 100000000;

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên món không được để trống' })
  @MaxLength(150)
  @NoUnsafeHtml()
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @NoUnsafeHtml()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @IsInt({ message: 'Giá bán phải là số nguyên (VND)' })
  @Min(0, { message: 'Giá bán không được âm' })
  @Max(MAX_VND_AMOUNT, { message: 'Giá bán không được vượt quá 100.000.000đ' })
  basePrice!: number;

  @IsOptional()
  @IsInt({ message: 'Phụ thu size M phải là số nguyên (VND)' })
  @Min(0)
  @Max(MAX_VND_AMOUNT)
  sizeUpchargeM?: number | null;

  @IsOptional()
  @IsInt({ message: 'Phụ thu size L phải là số nguyên (VND)' })
  @Min(0)
  @Max(MAX_VND_AMOUNT)
  sizeUpchargeL?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tag?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isSoldOutManual?: boolean;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Tên món không được để trống' })
  @MaxLength(150)
  @NoUnsafeHtml()
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @NoUnsafeHtml()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @IsInt({ message: 'Giá bán phải là số nguyên (VND)' })
  @Min(0, { message: 'Giá bán không được âm' })
  @Max(MAX_VND_AMOUNT, { message: 'Giá bán không được vượt quá 100.000.000đ' })
  basePrice?: number;

  @IsOptional()
  @IsInt({ message: 'Phụ thu size M phải là số nguyên (VND)' })
  @Min(0)
  @Max(MAX_VND_AMOUNT)
  sizeUpchargeM?: number | null;

  @IsOptional()
  @IsInt({ message: 'Phụ thu size L phải là số nguyên (VND)' })
  @Min(0)
  @Max(MAX_VND_AMOUNT)
  sizeUpchargeL?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tag?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isSoldOutManual?: boolean;
}

export class ToggleProductVisibilityDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isSoldOutManual?: boolean;
}

export class ToggleSoldOutDto {
  @IsBoolean()
  isSoldOutManual!: boolean;
}
