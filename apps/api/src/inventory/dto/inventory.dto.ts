import {
  IsBoolean,
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
} from 'class-validator';
import { NoUnsafeHtml } from '../../common/validators/no-unsafe-html.validator';

export class RestockIngredientDto {
  @IsNumber()
  @Min(0.1, { message: 'Số lượng nhập thêm phải lớn hơn 0' })
  @Max(100000000, { message: 'Số lượng nhập thêm không vượt quá 100.000.000' })
  addAmount!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000000000, { message: 'Đơn giá không vượt quá 1.000.000.000' })
  unitCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000000000, { message: 'Tổng tiền không vượt quá 10.000.000.000' })
  totalCost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @NoUnsafeHtml()
  note?: string;
}

export class UpdateIngredientStockDto {
  @IsNumber()
  @Min(0, { message: 'Tồn kho không được âm' })
  @Max(100000000, { message: 'Tồn kho không vượt quá 100.000.000' })
  stock!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000000, { message: 'Ngưỡng cảnh báo không vượt quá 100.000.000' })
  minThreshold?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000000000, { message: 'Đơn giá không vượt quá 1.000.000.000' })
  costPerUnit?: number;

  @IsOptional()
  @IsString()
  @IsIn(['INGREDIENT', 'PACKAGING'], {
    message: 'Loại nguyên vật liệu phải là INGREDIENT hoặc PACKAGING',
  })
  type?: string;

  @IsOptional()
  @IsBoolean()
  isRequiredForSale?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @NoUnsafeHtml()
  note?: string;
}

export class CreateIngredientDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã nguyên vật liệu không được để trống' })
  @Matches(/\S/, { message: 'Mã nguyên vật liệu không được chứa toàn khoảng trắng' })
  @MaxLength(50)
  @NoUnsafeHtml()
  code!: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên nguyên vật liệu không được để trống' })
  @Matches(/\S/, { message: 'Tên nguyên vật liệu không được chứa toàn khoảng trắng' })
  @MaxLength(150)
  @NoUnsafeHtml()
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Đơn vị tính không được để trống' })
  @Matches(/\S/, { message: 'Đơn vị tính không được chứa toàn khoảng trắng' })
  @MaxLength(30)
  @NoUnsafeHtml()
  unit!: string;

  @IsNumber()
  @Min(0, { message: 'Tồn kho ban đầu không được âm' })
  @Max(100000000, { message: 'Tồn kho không vượt quá 100.000.000' })
  stock!: number;

  @IsNumber()
  @Min(0, { message: 'Ngưỡng cảnh báo không được âm' })
  @Max(100000000, { message: 'Ngưỡng cảnh báo không vượt quá 100.000.000' })
  minThreshold!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000000000, { message: 'Đơn giá không vượt quá 1.000.000.000' })
  costPerUnit?: number;

  @IsOptional()
  @IsString()
  @IsIn(['INGREDIENT', 'PACKAGING'], {
    message: 'Loại nguyên vật liệu phải là INGREDIENT hoặc PACKAGING',
  })
  type?: string;

  @IsOptional()
  @IsBoolean()
  isRequiredForSale?: boolean;
}

export class UpdateIngredientDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'Mã nguyên vật liệu không được chứa toàn khoảng trắng' })
  @MaxLength(50)
  @NoUnsafeHtml()
  code?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'Tên nguyên vật liệu không được chứa toàn khoảng trắng' })
  @MaxLength(150)
  @NoUnsafeHtml()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'Đơn vị tính không được chứa toàn khoảng trắng' })
  @MaxLength(30)
  @NoUnsafeHtml()
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000000, { message: 'Tồn kho không vượt quá 100.000.000' })
  stock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000000, { message: 'Ngưỡng cảnh báo không vượt quá 100.000.000' })
  minThreshold?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000000000, { message: 'Đơn giá không vượt quá 1.000.000.000' })
  costPerUnit?: number;

  @IsOptional()
  @IsString()
  @IsIn(['INGREDIENT', 'PACKAGING'], {
    message: 'Loại nguyên vật liệu phải là INGREDIENT hoặc PACKAGING',
  })
  type?: string;

  @IsOptional()
  @IsBoolean()
  isRequiredForSale?: boolean;
}

export class UpsertRecipeDto {
  @IsInt()
  @Min(1)
  @Max(2147483647)
  productId!: number;

  @IsInt()
  @Min(1)
  @Max(2147483647)
  ingredientId!: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(['S', 'M', 'L', 'ALL'], {
    message: 'Size công thức chỉ được là S, M, L hoặc ALL',
  })
  size!: string;

  @IsNumber()
  @Min(0.01, { message: 'Định lượng tiêu hao phải lớn hơn 0' })
  @Max(1000000, { message: 'Định lượng tiêu hao không hợp lệ' })
  amount!: number;
}

export class UpdateRecipeDto {
  @IsOptional()
  @IsString()
  @IsIn(['S', 'M', 'L', 'ALL'], {
    message: 'Size công thức chỉ được là S, M, L hoặc ALL',
  })
  size?: string;

  @IsNumber()
  @Min(0.01, { message: 'Định lượng tiêu hao phải lớn hơn 0' })
  @Max(1000000, { message: 'Định lượng tiêu hao không hợp lệ' })
  amount!: number;
}

export class CreateToppingRecipeDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'Mã topping không được chứa toàn khoảng trắng' })
  @MaxLength(50)
  @NoUnsafeHtml()
  toppingId!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'Tên topping không được chứa toàn khoảng trắng' })
  @MaxLength(100)
  @NoUnsafeHtml()
  toppingName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @NoUnsafeHtml()
  subtext?: string;

  @IsInt({ message: 'Giá topping phải là số nguyên (VND)' })
  @Min(0)
  @Max(100000000)
  price!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsInt()
  @Min(1)
  @Max(2147483647)
  ingredientId!: number;

  @IsNumber()
  @Min(0.01)
  @Max(1000000)
  amount!: number;
}

export class UpdateToppingRecipeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'Tên topping không được chứa toàn khoảng trắng' })
  @MaxLength(100)
  @NoUnsafeHtml()
  toppingName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @NoUnsafeHtml()
  subtext?: string;

  @IsOptional()
  @IsInt({ message: 'Giá topping phải là số nguyên (VND)' })
  @Min(0)
  @Max(100000000)
  price?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(1000000)
  amount?: number;
}

export class UpdateSizePricingDto {
  @IsInt()
  @Min(0)
  @Max(100000000)
  sizeS!: number;

  @IsInt()
  @Min(0)
  @Max(100000000)
  sizeM!: number;

  @IsInt()
  @Min(0)
  @Max(100000000)
  sizeL!: number;
}

export class CreateVoucherDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'Mã giảm giá không được chứa toàn khoảng trắng' })
  @MaxLength(50)
  @NoUnsafeHtml()
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  @NoUnsafeHtml()
  description?: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  discountPercent!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000000)
  minOrderAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000000)
  maxDiscountAmount?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateVoucherDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'Mã giảm giá không được chứa toàn khoảng trắng' })
  @MaxLength(50)
  @NoUnsafeHtml()
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  @NoUnsafeHtml()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  discountPercent?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000000)
  minOrderAmount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000000)
  maxDiscountAmount?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
