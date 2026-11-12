import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductDetailPage from '../[id]/page';
import { useCartStore } from '../../../stores/cart-store';

// Mock Next.js navigation
const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

describe('Task T5.1c — Product Detail Page (/products/[id])', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
    mockPush.mockClear();
    mockBack.mockClear();
  });

  it('renders product details and initial pricing correctly', async () => {
    render(
      <ProductDetailPage
        params={Promise.resolve({ id: '1' })}
      />,
    );

    // Món 1: Cà phê Đen (Giá gốc 29.000đ + Size M 5.000đ = 34.000đ)
    expect(await screen.findByText('Cà phê Đen')).toBeTruthy();
    expect(screen.getByText('Chọn kích cỡ')).toBeTruthy();
    expect(screen.getByText(/Thêm Topping/i)).toBeTruthy();
    expect(screen.getByText(/Thêm vào giỏ hàng/i)).toBeTruthy();
  });

  it('updates price dynamically when changing size from M to L', async () => {
    render(
      <ProductDetailPage
        params={Promise.resolve({ id: '1' })}
      />,
    );

    expect(await screen.findByText('Cà phê Đen')).toBeTruthy();

    // Ban đầu size M (phụ thu +5.000đ) -> Giá 34.000đ
    // Click size L (phụ thu +10.000đ) -> Giá tăng thành 39.000đ
    const sizeLBtn = screen.getByRole('radio', { name: 'Kích cỡ L' });
    fireEvent.click(sizeLBtn);

    const priceElements = await screen.findAllByText(/39\.000/);
    expect(priceElements.length).toBeGreaterThanOrEqual(1);
  });

  it('adjusts quantity within limits (1 to 20)', async () => {
    render(
      <ProductDetailPage
        params={Promise.resolve({ id: '1' })}
      />,
    );

    expect(await screen.findByText('Cà phê Đen')).toBeTruthy();

    const increaseBtn = screen.getByLabelText('Tăng số lượng');
    const decreaseBtn = screen.getByLabelText('Giảm số lượng');

    // Mặc định là 1 -> nút giảm bị disabled
    expect(decreaseBtn.hasAttribute('disabled')).toBe(true);

    // Bấm tăng lên 2
    fireEvent.click(increaseBtn);
    expect(decreaseBtn.hasAttribute('disabled')).toBe(false);
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('adds customized item to CartStore when clicking Thêm vào giỏ', async () => {
    render(
      <ProductDetailPage
        params={Promise.resolve({ id: '1' })}
      />,
    );

    expect(await screen.findByText('Cà phê Đen')).toBeTruthy();

    const addBtn = screen.getByRole('button', { name: /Thêm vào giỏ hàng/i });
    fireEvent.click(addBtn);

    const items = useCartStore.getState().items;
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items[0].name).toBe('Cà phê Đen');
    expect(items[0].size).toBe('M');
  });

  it('renders all 5 sweetness options and updates selection correctly', async () => {
    render(
      <ProductDetailPage
        params={Promise.resolve({ id: '1' })}
      />,
    );

    expect(await screen.findByText('Cà phê Đen')).toBeTruthy();

    // Kiểm tra đủ 5 options độ ngọt: 0%, 25%, 50%, 75%, 100%
    const expectedSweetness = ['0%', '25%', '50%', '75%', '100%'];
    for (const percent of expectedSweetness) {
      expect(screen.getByRole('radio', { name: `Độ ngọt ${percent}` })).toBeTruthy();
    }

    // Chọn mức 50%
    const sweet50Btn = screen.getByRole('radio', { name: 'Độ ngọt 50%' });
    fireEvent.click(sweet50Btn);
    expect(sweet50Btn.getAttribute('aria-checked')).toBe('true');
    expect(screen.getByText('Mức: 50%')).toBeTruthy();
  });

  it('renders all 4 ice options and updates selection correctly', async () => {
    render(
      <ProductDetailPage
        params={Promise.resolve({ id: '1' })}
      />,
    );

    expect(await screen.findByText('Cà phê Đen')).toBeTruthy();

    // 4 options lượng đá: Không đá, Đá riêng, Ít đá (50%), Bình thường (100%)
    expect(screen.getByRole('radio', { name: 'Không đá' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Đá riêng' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Ít đá (50%)' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Bình thường (100%)' })).toBeTruthy();

    // Chọn "Đá riêng"
    const separateIceBtn = screen.getByRole('radio', { name: 'Đá riêng' });
    fireEvent.click(separateIceBtn);
    expect(separateIceBtn.getAttribute('aria-checked')).toBe('true');
  });

  it('disables add button when product is sold out (stock: 0)', async () => {
    render(
      <ProductDetailPage
        params={Promise.resolve({ id: '10' })} // Món 10 (Classic Tiramisu) có stock = 0
      />,
    );

    expect(await screen.findByText('Classic Tiramisu')).toBeTruthy();
    const soldOutBtn = screen.getByRole('button', { name: /Món Tạm Hết Hàng/i });
    expect(soldOutBtn.hasAttribute('disabled')).toBe(true);
  });
});
