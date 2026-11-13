import { useEffect, useState, useRef, useCallback } from 'react';
import { apiClient } from '../lib/api-client';

export interface OrderDetail {
  id: string | number;
  status: 'PENDING' | 'PAID' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  totalAmount?: number;
  finalAmount?: number;
  discountAmount?: number;
  createdAt?: string;
  staffName?: string | null;
  items?: {
    id?: string | number;
    productId: string | number;
    name: string;
    size: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export function useOrderPolling(
  orderId: string | number | null | undefined,
  intervalMs = 5000,
) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isStoppedRef = useRef(false);

  const fetchOrder = useCallback(
    async (signal: AbortSignal) => {
      if (!orderId || isStoppedRef.current) return;

      try {
        const res = await apiClient(`/orders/${orderId}`, { signal });
        if (!res.ok) {
          throw new Error('Không thể tải thông tin đơn hàng.');
        }

        const json = await res.json();
        const data: OrderDetail = json?.data ?? json;

        if (signal.aborted || isStoppedRef.current) return;

        setOrder(data);
        setError(null);

        // Dừng polling khi đơn hàng hoàn thành hoặc bị hủy
        if (data.status === 'COMPLETED' || data.status === 'CANCELLED') {
          isStoppedRef.current = true;
          setIsPolling(false);
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
          return;
        }

        // Lên lịch lần gọi tiếp theo nếu chưa dừng
        if (!isStoppedRef.current) {
          timerRef.current = setTimeout(() => {
            if (!isStoppedRef.current) {
              const nextController = new AbortController();
              abortControllerRef.current = nextController;
              void fetchOrder(nextController.signal);
            }
          }, intervalMs);
        }
      } catch (err: unknown) {
        if (signal.aborted || isStoppedRef.current) return;
        setError(err instanceof Error ? err.message : 'Lỗi kết nối');
      }
    },
    [orderId, intervalMs],
  );

  useEffect(() => {
    if (!orderId) {
      setIsPolling(false);
      return;
    }

    isStoppedRef.current = false;
    setIsPolling(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    void fetchOrder(controller.signal);

    return () => {
      isStoppedRef.current = true;
      setIsPolling(false);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [orderId, fetchOrder]);

  return { order, error, isPolling };
}

