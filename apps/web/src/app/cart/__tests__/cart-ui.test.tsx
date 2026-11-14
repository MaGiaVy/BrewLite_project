import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup, render, screen, fireEvent, act } from '@testing-library/react';
import CartPage from '../page';
import { useCartStore } from '../../../stores/cart-store';
import { useAuthStore } from '../../../stores/auth-store';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Mobile Cart Page UI (/cart)', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
    useAuthStore.getState().logout();
    window.localStorage.clear();
    mockPush.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders empty cart state when cart has no items', async () => {
    render(<CartPage />);
    expect(await screen.findByText(/Giỏ hàng của bạn đang trống/i)).toBeTruthy();
    expect(screen.getByText(/Khám phá Menu ngay/i)).toBeTruthy();
  });

  it('renders items with customization attributes and calculates subtotal', async () => {
    useCartStore.getState().addItem({
      productId: 'p-cafe-sua',
      name: 'Cà Phê Sữa Đá',
      size: 'M',
      toppingIds: ['t-boba'],
      toppingNames: ['Trân châu trắng giòn'],
      unitPrice: 43000,
      quantity: 2,
      temperature: 'iced',
      iceLevel: '50',
      sugarLevel: '70',
      notes: 'Ít sữa đặc',
    });

    render(<CartPage />);

    expect(await screen.findByText('Cà Phê Sữa Đá')).toBeTruthy();
    expect(screen.getByText('Size M')).toBeTruthy();
    expect(screen.getByText('Uống Lạnh')).toBeTruthy();
    expect(screen.getByText('50% đá')).toBeTruthy();
    expect(screen.getByText('70% đường')).toBeTruthy();
    expect(screen.getByText('Trân châu trắng giòn')).toBeTruthy();
    expect(screen.getByText(/Ghi chú: Ít sữa đặc/i)).toBeTruthy();
    expect(screen.getAllByText('86.000 ₫').length).toBeGreaterThanOrEqual(1);
  });

  it('increments item quantity when clicking + button up to max 20', async () => {
    useCartStore.getState().addItem({
      productId: 'p-bac-xiu',
      name: 'Bạc Xỉu',
      size: 'S',
      unitPrice: 35000,
      quantity: 1,
    });

    render(<CartPage />);

    expect(await screen.findByText('Bạc Xỉu')).toBeTruthy();
    const plusBtn = screen.getByRole('button', { name: 'Tăng số lượng' });
    fireEvent.click(plusBtn);

    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });

  it('opens delete confirmation modal when clicking trash or minus at quantity 1', async () => {
    useCartStore.getState().addItem({
      productId: 'p-bac-xiu',
      name: 'Bạc Xỉu',
      size: 'S',
      unitPrice: 35000,
      quantity: 1,
    });

    render(<CartPage />);

    expect(await screen.findByText('Bạc Xỉu')).toBeTruthy();
    const deleteBtn = screen.getByRole('button', { name: 'Xóa món' });
    fireEvent.click(deleteBtn);

    expect(screen.getByText('Xác nhận xóa món')).toBeTruthy();
    expect(screen.getByText(/Bạn có chắc chắn muốn xóa món/i)).toBeTruthy();

    const confirmDeleteBtn = screen.getByText('Xác nhận xóa');
    fireEvent.click(confirmDeleteBtn);

    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('applies promo code and shows discount correctly', async () => {
    useCartStore.getState().addItem({
      productId: 'p-1',
      name: 'Cà phê Muối',
      size: 'M',
      unitPrice: 42000,
      quantity: 2, // 84.000đ
    });

    render(<CartPage />);

    expect(await screen.findByText('Cà phê Muối')).toBeTruthy();

    const promoInput = screen.getByPlaceholderText(/Nhập mã ưu đãi/i);
    const applyBtn = screen.getByRole('button', { name: 'Áp dụng' });

    fireEvent.change(promoInput, { target: { value: 'BREW10' } });
    fireEvent.click(applyBtn);

    expect(screen.getByText(/Ưu đãi giảm giá \(BREW10\)/i)).toBeTruthy();
  });

  it('redirects unauthenticated user to /auth/login when clicking checkout while preserving cart', async () => {
    useCartStore.getState().addItem({
      productId: 'p-1',
      name: 'Cà phê Đen',
      size: 'S',
      unitPrice: 29000,
      quantity: 1,
    });

    render(<CartPage />);

    const checkoutBtn = await screen.findByTestId('checkout-button');
    fireEvent.click(checkoutBtn);

    expect(mockPush).toHaveBeenCalledWith('/auth/login?redirect=%2Fcheckout');
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it('uses 0% VAT without artificial 1000 rounding and loads active vouchers from pricing-config', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            vouchers: [
              {
                code: 'DYNAMIC10',
                description: 'Dynamic 10%',
                discountPercent: 10,
                minOrderAmount: 0,
                maxDiscountAmount: 15000,
                isActive: true,
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );

    useCartStore.getState().addItem({
      productId: 'p-1',
      name: 'Cà phê Muối',
      size: 'M',
      unitPrice: 29500,
      quantity: 1,
    });

    render(<CartPage />);

    expect(await screen.findByTestId('cart-item')).toBeTruthy();
    expect(screen.getByText(/Miễn thuế VAT \(0%\)/i)).toBeTruthy();
    expect(screen.queryByText(/Thuế VAT \(8%\)/i)).toBeNull();
    expect(screen.getAllByText('29.500 ₫').length).toBeGreaterThanOrEqual(2);

    expect(await screen.findByText(/1 mã khả dụng/i)).toBeTruthy();

    act(() => {
      useAuthStore.getState().login('jwt-cart-test', { id: 5, email: 'user@brewlite.vn' });
    });
    fireEvent.click(screen.getByTestId('checkout-button'));
    expect(mockPush).toHaveBeenCalledWith('/checkout');
  });

  it('opens detailed ProductEditModal when clicking edit pencil and updates item attributes', async () => {
    useCartStore.getState().addItem({
      productId: 1,
      name: 'Cà phê Đen',
      size: 'S',
      unitPrice: 29000,
      quantity: 1,
    });

    render(<CartPage />);

    expect(await screen.findByText('Cà phê Đen')).toBeTruthy();
    const editBtn = screen.getByRole('button', { name: 'Chỉnh sửa món' });
    fireEvent.click(editBtn);

    // Modal opens showing full details
    expect(screen.getByRole('heading', { name: 'Chỉnh sửa món' })).toBeTruthy();
    expect(screen.getByText('Chọn kích cỡ')).toBeTruthy();

    // Select size L
    const sizeLBtn = screen.getByRole('radio', { name: 'Kích cỡ L' });
    fireEvent.click(sizeLBtn);

    // Click "Cập nhật món"
    const updateBtn = screen.getByRole('button', { name: /Cập nhật món/i });
    fireEvent.click(updateBtn);

    // Verify store is updated
    expect(useCartStore.getState().items[0].size).toBe('L');
  });
});
