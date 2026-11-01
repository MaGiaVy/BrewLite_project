import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Menu from '../../app/menu/page';
import { MenuContent } from '../MenuContent';
import type { ProductSummary } from '../ProductCard';

const example: ProductSummary = {
  id: 1,
  name: 'Cà phê sữa',
  price: 35000,
  imageUrl: '/images/products/1.svg',
  stock: 4,
};

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
});
