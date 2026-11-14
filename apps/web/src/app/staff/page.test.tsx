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

  it('WEB-T17 authorizes STAFF from fallback key (brewlite-auth-storage)', async () => {
    window.localStorage.setItem(
      'brewlite-auth-storage',
      JSON.stringify({
        state: {
          token: 'jwt-staff-fallback',
          user: { id: 2, email: 'barista@brewlite.vn', role: 'STAFF' },
        },
      }),
    );

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
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('WEB-T17 page shows only PAID orders on the "Mới" tab, longest wait first', async () => {
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
        createdAt: '2026-11-07T10:10:00Z',
        items: [{ id: 1, productId: 1, productName: 'Espresso', quantity: 1, unitPrice: 25000 }],
      },
      {
        id: 102,
        status: 'PAID',
        createdAt: '2026-11-07T10:00:00Z',
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

    expect(screen.queryByText(/#BL-103/)).toBeNull();

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

  it('WEB-T17 transitions order via PATCH /orders/:id/status ({ status }) and surfaces backend error', async () => {
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
        id: 205,
        status: 'PAID',
        createdAt: '2026-11-07T10:00:00Z',
        items: [{ id: 1, productId: 1, productName: 'Cà phê Đen', quantity: 1, unitPrice: 29000 }],
      },
    ];

    const apiSpy = vi.spyOn(apiClientModule, 'apiClient').mockImplementation(async (path, init) => {
      if (path === '/orders/barista/queue') {
        return new Response(JSON.stringify(mockQueue), { status: 200 });
      }
      if (path === '/inventory/ingredients') {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (path === '/orders/205/status' && init?.method === 'PATCH') {
        return new Response(
          JSON.stringify({ message: 'Trạng thái đơn hàng đã thay đổi bởi nhân viên khác.' }),
          { status: 409 },
        );
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });

    render(<StaffPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Bắt đầu pha/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /Bắt đầu pha/i }));

    await waitFor(() => {
      expect(screen.getByText(/Trạng thái đơn hàng đã thay đổi bởi nhân viên khác/i)).toBeTruthy();
    });

    const patchCall = apiSpy.mock.calls.find(([p]) => p === '/orders/205/status');
    expect(patchCall).toBeTruthy();
    expect(JSON.parse(String(patchCall![1]?.body))).toEqual({ status: 'PREPARING' });
  });
});
