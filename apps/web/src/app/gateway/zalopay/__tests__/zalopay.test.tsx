import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import ZaloPayGatewayPage from '../page';
import { useAuthStore } from '../../../../stores/auth-store';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockPush,
  }),
  useSearchParams: () => new URLSearchParams('orderId=707&amount=45000'),
}));

describe('ZaloPay Sandbox Gateway (/gateway/zalopay)', () => {
  beforeEach(() => {
    mockPush.mockClear();
    window.localStorage.clear();
    window.sessionStorage.clear();
    useAuthStore.getState().login('valid_jwt_token', {
      id: 1,
      email: 'customer@brewlite.vn',
      fullName: 'Khách Hàng Test',
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('cancels PENDING order via PATCH /orders/:id/status instead of /payments/zalopay/cancel', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/orders/707/status') && init?.method === 'PATCH') {
        return Promise.resolve(
          new Response(JSON.stringify({ id: 707, status: 'CANCELLED' }), { status: 200 }),
        );
      }
      if (url.includes('/orders/707')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: 707,
              status: 'PENDING',
              totalAmount: 45000,
              createdAt: new Date().toISOString(),
            }),
            { status: 200 },
          ),
        );
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ZaloPayGatewayPage />);

    const cancelBtn = await screen.findByRole('button', { name: /Hủy đơn & Hoàn kho/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/checkout?orderId=707&canceled=true');
    });

    const patchCall = fetchMock.mock.calls.find(
      ([u, init]) => String(u).includes('/orders/707/status') && init?.method === 'PATCH',
    );
    expect(patchCall).toBeTruthy();
    expect(JSON.parse(String(patchCall![1]?.body))).toEqual({ status: 'CANCELLED' });
    expect(
      fetchMock.mock.calls.some(([u]) => String(u).includes('/payments/zalopay/cancel')),
    ).toBe(false);
  });
});
