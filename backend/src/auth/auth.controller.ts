import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ApiResponse, AuthResponseDto, UserProfileDto } from './dto/auth-response.dto.js';
import { JwtGuard } from './guards/jwt.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';

@Controller(['auth', 'api/v1/auth'])
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register hoặc /api/v1/auth/register
   * Đăng ký tài khoản mới (201 Created)
   */
  @Post('/register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto): Promise<ApiResponse<AuthResponseDto>> {
    const data = await this.authService.register(dto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'User registered successfully',
      data,
    };
  }

  /**
   * POST /auth/login hoặc /api/v1/auth/login
   * Đăng nhập hệ thống (200 OK)
   */
  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<ApiResponse<AuthResponseDto>> {
    const data = await this.authService.login(dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Login successful',
      data,
    };
  }

  /**
   * GET /auth/me hoặc /api/v1/auth/me
   * Lấy thông tin user hiện tại từ JWT Token (Protected, 200 OK)
   */
  @Get('/me')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  getMe(@CurrentUser() user: any): ApiResponse<UserProfileDto> {
    return {
      statusCode: HttpStatus.OK,
      message: 'User fetched successfully',
      data: {
        id: user.id,
        email: user.email,
        ...(user.loyaltyPoints !== undefined && { loyaltyPoints: user.loyaltyPoints }),
      },
    };
  }

  /**
   * POST /auth/logout hoặc /api/v1/auth/logout
   * Đăng xuất người dùng (200 OK)
   */
  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  logout(): ApiResponse<null> {
    return {
      statusCode: HttpStatus.OK,
      message: 'Logout successful',
      data: null,
    };
  }
}
