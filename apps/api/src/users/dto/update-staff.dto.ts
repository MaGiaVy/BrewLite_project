import {
  IsBoolean,
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

export class UpdateStaffDto {
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @MaxLength(128)
  @IsOptional()
  password?: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập họ và tên' })
  @IsOptional()
  @MaxLength(100)
  @NoUnsafeHtml()
  fullName?: string;

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

  @IsEnum(Role, { message: 'Vai trò không hợp lệ' })
  @IsOptional()
  role?: Role;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
