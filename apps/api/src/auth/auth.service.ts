import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { JwtPayload } from './jwt.strategy';

const SALT_ROUNDS = 10;

export interface SafeUserRecord {
  id: number;
  email: string;
  fullName: string | null;
  phone: string | null;
  role?: Role;
  isActive?: boolean;
  loyaltyPoints: number;
  createdAt: Date;
}

/** Dữ liệu user an toàn trả về client (ẩn passwordHash tuyệt đối) */
function safeUser(u: SafeUserRecord) {
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    phone: u.phone,
    role: u.role ?? Role.CUSTOMER,
    isActive: u.isActive !== false,
    loyaltyPoints: u.loyaltyPoints,
    createdAt: u.createdAt,
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    if (!dto.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email)) {
      throw new BadRequestException('Email không hợp lệ');
    }
    if (!dto.password || dto.password.length < 6) {
      throw new BadRequestException('Mật khẩu phải có ít nhất 6 ký tự');
    }
    if (!dto.fullName || !dto.fullName.trim()) {
      throw new BadRequestException('Họ và tên không được để trống');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException(
        'Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone ?? null,
        role: Role.CUSTOMER,
      },
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: safeUser(user),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Email hoặc mật khẩu không chính xác. Vui lòng thử lại.',
      );
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException(
        'Email hoặc mật khẩu không chính xác. Vui lòng thử lại.',
      );
    }

    if (user.isActive === false) {
      throw new UnauthorizedException(
        'Tài khoản này hiện đang bị tạm khóa. Vui lòng liên hệ Quản lý cửa hàng.',
      );
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: safeUser(user),
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }

    return safeUser(user);
  }
}
