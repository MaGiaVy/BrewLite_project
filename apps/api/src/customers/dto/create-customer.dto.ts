import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NoUnsafeHtml } from '../../common/validators/no-unsafe-html.validator';

export class CreateCustomerDto {
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Vui lòng nhập email' })
  @MaxLength(255)
  email!: string;

  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Vui lòng nhập họ và tên' })
  @MaxLength(100)
  @NoUnsafeHtml()
  fullName!: string;

  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @IsOptional()
  @MaxLength(30)
  @NoUnsafeHtml()
  phone?: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu (tối thiểu 6 ký tự)' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @MaxLength(128, { message: 'Mật khẩu không được vượt quá 128 ký tự' })
  password!: string;
}
