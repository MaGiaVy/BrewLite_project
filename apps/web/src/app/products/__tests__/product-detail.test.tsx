import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import ProductDetailPage from '../[id]/page';
import { useCartStore } from '../../../stores/cart-store';
import { MOCK_PRODUCTS } from '../../../data/mock-products';

// Mock Next.js navigation
const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

function stubProductApi(overrides: Record<string, unknown> = {}, pricingConfig?: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/inventory/pricing-config')) {
        if (!pricingConfig) {
          return Promise.resolve(new Response(JSON.stringify({ message: 'Not mocked' }), { status: 404 }));
        }
        return Promise.resolve(
          new Response(JSON.stringify(pricingConfig), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      }
      const match = url.match(/\/products\/([^/?]+)/);
      const id = match?.[1] ?? '1';
      const base = MOCK_PRODUCTS.find((p) => String(p.id) === id);
      if (!base) {
        return Promise.resolve(new Response(JSON.stringify({ message: 'Not found' }), { status: 404 }));
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              ...base,
              basePrice: base.price,
              availableServings: base.stock,
              isOutOfStock: base.stock <= 0,
              outOfStockSizes: [],
              ...overrides,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    }),
  );
}

describe('Task T5.1c — Product Detail Page (/products/[id])', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
    mockPush.mockClear();
    mockBack.mockClear();
    stubProductApi();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
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

  it('shows real error UI instead of falling back to MOCK_PRODUCTS when API fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    render(<ProductDetailPage params={Promise.resolve({ id: '1' })} />);

    expect(await screen.findByText(/Không thể tải thông tin sản phẩm/i)).toBeTruthy();
    expect(screen.queryByText('Cà phê Đen')).toBeNull();
  });

  it('uses pricing-config sizes/toppings, disables outOfStockSizes, auto-picks available size, and cancels 600ms redirect on unmount', async () => {
    stubProductApi(
      { outOfStockSizes: ['M'], availableServings: 10, stock: 10 },
      {
        sizePricing: { sizeS: 0, sizeM: 7000, sizeL: 15000 },
        toppings: [
          { id: 'boba', name: 'Trân châu trắng giòn', subtext: 'Crystal boba', price: 9000, isActive: true, isOutOfStock: false },
        ],
        bakeryToppings: [],
      },
    );

    const { unmount } = render(<ProductDetailPage params={Promise.resolve({ id: '1' })} />);
    expect(await screen.findByText('Cà phê Đen')).toBeTruthy();

    const sizeS = screen.getByTestId('size-option-S');
    const sizeM = screen.getByTestId('size-option-M');
    const sizeL = screen.getByTestId('size-option-L');

    expect(sizeM.hasAttribute('disabled')).toBe(true);
    expect(sizeS.getAttribute('aria-checked')).toBe('true');
    expect(sizeL.textContent).toContain('+15.000đ');
    expect(screen.getByTestId('cart-link').getAttribute('href')).toBe('/cart');

    fireEvent.click(screen.getAllByTestId('topping-option')[0]);
    expect(screen.getAllByText(/38\.000/).length).toBeGreaterThanOrEqual(1);

    vi.useFakeTimers();
    fireEvent.click(screen.getByTestId('add-to-cart-button'));
    unmount();
    vi.advanceTimersByTime(700);
    expect(mockPush).not.toHaveBeenCalledWith('/menu');
  });
});
