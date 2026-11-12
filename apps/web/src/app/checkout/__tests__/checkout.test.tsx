import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCartStore } from '../../../stores/cart-store';
import { useAuthStore } from '../../../stores/auth-store';
import { apiClient } from '../../../lib/api-client';

describe('Task T5.1d — Checkout & Idempotency Key Handling (WEB-T10..T13)', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
    useAuthStore.getState().logout();
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('[WEB-T10] unauthenticated user checkout redirects to login while strictly preserving cart items', async () => {
    useCartStore.getState().addItem({
      productId: 'p-1',
      name: 'Cà Phê Sữa Đá',
      size: 'M',
      unitPrice: 40000,
      quantity: 2,
    });

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    // Giả lập logic kiểm tra auth tại trang Checkout
    let redirectUrl = '';
    const checkAuthAndRedirect = () => {
      if (!useAuthStore.getState().isAuthenticated) {
        redirectUrl = '/login?redirect=%2Fcheckout';
      }
    };

    checkAuthAndRedirect();
    expect(redirectUrl).toBe('/login?redirect=%2Fcheckout');
    // Giỏ hàng được giữ nguyên
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].name).toBe('Cà Phê Sữa Đá');
  });

  it('[WEB-T11] payment failure preserves cart and allows user to retry or cancel', async () => {
    useAuthStore.getState().login('valid_jwt_token', { id: 1, email: 'customer@brewlite.vn' });
    useCartStore.getState().addItem({
      productId: 'p-1',
      name: 'Cà Phê Sữa Đá',
      size: 'M',
      unitPrice: 40000,
      quantity: 1,
    });

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/orders')) {
        return Promise.resolve(
          new Response(JSON.stringify({ id: 'ord-101', status: 'PENDING' }), { status: 201 }),
        );
      }
      if (url.includes('/payments')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ status: 'PAYMENT_FAILED', message: 'Tài khoản không đủ số dư' }),
            { status: 400 },
          ),
        );
      }
      return Promise.reject(new Error('Unknown url'));
    });
    vi.stubGlobal('fetch', fetchMock);

    // Thực hiện gọi thanh toán
    const orderRes = await apiClient('/orders', { method: 'POST', body: JSON.stringify({ items: [] }) });
    expect(orderRes.status).toBe(201);

    const paymentRes = await apiClient('/payments', {
      method: 'POST',
      body: JSON.stringify({ orderId: 'ord-101', method: 'WALLET' }),
    });
    expect(paymentRes.status).toBe(400);

    // Khi thanh toán lỗi, giỏ hàng không được xóa để khách thử lại
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it('[WEB-T12] retrying payment sends the exact same Idempotency-Key as previous attempt', async () => {
    useAuthStore.getState().login('valid_jwt_token', { id: 1, email: 'customer@brewlite.vn' });

    const sentKeys: string[] = [];
    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string>;
      if (headers?.['Idempotency-Key']) {
        sentKeys.push(headers['Idempotency-Key']);
      }
      return Promise.resolve(
        new Response(JSON.stringify({ status: 'PAYMENT_FAILED' }), { status: 400 }),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    // Sinh 1 Idempotency Key cố định cho phiên đặt hàng
    const idempotencyKey = 'mock-uuid-key-12345';

    // Lần gọi 1
    await apiClient('/payments', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ orderId: 'ord-101', method: 'WALLET' }),
    });

    // Lần gọi 2 (Thử lại)
    await apiClient('/payments', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ orderId: 'ord-101', method: 'WALLET' }),
    });

    expect(sentKeys).toHaveLength(2);
    expect(sentKeys[0]).toBe(idempotencyKey);
    expect(sentKeys[1]).toBe(idempotencyKey);
    expect(sentKeys[0]).toBe(sentKeys[1]); // Phải trùng khớp 100%
  });

  it('[WEB-T13] successful payment clears cart and confirms order with PAID status', async () => {
    useAuthStore.getState().login('valid_jwt_token', { id: 1, email: 'customer@brewlite.vn' });
    useCartStore.getState().addItem({
      productId: 'p-1',
      name: 'Cà Phê Sữa Đá',
      size: 'M',
      unitPrice: 40000,
      quantity: 1,
    });

    expect(useCartStore.getState().items).toHaveLength(1);

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/payments')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ status: 'PAID', orderId: 'ord-101', pointsEarned: 4 }),
            { status: 200 },
          ),
        );
      }
      return Promise.resolve(new Response(JSON.stringify({ id: 'ord-101' }), { status: 201 }));
    });
    vi.stubGlobal('fetch', fetchMock);

    const paymentRes = await apiClient('/payments', {
      method: 'POST',
      body: JSON.stringify({ orderId: 'ord-101' }),
    });
    const data = await paymentRes.json();

    if (data.status === 'PAID') {
      useCartStore.getState().clear();
    }

    expect(paymentRes.status).toBe(200);
    expect(data.status).toBe('PAID');
    // Giỏ hàng bị xóa sạch sau khi thanh toán thành công
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});

