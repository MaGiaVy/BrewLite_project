/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AccountPage from '../page';
import { getInitials } from '../../../lib/format';
import { useAuthStore } from '../../../stores/auth-store';
import { useCartStore } from '../../../stores/cart-store';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

let mockVouchers = [
  {
    id: 1,
    code: 'BREWCOZY',
    discountPercent: 15,
    maxDiscountAmount: 25000,
    minOrderAmount: 0,
    quantity: 1,
  },
  {
    id: 2,
    code: 'BREW10',
    discountPercent: 10,
    maxDiscountAmount: 15000,
    minOrderAmount: 0,
    quantity: 4,
  },
  {
    id: 3,
    code: 'BREW20',
    discountPercent: 20,
    maxDiscountAmount: 25000,
    minOrderAmount: 60000,
    quantity: 1,
  },
];

describe('Task T5.1g — Mobile Account Page (/account)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }

    mockVouchers = [
      {
        id: 1,
        code: 'BREWCOZY',
        discountPercent: 15,
        maxDiscountAmount: 25000,
        minOrderAmount: 0,
        quantity: 1,
      },
      {
        id: 2,
        code: 'BREW10',
        discountPercent: 10,
        maxDiscountAmount: 15000,
        minOrderAmount: 0,
        quantity: 4,
      },
      {
        id: 3,
        code: 'BREW20',
        discountPercent: 20,
        maxDiscountAmount: 25000,
        minOrderAmount: 60000,
        quantity: 1,
      },
    ];

    const fetchMock = vi.fn().mockImplementation((url: string, init?: any) => {
      const urlStr = typeof url === 'string' ? url : (url as any)?.url || '';
      if (urlStr.includes('/auth/me')) {
        return Promise.resolve(
          new Response(JSON.stringify(useAuthStore.getState().user), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }
      if (urlStr.includes('/auth/vouchers')) {
        return Promise.resolve(
          new Response(JSON.stringify(mockVouchers), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }
      if (urlStr.includes('/auth/profile')) {
        const body = init?.body ? JSON.parse(init.body) : {};
        const current = useAuthStore.getState().user;
        const updatedUser = { ...current, ...body };
        useAuthStore.getState().setUser(updatedUser as any);
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              user: updatedUser,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    useAuthStore.setState({
      user: {
        id: 36,
        email: '3124410414@sv.sgu.edu.vn',
        fullName: 'Mã Gia Vỹ (Admin)',
        phone: '0901041400',
        role: 'ADMIN',
        loyaltyPoints: 350,
      },
      token: 'mock-token',
      accessToken: 'mock-token',
      isAuthenticated: true,
    });

    useCartStore.setState({
      items: [],
      appliedPromo: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getInitials helper', () => {
    it('correctly extracts Vietnamese initials without punctuation or (Admin) role tag', () => {
      expect(getInitials('Mã Gia Vỹ (Admin)')).toBe('MV');
      expect(getInitials('Huỳnh Tuấn Kiệt (VIP)')).toBe('HK');
      expect(getInitials('Nguyễn Văn A')).toBe('NA');
      expect(getInitials('Admin')).toBe('AD');
      expect(getInitials(null)).toBe('BL');
      expect(getInitials('')).toBe('BL');
    });
  });

  it('renders mobile layout with header, profile card, diamond tier, and bottom navigation bar', () => {
    render(<AccountPage />);

    // Header & Title
    expect(screen.getByRole('heading', { name: /Tài khoản của tôi/i })).toBeTruthy();
    expect(screen.getAllByText('Thực đơn').length).toBeGreaterThanOrEqual(1);

    // User Profile
    expect(screen.getByText('Mã Gia Vỹ (Admin)')).toBeTruthy();
    expect(screen.getAllByText(/Thành viên Kim Cương/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/3124410414@sv.sgu.edu.vn/i)).toBeTruthy();
    expect(screen.getByText(/0901041400/i)).toBeTruthy();

    // Initials: must be MV, never V(
    expect(screen.getByText('MV')).toBeTruthy();
    expect(screen.queryByText('V(')).toBeNull();

    // BrewLite Rewards
    expect(screen.getByText('BREWLITE REWARDS')).toBeTruthy();
    expect(screen.getByText(/#BL-0036/)).toBeTruthy();
    expect(screen.getByText('350')).toBeTruthy();
    expect(screen.getByText(/Điểm BrewLite \(Hạt Vàng\)/i)).toBeTruthy();

    // Barcode Pass removed per user request
    expect(screen.queryByText('BrewLite Loyalty Pass')).toBeNull();
    expect(screen.queryByText('9844 2049 8812')).toBeNull();

    // Bottom Navigation (Tài khoản item is active)
    expect(screen.getByText('Đơn hàng')).toBeTruthy();
    expect(screen.getByText('Ưu đãi')).toBeTruthy();
  });

  it('renders real vouchers with ticket stub format and validates empty cart before applying', async () => {
    render(<AccountPage />);

    expect(await screen.findByText('Ưu đãi của bạn')).toBeTruthy();
    expect(await screen.findByText('BREWCOZY')).toBeTruthy();
    expect(screen.getByText('BREW10')).toBeTruthy();
    expect(screen.getByText('BREW20')).toBeTruthy();

    // Click "Dùng ngay" when cart is empty
    const applyBtns = screen.getAllByRole('button', { name: /^Dùng ngay/i });
    expect(applyBtns.length).toBeGreaterThan(0);

    fireEvent.click(applyBtns[0]);

    expect(
      await screen.findByText('Giỏ hàng đang trống! Vui lòng chọn món trước khi áp dụng mã.'),
    ).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('applies voucher and navigates to /cart when cart has items', async () => {
    useCartStore.setState({
      items: [
        {
          lineId: 'test-item-1',
          productId: 1,
          name: 'Cà phê Muối',
          unitPrice: 35000,
          quantity: 2,
          size: 'M',
          toppingIds: [],
        },
      ],
      appliedPromo: null,
    });

    render(<AccountPage />);

    const applyFirstBtn = await screen.findByRole('button', { name: /Dùng ngay mã BREWCOZY/i });
    fireEvent.click(applyFirstBtn);

    expect(useCartStore.getState().appliedPromo).toBe('BREWCOZY');
    expect(mockPush).toHaveBeenCalledWith('/cart');
  });

  it('displays empty state notice and action button when user has no vouchers', async () => {
    mockVouchers = [];

    render(<AccountPage />);

    expect(await screen.findByText('Chưa có voucher khả dụng')).toBeTruthy();
    expect(
      screen.getByText(/Vui lòng đổi điểm Hạt Vàng để lấy voucher ưu đãi hấp dẫn!/i),
    ).toBeTruthy();

    const redeemBtn = screen.getByRole('button', { name: /Đổi voucher ngay/i });
    fireEvent.click(redeemBtn);

    expect(mockPush).toHaveBeenCalledWith('/promotions?tab=redeem');
  });

  it('refreshes loyalty points and displays success toast', async () => {
    render(<AccountPage />);

    const refreshBtn = screen.getByRole('button', { name: /Cập nhật số hạt hiện tại/i });
    fireEvent.click(refreshBtn);

    expect(
      await screen.findByText('Đã cập nhật số Hạt Vàng hiện tại thành công!'),
    ).toBeTruthy();
  });

  it('opens EditProfileModal when clicking Chỉnh sửa hồ sơ and updates state', async () => {
    render(<AccountPage />);

    const editBtn = screen.getByRole('button', { name: /Chỉnh sửa hồ sơ/i });
    fireEvent.click(editBtn);

    expect(screen.getByRole('dialog', { name: /Chỉnh sửa hồ sơ/i })).toBeTruthy();
    expect(screen.getByLabelText(/Họ và tên/i)).toBeTruthy();

    const nameInput = screen.getByLabelText(/Họ và tên/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Mã Gia Vỹ (Master)' } });

    const saveBtn = screen.getByRole('button', { name: /Lưu thay đổi/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(useAuthStore.getState().user?.fullName).toBe('Mã Gia Vỹ (Master)');
    });
  });

  it('logs out and redirects to login when clicking Đăng xuất tài khoản', () => {
    render(<AccountPage />);

    const logoutBtn = screen.getByRole('button', { name: /Đăng xuất tài khoản/i });
    fireEvent.click(logoutBtn);

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
