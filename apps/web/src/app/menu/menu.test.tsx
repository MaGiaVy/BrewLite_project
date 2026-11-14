import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Menu from './page';
import { MenuContent } from '../../components/MenuContent';
import type { ProductSummary } from '../../components/ProductCard';
import {
  isProductOutOfStock,
  matchesCategory,
  unwrapProductList,
} from '../../lib/product-normalize';
import { useCartStore } from '../../stores/cart-store';

const example: ProductSummary = {
  id: 1,
  name: 'Cà phê sữa',
  price: 35000,
  imageUrl: '/images/products/1.svg',
  stock: 4,
};

beforeEach(() => {
  useCartStore.getState().clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('T4.3 Menu UI', () => {
  it('WEB-T01: renders skeleton while loading', () => {
    render(<MenuContent products={[]} state="loading" retry={vi.fn()} />);
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getAllByTestId('menu-skeleton')).toHaveLength(3);
  });

  it('WEB-T02: renders Chưa có món on empty products', () => {
    render(<MenuContent products={[]} state="empty" retry={vi.fn()} />);
    expect(screen.getByText('Chưa có món')).toBeTruthy();
  });

  it('WEB-T03: retries the failed API request and shows products', async () => {
    const mockedFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [example] }) });
    vi.stubGlobal('fetch', mockedFetch);

    render(<Menu />);
    expect(await screen.findByRole('alert')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    await waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Cà phê sữa')).toBeTruthy();
  });

  it('shows Hết hàng for stock 0', () => {
    render(<MenuContent products={[{ ...example, stock: 0 }]} state="ready" retry={vi.fn()} />);
    expect(screen.getByText('Hết hàng')).toBeTruthy();
  });

  it('unwraps both { data: [...] } envelope and direct arrays without losing BOM stock flags', () => {
    const wrapped = unwrapProductList({
      data: [{ id: 1, name: 'Cà phê Đen', basePrice: 29000, stock: 0, isOutOfStock: true, availableServings: 0, outOfStockSizes: ['S', 'M', 'L'] }],
    });
    expect(wrapped).toHaveLength(1);
    expect(wrapped[0]).toMatchObject({
      id: 1,
      price: 29000,
      stock: 0,
      isOutOfStock: true,
      availableServings: 0,
    });
    expect(isProductOutOfStock(wrapped[0])).toBe(true);

    const direct = unwrapProductList([{ id: 2, name: 'Trà Đào', basePrice: 45000, availableServings: 7, isOutOfStock: false }]);
    expect(direct).toHaveLength(1);
    expect(direct[0].stock).toBe(7);
    expect(isProductOutOfStock(direct[0])).toBe(false);
  });

  it('maps seeded DB categories to menu filter aliases cleanly', () => {
    expect(matchesCategory('vietnamese', 'salt_phin')).toBe(true);
    expect(matchesCategory('tea', 'tea_matcha')).toBe(true);
    expect(matchesCategory('coldbrew', 'cold_brew')).toBe(true);
    expect(matchesCategory('espresso', 'bakery')).toBe(false);
  });

  it('shows real error state on network failure instead of silently loading mock products', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network down')));

    render(<Menu />);
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText(/Không tải được menu/i)).toBeTruthy();
  });

  it('renders product-card testid and keeps strictly one cart-link on /menu even when cart has items', async () => {
    useCartStore.getState().addItem({
      productId: 1,
      name: 'Cà phê Sữa',
      size: 'M',
      unitPrice: 35000,
      quantity: 1,
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { ...example, category: 'vietnamese', isOutOfStock: false, availableServings: 5 },
            { id: 10, name: 'Classic Tiramisu', basePrice: 49000, imageUrl: null, category: 'bakery', stock: 5, availableServings: 0, isOutOfStock: true },
          ],
        }),
      }),
    );

    render(<Menu />);
    const cards = await screen.findAllByTestId('product-card');
    expect(cards).toHaveLength(2);
    expect(screen.getByText('Hết hàng')).toBeTruthy();
    expect(screen.getAllByTestId('cart-link')).toHaveLength(1);

    // Filtering by Cà Phê Muối & Phin matches seeded category 'vietnamese'
    fireEvent.click(screen.getByRole('button', { name: 'Cà Phê Muối & Phin' }));
    expect(screen.getAllByTestId('product-card')).toHaveLength(1);
  });
});
