import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  apiClient,
  getAuthToken,
  setAuthSession,
  getCartItems,
  setCartItems,
} from './api-client';

describe('Task T5.1b — Frontend API Client 401 Handling (WEB-T09)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('[WEB-T09] clears auth token, redirects to /login?redirect=..., and strictly preserves cart items on 401 Unauthorized', async () => {
    setAuthSession({
      token: 'expired_jwt_token_xyz',
      user: {
        id: 1,
        email: '3124410414@sv.sgu.edu.vn',
        fullName: 'Huỳnh Tuấn Kiệt',
        role: 'CUSTOMER',
      },
    });

    setCartItems([
      {
        id: 101,
        name: 'Cà Phê Sữa Đá Cầu Đất',
        price: 45000,
        quantity: 2,
        size: 'M',
      },
    ]);

    expect(getAuthToken()).toBe('expired_jwt_token_xyz');
    expect(getCartItems()).toHaveLength(1);

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ statusCode: 401, message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    let redirectedUrl = '';
    const res = await apiClient('/orders', {
      method: 'POST',
      body: JSON.stringify({ items: [] }),
      currentPath: '/checkout',
      onUnauthorizedRedirect: (url) => {
        redirectedUrl = url;
      },
    });

    expect(res.status).toBe(401);
    expect(getAuthToken()).toBeNull();
    expect(redirectedUrl).toBe('/login?redirect=%2Fcheckout');

    // Giỏ hàng được giữ nguyên 100%
    const remainingCart = getCartItems();
    expect(remainingCart).toHaveLength(1);
    expect(remainingCart[0].name).toBe('Cà Phê Sữa Đá Cầu Đất');
    expect(remainingCart[0].quantity).toBe(2);
  });

  it('[WEB-T09] attaches Authorization Bearer token and preserves session on 200 OK', async () => {
    setAuthSession({
      token: 'valid_jwt_token_123',
      user: {
        id: 1,
        email: '3124410414@sv.sgu.edu.vn',
        fullName: 'Huỳnh Tuấn Kiệt',
      },
    });

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 1, email: '3124410414@sv.sgu.edu.vn' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const res = await apiClient('/auth/me');
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/me'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer valid_jwt_token_123',
        }),
      }),
    );
    expect(getAuthToken()).toBe('valid_jwt_token_123');
  });
});

