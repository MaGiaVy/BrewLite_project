import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBaristaQueue } from './use-barista-queue';
import * as apiClientModule from './api-client';

describe('T5.1f useBaristaQueue hook', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('polls /orders/barista/queue every 3 seconds and stops on unmount', async () => {
    const mockOrders = [
      { id: 101, status: 'PAID', createdAt: new Date().toISOString(), items: [] },
    ];

    const apiClientSpy = vi.spyOn(apiClientModule, 'apiClient').mockImplementation(async (path) => {
      if (path === '/orders/barista/queue') {
        return new Response(JSON.stringify(mockOrders), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });

    const { result, unmount } = renderHook(() => useBaristaQueue(3000));

    // Initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(apiClientSpy).toHaveBeenCalledTimes(1);
    expect(result.current.orders).toEqual(mockOrders);
    expect(result.current.error).toBeNull();

    // Advance 3 seconds
    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
    });

    expect(apiClientSpy).toHaveBeenCalledTimes(2);

    // Unmount and verify polling stops
    unmount();

    await act(async () => {
      vi.advanceTimersByTime(6000);
      await Promise.resolve();
    });

    expect(apiClientSpy).toHaveBeenCalledTimes(2);
  });

  it('keeps previous orders and sets error when a poll fails', async () => {
    const mockOrders = [
      { id: 101, status: 'PAID', createdAt: new Date().toISOString(), items: [] },
    ];

    let callCount = 0;
    vi.spyOn(apiClientModule, 'apiClient').mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return new Response(JSON.stringify(mockOrders), { status: 200 });
      }
      throw new Error('Network error');
    });

    const { result } = renderHook(() => useBaristaQueue(3000));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.orders).toEqual(mockOrders);
    expect(result.current.error).toBeNull();

    // Second poll fails
    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
    });

    expect(result.current.orders).toEqual(mockOrders);
    expect(result.current.error).toBe('Mất kết nối, đang thử lại');
  });

  it('transition sends one PATCH while pending (prevents double tap)', async () => {
    let resolvePatch: (value: Response) => void;
    const patchPromise = new Promise<Response>((resolve) => {
      resolvePatch = resolve;
    });

    const apiClientSpy = vi.spyOn(apiClientModule, 'apiClient').mockImplementation(async (path, opts) => {
      if (path === '/orders/barista/queue') {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (path === '/orders/101/status' && opts?.method === 'PATCH') {
        return patchPromise;
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });

    const { result } = renderHook(() => useBaristaQueue(3000));

    await act(async () => {
      await Promise.resolve();
    });

    // Start transition
    let p1: Promise<void>;
    act(() => {
      p1 = result.current.transition(101, 'PREPARING');
    });

    expect(result.current.pendingId).toBe(101);

    // Double tap attempt
    act(() => {
      result.current.transition(101, 'PREPARING');
    });

    // Count patch calls
    const patchCalls = apiClientSpy.mock.calls.filter(([p]) => p === '/orders/101/status');
    expect(patchCalls.length).toBe(1);

    // Resolve patch
    await act(async () => {
      resolvePatch!(new Response(JSON.stringify({ success: true }), { status: 200 }));
      await p1;
    });

    expect(result.current.pendingId).toBeNull();
  });

  it('surfaces backend error message when transition fails with non-2xx JSON body', async () => {
    vi.spyOn(apiClientModule, 'apiClient').mockImplementation(async (path, opts) => {
      if (path === '/orders/barista/queue') {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (path === '/orders/101/status' && opts?.method === 'PATCH') {
        return new Response(
          JSON.stringify({ message: 'Không thể chuyển trạng thái đơn này' }),
          { status: 400 },
        );
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });

    const { result } = renderHook(() => useBaristaQueue(3000));
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.transition(101, 'PREPARING');
    });

    expect(result.current.error).toBe('Không thể chuyển trạng thái đơn này');
  });
});
