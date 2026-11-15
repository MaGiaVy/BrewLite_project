import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NoUnsafeHtml } from '../../common/validators/no-unsafe-html.validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @MaxLength(128, { message: 'Mật khẩu không được vượt quá 128 ký tự' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  @MaxLength(100, { message: 'Họ và tên không được vượt quá 100 ký tự' })
  @NoUnsafeHtml()
  fullName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30, { message: 'Số điện thoại không được vượt quá 30 ký tự' })
  @NoUnsafeHtml()
  phone?: string;
}
