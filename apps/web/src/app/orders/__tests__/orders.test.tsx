import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OrderListPage from '../page';
import { useAuthStore } from '../../../stores/auth-store';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}));

// Mock audio API
vi.stubGlobal(
  'AudioContext',
  class {
    currentTime = 0;
    destination = {};
    createOscillator() {
      return {
        type: 'sine',
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };
    }
    createGain() {
      return {
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      };
    }
  },
);

describe('Task T5.1e — Mobile Order History Page (/orders)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    useAuthStore.setState({
      isAuthenticated: true,
      token: 'fake-token',
      user: { id: 1, email: 'khachhang@brewlite.vn', fullName: 'Huỳnh Tuấn Kiệt' },
    });
  });

  it('renders mobile layout with title, stats, and navigation bar', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: [
              {
                id: 104,
                status: 'READY',
                totalAmount: 65000,
                createdAt: new Date().toISOString(),
                items: [
                  {
                    productId: 1,
                    name: 'Cà Phê Muối Đặc Biệt',
                    size: 'L',
                    quantity: 1,
                    unitPrice: 65000,
                  },
                ],
              },
              {
                id: 101,
                status: 'COMPLETED',
                totalAmount: 78000,
                createdAt: new Date().toISOString(),
                items: [
                  {
                    productId: 5,
                    name: 'Bạc Xỉu Sài Gòn',
                    size: 'M',
                    quantity: 2,
                    unitPrice: 39000,
                  },
                ],
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<OrderListPage />);

    expect(await screen.findByText('Đơn hàng của tôi')).toBeTruthy();
    expect(screen.getAllByText('Thực đơn').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Đồng bộ Barista KDS/i)).toBeTruthy();
    expect(screen.getByText('Đang xử lý')).toBeTruthy();
    expect(screen.getByText('Tổng đơn')).toBeTruthy();
  });

  it('displays the prominent Pickup Call Banner when an order is READY', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: [
              {
                id: 104,
                status: 'READY',
                totalAmount: 65000,
                createdAt: new Date().toISOString(),
                items: [
                  {
                    productId: 1,
                    name: 'Cà Phê Muối',
                    size: 'L',
                    quantity: 1,
                    unitPrice: 65000,
                  },
                ],
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<OrderListPage />);

    expect(await screen.findByText(/Quầy Barista đang gọi bạn/i)).toBeTruthy();
    expect(screen.getByText(/Đơn #104 đã pha chế xong!/i)).toBeTruthy();
    expect(screen.getByText(/Kệ Express Bar số 04/i)).toBeTruthy();
  });

  it('filters orders by category tab (Tất cả, Đang thực hiện, Đã hoàn thành, Đã hủy)', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: [
              {
                id: 201,
                status: 'PREPARING',
                totalAmount: 45000,
                createdAt: new Date().toISOString(),
                items: [
                  {
                    productId: 1,
                    name: 'Trà Đào Cam Sả',
                    size: 'M',
                    quantity: 1,
                    unitPrice: 45000,
                  },
                ],
              },
              {
                id: 202,
                status: 'COMPLETED',
                totalAmount: 50000,
                createdAt: new Date().toISOString(),
                items: [
                  {
                    productId: 2,
                    name: 'Matcha Latte',
                    size: 'M',
                    quantity: 1,
                    unitPrice: 50000,
                  },
                ],
              },
              {
                id: 203,
                status: 'CANCELLED',
                totalAmount: 30000,
                createdAt: new Date().toISOString(),
                items: [
                  {
                    productId: 3,
                    name: 'Espresso',
                    size: 'S',
                    quantity: 1,
                    unitPrice: 30000,
                  },
                ],
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<OrderListPage />);

    const els201 = await screen.findAllByText('#BL-201');
    expect(els201.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('#BL-202')).toBeTruthy();
    expect(screen.getByText('#BL-203')).toBeTruthy();

    // Click 'Đã hoàn thành' tab
    const completedTab = screen.getByRole('button', { name: /Đã hoàn thành/i });
    fireEvent.click(completedTab);

    expect(screen.getByText('#BL-202')).toBeTruthy();
    expect(screen.queryByText('#BL-201')).toBeNull();
    expect(screen.queryByText('#BL-203')).toBeNull();

    // Click 'Đã hủy' tab
    const cancelledTab = screen.getByRole('button', { name: /Đã hủy/i });
    fireEvent.click(cancelledTab);

    expect(screen.getByText('#BL-203')).toBeTruthy();
    expect(screen.queryByText('#BL-201')).toBeNull();
    expect(screen.queryByText('#BL-202')).toBeNull();
  });

  it('soft-deletes cancelled orders and restores them via local storage', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            data: [
              {
                id: 301,
                status: 'CANCELLED',
                totalAmount: 35000,
                createdAt: new Date().toISOString(),
                items: [
                  {
                    productId: 1,
                    name: 'Cold Brew',
                    size: 'M',
                    quantity: 1,
                    unitPrice: 35000,
                  },
                ],
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<OrderListPage />);

    expect(await screen.findByText('#BL-301')).toBeTruthy();

    // Bấm 'Dọn đơn hủy'
    const cleanBtn = screen.getByRole('button', { name: /Dọn đơn hủy/i });
    fireEvent.click(cleanBtn);

    // Không còn thấy #BL-301
    await waitFor(() => {
      expect(screen.queryByText('#BL-301')).toBeNull();
    });

    // Nút khôi phục xuất hiện
    const restoreBtn = screen.getByRole('button', { name: /Khôi phục/i });
    fireEvent.click(restoreBtn);

    // #BL-301 lại xuất hiện
    await waitFor(() => {
      expect(screen.getByText('#BL-301')).toBeTruthy();
    });
  });

  it('redirects unauthenticated users to /login?redirect=%2Forders', async () => {
    useAuthStore.setState({
      isAuthenticated: false,
      token: null,
      user: null,
    });

    render(<OrderListPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?redirect=%2Forders');
    });
  });
});
