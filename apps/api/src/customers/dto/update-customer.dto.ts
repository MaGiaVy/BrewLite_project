import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NoUnsafeHtml } from '../../common/validators/no-unsafe-html.validator';

export class UpdateCustomerDto {
  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  @IsOptional()
  @MaxLength(100)
  @NoUnsafeHtml()
  fullName?: string;

  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @IsOptional()
  @MaxLength(30)
  @NoUnsafeHtml()
  phone?: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @IsOptional()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @MaxLength(128, { message: 'Mật khẩu không được vượt quá 128 ký tự' })
  password?: string;

  @IsBoolean({ message: 'Trạng thái hoạt động phải là boolean' })
  @IsOptional()
  isActive?: boolean;
}
