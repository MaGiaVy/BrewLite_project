import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import StaffPage from './page';
import * as apiClientModule from '../../lib/api-client';
import type { StaffOrder } from '../../lib/staff-orders';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockPush,
  }),
}));

describe('T5.1f Staff Page (/staff)', () => {
  beforeEach(() => {
    mockPush.mockClear();
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('WEB-T17 page redirects a CUSTOMER to /login?redirect=/staff', async () => {
    // Session with CUSTOMER role
    apiClientModule.setAuthSession({
      token: 'jwt-customer-token',
      user: {
        id: 1,
        email: 'customer@brewlite.com',
        fullName: 'Khách Hàng',
        role: 'CUSTOMER',
      },
    });

    vi.spyOn(apiClientModule, 'apiClient').mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    render(<StaffPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?redirect=%2Fstaff');
    });
  });

  it('WEB-T17 page shows only PAID orders on the "Mới" tab, longest wait first', async () => {
    // Set valid STAFF role
    apiClientModule.setAuthSession({
      token: 'jwt-staff-token',
      user: {
        id: 2,
        email: 'barista@brewlite.com',
        fullName: 'Barista Nguyễn',
        role: 'STAFF',
      },
    });

    const mockQueue: StaffOrder[] = [
      {
        id: 101,
        status: 'PAID',
        createdAt: '2026-11-07T10:10:00Z', // 5m wait
        items: [{ id: 1, productId: 1, productName: 'Espresso', quantity: 1, unitPrice: 25000 }],
      },
      {
        id: 102,
        status: 'PAID',
        createdAt: '2026-11-07T10:00:00Z', // 15m wait (older!)
        items: [{ id: 2, productId: 2, productName: 'Bạc xỉu', quantity: 2, unitPrice: 35000 }],
      },
      {
        id: 103,
        status: 'PREPARING',
        createdAt: '2026-11-07T10:05:00Z',
        items: [{ id: 3, productId: 3, productName: 'Latte', quantity: 1, unitPrice: 40000 }],
      },
    ];

    vi.spyOn(apiClientModule, 'apiClient').mockImplementation(async (path) => {
      if (path === '/orders/barista/queue') {
        return new Response(JSON.stringify(mockQueue), { status: 200 });
      }
      if (path === '/inventory/ingredients') {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });

    render(<StaffPage />);

    await waitFor(() => {
      expect(screen.getByText(/#BL-102/)).toBeTruthy();
      expect(screen.getByText(/#BL-101/)).toBeTruthy();
    });

    // 103 is PREPARING, so it should NOT be in the "Mới" tab list
    expect(screen.queryByText(/#BL-103/)).toBeNull();

    // Verify ordering: 102 is older than 101, so 102 appears first
    const cardHeadings = screen.getAllByText(/#BL-10[12]/);
    expect(cardHeadings[0].textContent).toContain('102');
    expect(cardHeadings[1].textContent).toContain('101');
  });

  it('WEB-T17 empty tab shows "Không có đơn"', async () => {
    apiClientModule.setAuthSession({
      token: 'jwt-staff-token',
      user: {
        id: 2,
        email: 'barista@brewlite.com',
        fullName: 'Barista Nguyễn',
        role: 'STAFF',
      },
    });

    vi.spyOn(apiClientModule, 'apiClient').mockImplementation(async (path) => {
      if (path === '/orders/barista/queue') {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (path === '/inventory/ingredients') {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });

    render(<StaffPage />);

    await waitFor(() => {
      expect(screen.getByText('Không có đơn')).toBeTruthy();
    });
  });

  it('WEB-T17 low stock banner appears when /inventory/ingredients returns LOW_STOCK or OUT_OF_STOCK', async () => {
    apiClientModule.setAuthSession({
      token: 'jwt-staff-token',
      user: {
        id: 2,
        email: 'barista@brewlite.com',
        fullName: 'Barista Nguyễn',
        role: 'STAFF',
      },
    });

    const mockIngredients = [
      { id: 1, name: 'Hạt Arabica', status: 'LOW_STOCK' },
      { id: 2, name: 'Trân châu trắng', status: 'OUT_OF_STOCK' },
      { id: 3, name: 'Đường cát', status: 'OK' },
    ];

    vi.spyOn(apiClientModule, 'apiClient').mockImplementation(async (path) => {
      if (path === '/orders/barista/queue') {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (path === '/inventory/ingredients') {
        return new Response(JSON.stringify(mockIngredients), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });

    render(<StaffPage />);

    await waitFor(() => {
      expect(screen.getByText(/Sắp hết:/i)).toBeTruthy();
      expect(screen.getByText(/Hạt Arabica, Trân châu trắng/i)).toBeTruthy();
    });
  });
});
