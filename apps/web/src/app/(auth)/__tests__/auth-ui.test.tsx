import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import LoginPage from '../login/page';
import RegisterPage from '../register/page';
import AuthLoginPage from '../../auth/login/page';
import AuthRegisterPage from '../../auth/register/page';
import AuthLayout from '../layout';
import AuthPrefixLayout from '../../auth/layout';
import { AUTH_STORAGE_KEY, useAuthStore } from '../../../stores/auth-store';
import { getAuthToken } from '../../../lib/api-client';

const mockPush = vi.fn();
let mockSearchParams: Record<string, string> = {};
let mockPathname = '/login';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams[key] ?? null,
  }),
  usePathname: () => mockPathname,
}));

describe('Task T5.1b-UI — Mobile Login & Register UI Integration Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
    mockSearchParams = {};
    mockPathname = '/login';
    window.localStorage.clear();
    useAuthStore.getState().logout();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  describe('1. Login UI (/login)', () => {
    it('renders responsive mobile layout with inputs and submit button having minHeight >= 44px', () => {
      render(<LoginPage />);

      expect(screen.getByRole('heading', { name: /Đăng nhập BrewLite/i })).toBeTruthy();
      const emailInput = screen.getByLabelText(/Email đăng nhập/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/Mật khẩu/i) as HTMLInputElement;
      const submitBtn = screen.getByRole('button', { name: /Đăng nhập vào BrewLite/i }) as HTMLButtonElement;

      expect(emailInput).toBeTruthy();
      expect(emailInput.type).toBe('email');
      expect(passwordInput).toBeTruthy();
      expect(passwordInput.type).toBe('password');
      expect(submitBtn).toBeTruthy();

      // Mobile accessibility check: Button minHeight >= 44px
      expect(submitBtn.style.minHeight).toBe('48px');
      expect(emailInput.style.minHeight).toBe('48px');
    });

    it('displays error when email format is invalid', async () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/Email đăng nhập/i);
      const passwordInput = screen.getByLabelText(/Mật khẩu/i);
      const submitBtn = screen.getByRole('button', { name: /Đăng nhập vào BrewLite/i });

      fireEvent.change(emailInput, { target: { value: 'invalid-email-format' } });
      fireEvent.change(passwordInput, { target: { value: '123456' } });
      fireEvent.click(submitBtn);

      const alert = await screen.findByRole('alert');
      expect(alert.textContent).toContain('Email không đúng định dạng');
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('displays error when password is less than 6 characters', async () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/Email đăng nhập/i);
      const passwordInput = screen.getByLabelText(/Mật khẩu/i);
      const submitBtn = screen.getByRole('button', { name: /Đăng nhập vào BrewLite/i });

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.click(submitBtn);

      const alert = await screen.findByRole('alert');
      expect(alert.textContent).toContain('Mật khẩu phải có ít nhất 6 ký tự');
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('shows API error message when login fails with 401', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ statusCode: 401, message: 'Sai email hoặc mật khẩu.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      vi.stubGlobal('fetch', fetchMock);

      render(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/Email đăng nhập/i), { target: { value: 'user@example.com' } });
      fireEvent.change(screen.getByLabelText(/Mật khẩu/i), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /Đăng nhập vào BrewLite/i }));

      const alert = await screen.findByRole('alert');
      expect(alert.textContent).toBe('Sai email hoặc mật khẩu.');
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('authenticates user and redirects to specified redirect query param (?redirect=/checkout)', async () => {
      mockSearchParams = { redirect: '/checkout' };

      const fetchMock = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            accessToken: 'jwt_mock_token_customer',
            user: { id: 10, email: 'user@example.com', fullName: 'Huỳnh Tuấn Kiệt' },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );
      vi.stubGlobal('fetch', fetchMock);

      render(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/Email đăng nhập/i), { target: { value: 'user@example.com' } });
      fireEvent.change(screen.getByLabelText(/Mật khẩu/i), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /Đăng nhập vào BrewLite/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/checkout');
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().token).toBe('jwt_mock_token_customer');
      expect(useAuthStore.getState().user?.fullName).toBe('Huỳnh Tuấn Kiệt');
    });
  });

  describe('2. Register UI (/register)', () => {
    it('renders responsive mobile layout with full inputs and submit button having minHeight >= 44px', () => {
      render(<RegisterPage />);

      expect(screen.getByRole('heading', { name: /Tạo tài khoản BrewLite/i })).toBeTruthy();
      expect(screen.getByLabelText(/Họ và tên/i)).toBeTruthy();
      expect(screen.getByLabelText(/Số điện thoại/i)).toBeTruthy();
      expect(screen.getByLabelText(/Email tài khoản/i)).toBeTruthy();
      expect(screen.getByLabelText(/^Mật khẩu/i)).toBeTruthy();
      expect(screen.getByLabelText(/Xác nhận lại mật khẩu/i)).toBeTruthy();
      expect(screen.getByLabelText(/Tôi đồng ý với điều khoản/i)).toBeTruthy();

      const submitBtn = screen.getByRole('button', { name: /Đăng ký tài khoản ngay/i }) as HTMLButtonElement;
      expect(submitBtn).toBeTruthy();
      expect(submitBtn.style.minHeight).toBe('48px');
    });

    it('validates required full name', async () => {
      render(<RegisterPage />);

      fireEvent.change(screen.getByLabelText(/Họ và tên/i), { target: { value: '   ' } });
      fireEvent.change(screen.getByLabelText(/Email tài khoản/i), { target: { value: 'kiet@example.com' } });
      fireEvent.change(screen.getByLabelText(/^Mật khẩu/i), { target: { value: 'secret123' } });
      fireEvent.change(screen.getByLabelText(/Xác nhận lại mật khẩu/i), { target: { value: 'secret123' } });
      fireEvent.click(screen.getByRole('button', { name: /Đăng ký tài khoản ngay/i }));

      const alert = await screen.findByRole('alert');
      expect(alert.textContent).toContain('Họ và tên không được để trống');
    });

    it('validates password confirmation match', async () => {
      render(<RegisterPage />);

      fireEvent.change(screen.getByLabelText(/Họ và tên/i), { target: { value: 'Huỳnh Tuấn Kiệt' } });
      fireEvent.change(screen.getByLabelText(/Email tài khoản/i), { target: { value: 'kiet@example.com' } });
      fireEvent.change(screen.getByLabelText(/^Mật khẩu/i), { target: { value: 'secret123' } });
      fireEvent.change(screen.getByLabelText(/Xác nhận lại mật khẩu/i), { target: { value: 'differentPassword' } });
      fireEvent.click(screen.getByRole('button', { name: /Đăng ký tài khoản ngay/i }));

      const alert = await screen.findByRole('alert');
      expect(alert.textContent).toContain('Mật khẩu xác nhận không trùng khớp');
    });

    it('validates agreement to terms of service checkbox', async () => {
      render(<RegisterPage />);

      fireEvent.change(screen.getByLabelText(/Họ và tên/i), { target: { value: 'Huỳnh Tuấn Kiệt' } });
      fireEvent.change(screen.getByLabelText(/Email tài khoản/i), { target: { value: 'kiet@example.com' } });
      fireEvent.change(screen.getByLabelText(/^Mật khẩu/i), { target: { value: 'secret123' } });
      fireEvent.change(screen.getByLabelText(/Xác nhận lại mật khẩu/i), { target: { value: 'secret123' } });

      // Uncheck terms checkbox
      const termsCheckbox = screen.getByLabelText(/Tôi đồng ý với điều khoản dịch vụ/i);
      fireEvent.click(termsCheckbox);

      fireEvent.click(screen.getByRole('button', { name: /Đăng ký tài khoản ngay/i }));

      const alert = await screen.findByRole('alert');
      expect(alert.textContent).toContain('Vui lòng đồng ý với điều khoản dịch vụ');
    });

    it('successfully registers, saves session, and redirects to target page', async () => {
      mockSearchParams = { redirect: '/menu' };

      const fetchMock = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            accessToken: 'registered_jwt_token',
            user: { id: 11, email: 'newbie@brewlite.vn', fullName: 'Huỳnh Tuấn Kiệt', phone: '0901234567' },
          }),
          {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );
      vi.stubGlobal('fetch', fetchMock);

      render(<RegisterPage />);

      fireEvent.change(screen.getByLabelText(/Họ và tên/i), { target: { value: 'Huỳnh Tuấn Kiệt' } });
      fireEvent.change(screen.getByLabelText(/Số điện thoại/i), { target: { value: '0901234567' } });
      fireEvent.change(screen.getByLabelText(/Email tài khoản/i), { target: { value: 'newbie@brewlite.vn' } });
      fireEvent.change(screen.getByLabelText(/^Mật khẩu/i), { target: { value: 'pass123456' } });
      fireEvent.change(screen.getByLabelText(/Xác nhận lại mật khẩu/i), { target: { value: 'pass123456' } });
      fireEvent.click(screen.getByRole('button', { name: /Đăng ký tài khoản ngay/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/menu');
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().token).toBe('registered_jwt_token');
      expect(useAuthStore.getState().user?.email).toBe('newbie@brewlite.vn');
    });
  });

  describe('3. Unified Auth Storage, /auth/* Routes & Playwright data-testids', () => {
    it('syncs login() and logout() across Zustand store and AUTH_STORAGE_KEY without fake 120 fallback in refreshProfile()', async () => {
      const store = useAuthStore.getState();
      store.login('unified-jwt-token', {
        id: 77,
        email: 'unified@brewlite.vn',
        fullName: 'Unified Customer',
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(getAuthToken()).toBe('unified-jwt-token');
      const storedRaw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      expect(storedRaw).toBeTruthy();
      expect(JSON.parse(storedRaw as string)?.state?.token).toBe('unified-jwt-token');

      // refreshProfile fetches /auth/me with Bearer token and updates user + vouchers
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: 77,
            email: 'unified@brewlite.vn',
            loyaltyPoints: 45,
            vouchers: [
              {
                code: 'BREW10',
                discountPercent: 10,
                maxDiscountAmount: 15000,
                minOrderAmount: 0,
                quantity: 2,
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
      vi.stubGlobal('fetch', fetchMock);

      await useAuthStore.getState().refreshProfile();
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/auth/me'),
        expect.objectContaining({
          headers: { Authorization: 'Bearer unified-jwt-token' },
        }),
      );
      expect(useAuthStore.getState().user?.loyaltyPoints).toBe(45);
      expect(useAuthStore.getState().user?.vouchers).toHaveLength(1);

      // logout clears both Zustand and localStorage; refreshProfile when unauthenticated does not fabricate 120 points
      useAuthStore.getState().logout();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(getAuthToken()).toBeNull();
      expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();

      useAuthStore.setState({ user: { id: 1, email: 'anon@brewlite.vn' }, token: null, accessToken: null, isAuthenticated: false });
      await useAuthStore.getState().refreshProfile();
      expect(useAuthStore.getState().user?.loyaltyPoints).toBeUndefined();
    });

    it('renders /auth/login and /auth/register with exact data-testids and allows Playwright register without confirmPassword', async () => {
      mockPathname = '/auth/register';
      mockSearchParams = { redirect: '/checkout' };

      const fetchMock = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            accessToken: 'pw_jwt_token',
            user: { id: 88, email: 'pw@brewlite.vn', fullName: 'Playwright User' },
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        ),
      );
      vi.stubGlobal('fetch', fetchMock);

      render(
        <AuthPrefixLayout>
          <AuthRegisterPage />
        </AuthPrefixLayout>,
      );

      const switchRegister = screen.getByTestId('auth-switch-register') as HTMLAnchorElement;
      expect(switchRegister.getAttribute('href')).toBe('/auth/register?redirect=%2Fcheckout');

      fireEvent.change(screen.getByTestId('auth-name'), { target: { value: 'Playwright User' } });
      fireEvent.change(screen.getByTestId('auth-email'), { target: { value: 'pw@brewlite.vn' } });
      fireEvent.change(screen.getByTestId('auth-password'), { target: { value: 'secret123' } });
      fireEvent.click(screen.getByTestId('auth-submit'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/checkout');
      });
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(getAuthToken()).toBe('pw_jwt_token');

      cleanup();
      mockPush.mockReset();
      mockPathname = '/auth/login';

      const loginFetchMock = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            accessToken: 'pw_login_token',
            user: { id: 88, email: 'pw@brewlite.vn', fullName: 'Playwright User' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
      vi.stubGlobal('fetch', loginFetchMock);

      render(
        <AuthLayout>
          <AuthLoginPage />
        </AuthLayout>,
      );

      expect((screen.getByTestId('auth-switch-register') as HTMLAnchorElement).getAttribute('href')).toBe(
        '/auth/register?redirect=%2Fcheckout',
      );
      fireEvent.change(screen.getByTestId('auth-email'), { target: { value: 'pw@brewlite.vn' } });
      fireEvent.change(screen.getByTestId('auth-password'), { target: { value: 'secret123' } });
      fireEvent.click(screen.getByTestId('auth-submit'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/checkout');
      });
    });

    it('keeps /login and /register switcher links when pathname does not start with /auth/', () => {
      mockPathname = '/login';
      mockSearchParams = { redirect: '/orders' };
      render(
        <AuthLayout>
          <LoginPage />
        </AuthLayout>,
      );

      expect((screen.getByTestId('auth-switch-register') as HTMLAnchorElement).getAttribute('href')).toBe(
        '/register?redirect=%2Forders',
      );
    });
  });
});

