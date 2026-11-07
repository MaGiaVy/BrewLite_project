import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from './api-client';
import type { OrderStatus, StaffOrder } from './staff-orders';

export interface UseBaristaQueueReturn {
  orders: StaffOrder[];
  error: string | null;
  pendingId: number | null;
  refresh: () => Promise<void>;
  transition: (
    id: number,
    next: 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED',
  ) => Promise<void>;
}

export function useBaristaQueue(intervalMs: number = 3000): UseBaristaQueueReturn {
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const fetchQueue = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await apiClient('/orders/barista/queue', {
        signal: controller.signal,
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (isMountedRef.current) {
        // data can be array directly or wrapped in { data: [...] }
        const list = Array.isArray(data) ? data : data?.data ?? [];
        setOrders(list);
        setError(null);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      if (isMountedRef.current) {
        setError('Mất kết nối, đang thử lại');
      }
    }
  }, []);

  const transition = useCallback(
    async (
      id: number,
      next: 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED',
    ): Promise<void> => {
      if (pendingId !== null) return; // Prevent double tap / concurrent transitions

      setPendingId(id);
      try {
        const res = await apiClient(`/orders/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: next }),
        });

        if (!res.ok) {
          throw new Error(`Cập nhật thất bại: HTTP ${res.status}`);
        }

        await fetchQueue();
      } catch (err: any) {
        if (isMountedRef.current) {
          setError(err?.message || 'Lỗi khi cập nhật trạng thái đơn');
        }
      } finally {
        if (isMountedRef.current) {
          setPendingId(null);
        }
      }
    },
    [pendingId, fetchQueue],
  );

  useEffect(() => {
    isMountedRef.current = true;
    fetchQueue();

    const intervalId = setInterval(fetchQueue, intervalMs);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchQueue, intervalMs]);

  return {
    orders,
    error,
    pendingId,
    refresh: fetchQueue,
    transition,
  };
}
