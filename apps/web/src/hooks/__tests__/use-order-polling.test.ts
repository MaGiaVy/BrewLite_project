import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOrderPolling } from '../use-order-polling';

describe('Task T5.1e — Order Polling Hook (WEB-T14..T16)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('[WEB-T14] polls GET /orders/:id every 5000ms', async () => {
    let callCount = 0;
    const fetchMock = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: { id: 'ord-123', status: 'PREPARING', totalAmount: 45000 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    renderHook(() => useOrderPolling('ord-123', 5000));

    // Gọi lần đầu ngay khi mount
    await act(async () => {
      await Promise.resolve();
    });
    expect(callCount).toBe(1);

    // Chờ 5000ms
    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });
    expect(callCount).toBe(2);

    // Chờ thêm 5000ms nữa
    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });
    expect(callCount).toBe(3);
  });

  it('[WEB-T15] automatically stops polling when order reaches COMPLETED or CANCELLED', async () => {
    let currentStatus = 'PREPARING';
    const fetchMock = vi.fn().mockImplementation(() => {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: { id: 'ord-456', status: currentStatus },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useOrderPolling('ord-456', 5000));

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.order?.status).toBe('PREPARING');

    // Chuyển sang COMPLETED
    currentStatus = 'COMPLETED';
    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });
    expect(result.current.order?.status).toBe('COMPLETED');
    expect(result.current.isPolling).toBe(false);

    const callCountAfterComplete = fetchMock.mock.calls.length;

    // Tiến thêm 10000ms nữa -> Không được gọi thêm lần nào
    await act(async () => {
      vi.advanceTimersByTime(10000);
      await Promise.resolve();
    });
    expect(fetchMock.mock.calls.length).toBe(callCountAfterComplete);
  });

  it('[WEB-T16] cancels timer and aborts pending fetch when unmounted', async () => {
    let abortTriggered = false;
    const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      const signal = init?.signal;
      if (signal) {
        signal.addEventListener('abort', () => {
          abortTriggered = true;
        });
      }
      return new Promise(() => {}); // request dang bay
    });
    vi.stubGlobal('fetch', fetchMock);

    const { unmount } = renderHook(() => useOrderPolling('ord-789', 5000));

    await act(async () => {
      await Promise.resolve();
    });

    // Unmount hook
    unmount();

    expect(abortTriggered).toBe(true);
  });
});

