import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import AdminPage from './page';
import * as apiClientModule from '../../lib/api-client';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockPush,
  }),
}));

describe('T5.1g Admin Page (/admin) — Highlands Pro Mobile', () => {
  beforeEach(() => {
    mockPush.mockClear();
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('WEB-T19 redirects an unauthenticated or CUSTOMER user to /login?redirect=/admin', async () => {
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

    render(<AdminPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?redirect=%2Fadmin');
    });
  });

  it('WEB-T20 allows ADMIN to view dashboard and switch tabs using Fixed Bottom Bar', async () => {
    // Valid ADMIN role
    apiClientModule.setAuthSession({
      token: 'jwt-admin-token',
      user: {
        id: 99,
        email: 'admin@brewlite.com',
        fullName: 'Quản Lý Cửa Hàng',
        role: 'ADMIN',
      },
    });

    vi.spyOn(apiClientModule, 'apiClient').mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    render(<AdminPage />);

    // 1. Overview Tab is active by default
    await waitFor(() => {
      expect(screen.getByText('BREWLITE PREMIER')).toBeTruthy();
      expect(screen.getByText('Doanh thu hôm nay')).toBeTruthy();
    });

    // 2. Click "Thực đơn" tab on bottom bar
    const menuTabBtn = screen.getByTestId('tab-menu');
    fireEvent.click(menuTabBtn);

    // 3. Verifies Menu section is visible with product cards
    await waitFor(() => {
      expect(screen.getByText('Phin Sữa Đá Highlands')).toBeTruthy();
    });

    // 4. Click "Kho BOM" tab
    const inventoryTabBtn = screen.getByTestId('tab-inventory');
    fireEvent.click(inventoryTabBtn);

    await waitFor(() => {
      expect(screen.getByText('Hạt Robusta Buôn Ma Thuột')).toBeTruthy();
    });

    // 5. Click "Quản trị" tab
    const mgmtTabBtn = screen.getByTestId('tab-management');
    fireEvent.click(mgmtTabBtn);

    await waitFor(() => {
      expect(screen.getByText('Đội ngũ Barista & Thu ngân')).toBeTruthy();
    });
  });

  it('WEB-T20 allows ADMIN to toggle product selling status with instant toast feedback', async () => {
    apiClientModule.setAuthSession({
      token: 'jwt-admin-token',
      user: {
        id: 99,
        email: 'admin@brewlite.com',
        fullName: 'Quản Lý Cửa Hàng',
        role: 'ADMIN',
      },
    });

    vi.spyOn(apiClientModule, 'apiClient').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    render(<AdminPage />);

    // Switch to Menu
    const menuTabBtn = screen.getByTestId('tab-menu');
    fireEvent.click(menuTabBtn);

    await waitFor(() => {
      expect(screen.getByTestId('toggle-product-1')).toBeTruthy();
    });

    // Click toggle switch on product #1 (Phin Sữa Đá Highlands)
    const toggleBtn = screen.getByTestId('toggle-product-1');
    fireEvent.click(toggleBtn);

    // Verifies status changes and toast notification shows
    await waitFor(() => {
      expect(screen.getByText('Đã tạm ngưng bán món')).toBeTruthy();
    });
  });
});
