import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';
import { NoUnsafeHtml } from '../../common/validators/no-unsafe-html.validator';

export class CreateStaffDto {
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @MaxLength(128)
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập họ và tên' })
  @MaxLength(100)
  @NoUnsafeHtml()
  fullName!: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  @NoUnsafeHtml()
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  @NoUnsafeHtml()
  position?: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Vai trò người dùng không hợp lệ' })
  role?: Role;
}
