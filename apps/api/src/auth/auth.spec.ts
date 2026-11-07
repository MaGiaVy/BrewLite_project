import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ExecutionContext,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from '../prisma/prisma.service';

const TEST_SECRET = 'brewlite_secret_key';

describe('Task T5.1b — Auth Vertical Slice (API-T10..API-T13)', () => {
  let authService: AuthService;
  let authController: AuthController;
  let jwtService: JwtService;
  let jwtAuthGuard: JwtAuthGuard;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    process.env.JWT_SECRET = TEST_SECRET;

    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: TEST_SECRET,
          signOptions: { expiresIn: '7d' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        JwtStrategy,
        JwtAuthGuard,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    authController = module.get<AuthController>(AuthController);
    jwtService = module.get<JwtService>(JwtService);
    jwtAuthGuard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  // ─── API-T10: Token hết hạn -> 401 Unauthorized ──────────────────────────────
  describe('API-T10: Expired or invalid JWT token -> 401 Unauthorized', () => {
    it('[API-T10] rejects an expired JWT token (expiresIn: -1) with 401 Unauthorized', async () => {
      const expiredToken = jwtService.sign(
        { sub: 1, email: 'vy@brewlite.vn', role: Role.CUSTOMER },
        { secret: TEST_SECRET, expiresIn: -1 },
      );

      expect(() =>
        jwtService.verify(expiredToken, { secret: TEST_SECRET }),
      ).toThrow(/jwt expired/i);

      const mockReq = {
        headers: {
          authorization: `Bearer ${expiredToken}`,
        },
      };
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockReq,
          getResponse: () => ({}),
          getNext: () => jest.fn(),
        }),
        getHandler: () => authController.getProfile,
        getClass: () => AuthController,
      } as unknown as ExecutionContext;

      await expect(jwtAuthGuard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );

      try {
        await jwtAuthGuard.canActivate(mockContext);
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(UnauthorizedException);
        expect((err as HttpException).getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      }
    });

    it('[API-T10] rejects missing Bearer token on protected route with 401 Unauthorized', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({ headers: {} }),
          getResponse: () => ({}),
          getNext: () => jest.fn(),
        }),
        getHandler: () => authController.getProfile,
        getClass: () => AuthController,
      } as unknown as ExecutionContext;

      await expect(jwtAuthGuard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ─── API-T11: Đăng ký email trùng -> 409 Conflict ───────────────────────────
  describe('API-T11: Register with duplicate email -> 409 Conflict', () => {
    it('[API-T11] throws 409 ConflictException when registering an existing email', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: '3124410414@sv.sgu.edu.vn',
        passwordHash: 'hashed_pw',
        fullName: 'Mã Gia Vỹ',
        phone: '0901234567',
        role: Role.CUSTOMER,
        loyaltyPoints: 0,
        createdAt: new Date(),
      });

      const dto: RegisterDto = {
        email: '3124410414@sv.sgu.edu.vn',
        password: 'Password123',
        fullName: 'Mã Gia Vỹ',
        phone: '0901234567',
      };

      await expect(authService.register(dto)).rejects.toThrow(
        ConflictException,
      );

      try {
        await authService.register(dto);
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ConflictException);
        expect((err as HttpException).getStatus()).toBe(HttpStatus.CONFLICT);
      }
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  // ─── API-T12: Mật khẩu < 6 ký tự -> 400 Bad Request ─────────────────────────
  describe('API-T12: Password shorter than 6 characters -> 400 Bad Request', () => {
    it('[API-T12] rejects password with length < 6 via ValidationPipe and AuthService with 400 BadRequestException', async () => {
      const pipe = new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      });

      const shortPwPayload: RegisterDto = {
        email: 'newuser@brewlite.vn',
        password: '123',
        fullName: 'Khách Hàng Mới',
      };

      await expect(
        pipe.transform(shortPwPayload, {
          type: 'body',
          metatype: RegisterDto,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(authService.register(shortPwPayload)).rejects.toThrow(
        BadRequestException,
      );

      try {
        await authService.register(shortPwPayload);
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(BadRequestException);
        expect((err as HttpException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
      }
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  // ─── API-T13: Đăng nhập sai mật khẩu -> 401 & không lộ passwordHash ─────────
  describe('API-T13: Login wrong password -> 401 & never expose passwordHash', () => {
    it('[API-T13] throws 401 UnauthorizedException on wrong password', async () => {
      const realHash = await bcrypt.hash('CorrectPass123', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 2,
        email: 'vy@brewlite.vn',
        passwordHash: realHash,
        fullName: 'Mã Gia Vỹ',
        phone: '0909000111',
        role: Role.CUSTOMER,
        isActive: true,
        loyaltyPoints: 20,
        createdAt: new Date(),
      });

      await expect(
        authService.login({
          email: 'vy@brewlite.vn',
          password: 'WrongPassword999',
        }),
      ).rejects.toThrow(UnauthorizedException);

      try {
        await authService.login({
          email: 'vy@brewlite.vn',
          password: 'WrongPassword999',
        });
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(UnauthorizedException);
        expect((err as HttpException).getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      }
    });

    it('[API-T13] hashes password with bcrypt (10 rounds), issues 7d JWT, and never returns passwordHash on register/login', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);
      const hashed = await bcrypt.hash('Secret123', 10);

      prisma.user.create.mockResolvedValue({
        id: 10,
        email: 'customer@brewlite.vn',
        passwordHash: hashed,
        fullName: 'Khách Hàng Chuẩn',
        phone: '0912345678',
        role: Role.CUSTOMER,
        isActive: true,
        loyaltyPoints: 0,
        createdAt: new Date(),
      });

      const regResult = await authController.register({
        email: 'customer@brewlite.vn',
        password: 'Secret123',
        fullName: 'Khách Hàng Chuẩn',
        phone: '0912345678',
      });

      expect(regResult.accessToken).toBeDefined();
      expect(regResult.user).not.toHaveProperty('passwordHash');
      expect(
        (regResult.user as Record<string, unknown>).passwordHash,
      ).toBeUndefined();

      const decoded = jwtService.decode(regResult.accessToken) as {
        sub: number;
        email: string;
        iat: number;
        exp: number;
      };
      expect(decoded.sub).toBe(10);
      expect(decoded.exp - decoded.iat).toBe(7 * 24 * 60 * 60);

      prisma.user.findUnique.mockResolvedValueOnce({
        id: 10,
        email: 'customer@brewlite.vn',
        passwordHash: hashed,
        fullName: 'Khách Hàng Chuẩn',
        phone: '0912345678',
        role: Role.CUSTOMER,
        isActive: true,
        loyaltyPoints: 0,
        createdAt: new Date(),
      });

      const loginResult = await authController.login({
        email: 'customer@brewlite.vn',
        password: 'Secret123',
      });

      expect(loginResult.accessToken).toBeDefined();
      expect(loginResult.user).not.toHaveProperty('passwordHash');
      expect(
        (loginResult.user as Record<string, unknown>).passwordHash,
      ).toBeUndefined();
    });
  });
});
