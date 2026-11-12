import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PromotionsPage from '../page';
import { useCartStore } from '../../../stores/cart-store';
import { useAuthStore } from '../../../stores/auth-store';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}));

describe('Task T5.1f — Mobile Promotions & Loyalty Points Page (/promotions)', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
    useCartStore.getState().setAppliedPromo(null);
    useAuthStore.setState({
      isAuthenticated: true,
      token: 'fake-token',
      user: {
        id: 1,
        email: 'khachhang@brewlite.vn',
        fullName: 'Huỳnh Tuấn Kiệt',
        loyaltyPoints: 120,
      },
    });
    window.localStorage.clear();
    mockPush.mockClear();
    vi.clearAllMocks();

    const fetchMock = vi.fn().mockImplementation((url: string, init?: any) => {
      const urlStr = typeof url === 'string' ? url : (url as any).url || '';
      if (urlStr.includes('/auth/vouchers')) {
        return Promise.resolve(
          new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }
      if (urlStr.includes('/auth/redeem-points')) {
        const body = init?.body ? JSON.parse(init.body) : {};
        const cost = body.points || 10;
        const current = useAuthStore.getState().user?.loyaltyPoints || 120;
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              message: 'Đổi điểm thành công',
              remainingPoints: current - cost,
              voucher: { code: body.voucherCode },
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
  });

  it('renders mobile layout with header, member VIP card, and points pill', async () => {
    render(<PromotionsPage />);

    expect(await screen.findByText(/Kho Ưu Đãi & Hạt Vàng/i)).toBeTruthy();
    expect(screen.getByText(/Gold Tier/i)).toBeTruthy();
    expect(screen.getAllByText('Huỳnh Tuấn Kiệt').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/120 Hạt/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Mã tích điểm: BL-8899-GOLD/i)).toBeTruthy();
  });

  it('renders the 5-item mobile bottom navigation bar with Ưu đãi as active', async () => {
    render(<PromotionsPage />);

    expect(await screen.findByText('Thực đơn')).toBeTruthy();
    expect(screen.getByText('Giỏ hàng')).toBeTruthy();
    expect(screen.getByText('Đơn hàng')).toBeTruthy();
    expect(screen.getByText('Ưu đãi')).toBeTruthy();
    expect(screen.getByText('Tài khoản')).toBeTruthy();
  });

  it('skips applying voucher when cart is empty and alerts user', async () => {
    render(<PromotionsPage />);

    // Cart is currently empty (0 items)
    expect(useCartStore.getState().items).toHaveLength(0);

    const applyBtn = await screen.findByRole('button', { name: /Áp dụng mã BREWCOZY/i });
    fireEvent.click(applyBtn);

    // Voucher is NOT applied and does NOT redirect
    expect(useCartStore.getState().appliedPromo).toBeNull();
    expect(mockPush).not.toHaveBeenCalled();
    expect(await screen.findByText(/Giỏ hàng đang trống! Vui lòng chọn món trước khi áp dụng mã/i)).toBeTruthy();
  });

  it('applies voucher and redirects to /cart when cart has items', async () => {
    // Add item to cart first
    useCartStore.getState().addItem({
      productId: 'p-cafe-muoi',
      name: 'Cà phê Muối',
      size: 'M',
      unitPrice: 42000,
      quantity: 1,
    });

    render(<PromotionsPage />);

    const applyBtn = await screen.findByRole('button', { name: /Áp dụng mã BREWCOZY/i });
    fireEvent.click(applyBtn);

    // Cart store receives applied promo and redirects to /cart
    expect(useCartStore.getState().appliedPromo).toBe('BREWCOZY');
    expect(mockPush).toHaveBeenCalledWith('/cart');
  });

  it('allows removing an applied voucher', async () => {
    useCartStore.getState().setAppliedPromo('BREW10');
    render(<PromotionsPage />);

    const removeBtn = await screen.findByRole('button', { name: /Gỡ mã/i });
    expect(removeBtn).toBeTruthy();

    fireEvent.click(removeBtn);
    expect(useCartStore.getState().appliedPromo).toBeNull();
  });

  it('applies manual promo code and redirects to /cart when cart has items', async () => {
    useCartStore.getState().addItem({
      productId: 'p-cafe-sua',
      name: 'Cà phê Sữa',
      size: 'M',
      unitPrice: 35000,
      quantity: 1,
    });

    render(<PromotionsPage />);

    const input = await screen.findByPlaceholderText(/VD: BREW10, BREWCOZY/i);
    fireEvent.change(input, { target: { value: 'BREW20' } });

    const submitBtn = screen.getByRole('button', { name: /Áp dụng mã nhập/i });
    fireEvent.click(submitBtn);

    expect(useCartStore.getState().appliedPromo).toBe('BREW20');
    expect(mockPush).toHaveBeenCalledWith('/cart');
  });

  it('switches to "Đổi bằng Hạt Vàng" tab and redeems reward with points', async () => {
    render(<PromotionsPage />);

    const redeemTabBtn = await screen.findByRole('button', { name: /Đổi bằng Hạt Vàng/i });
    fireEvent.click(redeemTabBtn);

    expect(await screen.findByText(/1.000₫ thanh toán = 1 Hạt Vàng/i)).toBeTruthy();
    expect(screen.getByText(/Voucher Giảm 10% Toàn Đơn/i)).toBeTruthy();

    // Redeem BREW10 (costs 10 points)
    const redeemBrew10Btn = screen.getByRole('button', { name: /Đổi \(-10đ\)/i });
    fireEvent.click(redeemBrew10Btn);

    expect(await screen.findByText(/Đã đổi mã "BREW10" \(-10 Hạt Vàng\)!/i)).toBeTruthy();
    // Points deducted: 120 - 10 = 110
    expect(useAuthStore.getState().user?.loyaltyPoints).toBe(110);
  });

  it('shows error toast when attempting to redeem an item without enough points', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 1,
        email: 'khachhang@brewlite.vn',
        fullName: 'Huỳnh Tuấn Kiệt',
        loyaltyPoints: 0, // Not enough for anything
      },
    });

    render(<PromotionsPage />);

    const redeemTabBtn = await screen.findByRole('button', { name: /Đổi bằng Hạt Vàng/i });
    fireEvent.click(redeemTabBtn);

    // Button should be disabled with missing points text
    expect((await screen.findAllByText(/Thiếu 20đ/i)).length).toBeGreaterThanOrEqual(1);
  });
});
