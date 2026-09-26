import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { User } from './entities/user.entity.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Đăng ký tài khoản người dùng mới
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // 1. Kiểm tra xác nhận mật khẩu
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Mật khẩu xác nhận không khớp',
        error: 'BAD_REQUEST',
        details: {
          confirmPassword: 'Passwords do not match',
        },
      });
    }

    // 2. Kiểm tra email đã tồn tại hay chưa
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException({
        statusCode: 409,
        message: 'Email đã tồn tại',
        error: 'CONFLICT',
      });
    }

    // 3. Mã hóa mật khẩu bằng bcrypt (10 rounds salt)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    // 4. Lưu thông tin user vào database
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
      },
    });

    // 5. Tạo JWT token
    const accessToken = this.generateJwtToken(user);

    // 6. Trả về kết quả (tuyệt đối không kèm password / passwordHash)
    return {
      id: user.id,
      email: user.email,
      accessToken,
    };
  }

  /**
   * Xác thực thông tin đăng nhập của người dùng
   */
  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Email hoặc mật khẩu không chính xác',
        error: 'UNAUTHORIZED',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Email hoặc mật khẩu không chính xác',
        error: 'UNAUTHORIZED',
      });
    }

    return user;
  }

  /**
   * Đăng nhập và tạo JWT token
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(dto.email, dto.password);
    const accessToken = this.generateJwtToken(user);

    return {
      id: user.id,
      email: user.email,
      accessToken,
    };
  }

  /**
   * Sinh JWT token với payload chuẩn { sub: userId, email }
   */
  generateJwtToken(user: { id: string; email: string }): string {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload);
  }
}
