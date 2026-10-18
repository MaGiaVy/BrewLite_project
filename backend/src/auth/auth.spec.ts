import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';

describe('AuthService - Task 7 Test Suite (JWT & Xác thực)', () => {
  let prisma: PrismaClient;
  let authService: AuthService;
  let jwtService: JwtService;
  const testEmail = `test-user-${Date.now()}@brewlite.vn`;
  const testPassword = 'Password123!';

  beforeAll(async () => {
    prisma = new PrismaClient();
    jwtService = new JwtService({ secret: 'test-jwt-secret-key' });
    authService = new AuthService(prisma as any, jwtService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  it('register() đăng ký thành công, hash mật khẩu bcrypt và trả về accessToken', async () => {
    const res = await authService.register({
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
    });

    expect(res).toBeDefined();
    expect(res.id).toBeDefined();
    expect(res.email).toBe(testEmail);
    expect(res.accessToken).toBeDefined();

    // Xác nhận mật khẩu được lưu dưới dạng hash chứ không phải plain text
    const savedUser = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(savedUser?.passwordHash).toBeDefined();
    expect(savedUser?.passwordHash).not.toBe(testPassword);
  });

  it('register() với email đã tồn tại ném lỗi ConflictException 409', async () => {
    await expect(
      authService.register({
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
      })
    ).rejects.toThrow(/Email đã tồn tại/);
  });

  it('login() với đúng thông tin đăng nhập trả về accessToken hợp lệ', async () => {
    const res = await authService.login({
      email: testEmail,
      password: testPassword,
    });

    expect(res).toBeDefined();
    expect(res.accessToken).toBeDefined();
    expect(res.email).toBe(testEmail);
  });

  it('login() với sai mật khẩu ném UnauthorizedException 401', async () => {
    await expect(
      authService.login({
        email: testEmail,
        password: 'WrongPassword456',
      })
    ).rejects.toThrow(/Email hoặc mật khẩu không chính xác/);
  });
});
