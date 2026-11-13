'use client';

import React, { Suspense, useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lock,
  Wallet,
  Building2,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  RotateCcw,
  X,
  XCircle,
} from 'lucide-react';
import { apiClient, getAuthToken } from '../../../lib/api-client';
import { useAuthStore } from '../../../stores/auth-store';
import { useCartStore } from '../../../stores/cart-store';

function vnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount || 0);
}

const DEFAULT_BALANCE = 1000000; // 1.000.000đ mặc định
const BALANCE_STORAGE_KEY = 'zalopay_sandbox_wallet_balance';
const GATEWAY_TTL_SECONDS = 300; // 5 phút đồng bộ theo TTL backend
const ACTIVE_PENDING_ORDER_KEY = 'brewlite_active_pending_order';
const EXPIRY_SYNC_BACKOFF_MS = [1200, 2500, 4000] as const;
const PAID_ORDER_STATUSES: ReadonlySet<string> = new Set([
  'PAID',
  'PREPARING',
  'READY',
  'COMPLETED',
]);

function clearActivePendingOrder(targetOrderId?: number) {
  if (typeof window === 'undefined') return;
  for (const storage of [window.sessionStorage, window.localStorage]) {
    try {
      const raw = storage.getItem(ACTIVE_PENDING_ORDER_KEY);
      if (!raw) continue;
      if (targetOrderId !== undefined) {
        let storedId: number | null = Number(raw);
        if (Number.isNaN(storedId)) {
          const parsed = JSON.parse(raw) as { orderId?: unknown } | null;
          storedId = parsed && typeof parsed === 'object' ? Number(parsed.orderId) : null;
        }
        if (storedId !== null && !Number.isNaN(storedId) && storedId !== targetOrderId) {
          continue;
        }
      }
      storage.removeItem(ACTIVE_PENDING_ORDER_KEY);
    } catch {
      try {
        storage.removeItem(ACTIVE_PENDING_ORDER_KEY);
      } catch {
        // ignore storage access errors
      }
    }
  }
}

interface GatewayOrderInfo {
  id: number;
  status: string;
  totalAmount: number;
  createdAt: string;
}

function calcRemainingFromCreatedAt(createdAt?: string): number {
  if (!createdAt) return GATEWAY_TTL_SECONDS;
  const createdMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdMs)) return GATEWAY_TTL_SECONDS;
  return Math.max(0, GATEWAY_TTL_SECONDS - Math.floor((Date.now() - createdMs) / 1000));
}

function extractGatewayErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const msg = (data as { message?: unknown }).message;
  if (Array.isArray(msg)) {
    const joined = msg.filter((m): m is string => typeof m === 'string').join(', ');
    return joined || fallback;
  }
  return typeof msg === 'string' && msg.trim() ? msg : fallback;
}

function ZaloPayGatewayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clearCart = useCartStore((s) => s.clear);
  const { user, isAuthenticated } = useAuthStore();

  const rawOrderId = searchParams.get('orderId');
  const orderId = Number(rawOrderId) || 0;
  const initialAmount = Number(searchParams.get('amount')) || 0;
  const [fallbackAppTransId] = useState(
    () => `261024_${orderId}_${Math.floor(100000 + Math.random() * 900000)}`
  );
  const appTransId = searchParams.get('appTransId') || fallbackAppTransId;

  const [orderInfo, setOrderInfo] = useState<GatewayOrderInfo | null>(null);
  const amount = orderInfo?.totalAmount ?? initialAmount;
  const [walletBalance, setWalletBalance] = useState<number>(DEFAULT_BALANCE);
  const [timeLeft, setTimeLeft] = useState(GATEWAY_TTL_SECONDS);
  const [status, setStatus] = useState<'READY' | 'PROCESSING' | 'SUCCESS' | 'FAILED'>('READY');
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [expirySyncExhaustedKey, setExpirySyncExhaustedKey] = useState<string | null>(null);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [, startTransition] = useTransition();

  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [topupAmountInput, setTopupAmountInput] = useState('500000');
  const [topupSuccessMsg, setTopupSuccessMsg] = useState('');

  const accountHolder = user?.fullName || 'Khách hàng ZaloPay Sandbox';
  const accountPhone = user?.phone || '0901***001';

  // Check auth
  useEffect(() => {
    const token = getAuthToken();
    if (!isAuthenticated && !token) {
      const redirectUrl = `/gateway/zalopay?orderId=${orderId || ''}`;
      router.push(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`);
    }
  }, [isAuthenticated, orderId, router]);

  // Read wallet balance from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(BALANCE_STORAGE_KEY);
      if (saved !== null && !isNaN(Number(saved)) && Number(saved) >= 0) {
        setWalletBalance(Number(saved));
      } else {
        localStorage.setItem(BALANCE_STORAGE_KEY, String(DEFAULT_BALANCE));
        setWalletBalance(DEFAULT_BALANCE);
      }
    } catch {
      // fallback
    }
  }, []);

  // Load real order status and createdAt from backend
  useEffect(() => {
    const token = getAuthToken();
    if ((!isAuthenticated && !token) || !orderId) return;
    let cancelled = false;

    const loadOrder = async () => {
      try {
        const res = await apiClient(`/orders/${orderId}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setErrorMessage(
            extractGatewayErrorMessage(data, `Không thể tải thông tin đơn hàng #${orderId} (${res.status})`)
          );
          return;
        }
        const loaded: GatewayOrderInfo = data;
        setOrderInfo(loaded);

        if (PAID_ORDER_STATUSES.has(loaded.status)) {
          clearActivePendingOrder(orderId);
          setStatus('SUCCESS');
          return;
        }

        if (loaded.status === 'CANCELLED') {
          clearActivePendingOrder(orderId);
          setTimeLeft(0);
          setStatus('FAILED');
          setErrorMessage(
            `Đơn hàng #${orderId} đã bị hủy hoặc hết hạn thanh toán (quá 5 phút). Nguyên liệu giữ chỗ đã được hoàn trả.`
          );
          return;
        }

        const rem = calcRemainingFromCreatedAt(loaded.createdAt);
        setTimeLeft(rem);

        if (loaded.status === 'PAYMENT_FAILED') {
          setStatus('FAILED');
          setErrorMessage(
            'Đơn hàng đang ở trạng thái Thanh toán thất bại. Vui lòng quay lại Checkout để thử lại.'
          );
        }
      } catch {
        // fallback
      }
    };

    loadOrder();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, orderId]);

  // Countdown 5-minute timer
  useEffect(() => {
    if (status === 'SUCCESS' || orderInfo?.status === 'CANCELLED') return;
    const orderCreatedAt = orderInfo?.createdAt;
    const timer = setInterval(() => {
      if (orderCreatedAt) {
        setTimeLeft(calcRemainingFromCreatedAt(orderCreatedAt));
      } else {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [status, orderInfo?.createdAt, orderInfo?.status]);

  const isAwaitingExpirySync =
    timeLeft <= 0 &&
    status !== 'SUCCESS' &&
    Boolean(orderId) &&
    (!orderInfo || orderInfo.status === 'PENDING' || orderInfo.status === 'PAYMENT_FAILED');

  // Sync on timeout
  useEffect(() => {
    if (!isAwaitingExpirySync) return;

    let cancelled = false;
    let activeTimer: ReturnType<typeof setTimeout> | null = null;

    const attemptSync = (attemptIndex: number) => {
      if (cancelled) return;
      if (attemptIndex >= EXPIRY_SYNC_BACKOFF_MS.length) {
        setExpirySyncExhaustedKey(String(orderId));
        return;
      }

      activeTimer = setTimeout(async () => {
        if (cancelled) return;
        try {
          const res = await apiClient(`/orders/${orderId}`);
          if (cancelled) return;
          if (res.ok) {
            const data: GatewayOrderInfo = await res.json();
            if (cancelled) return;
            setOrderInfo(data);
            if (PAID_ORDER_STATUSES.has(data.status)) {
              clearActivePendingOrder(orderId);
              setStatus('SUCCESS');
              return;
            }
            if (data.status === 'CANCELLED') {
              clearActivePendingOrder(orderId);
              setTimeLeft(0);
              setStatus('FAILED');
              setErrorMessage(
                `Đơn hàng #${orderId} đã bị hủy hoặc hết hạn thanh toán (quá 5 phút). Nguyên liệu giữ chỗ đã được hoàn trả.`
              );
              return;
            }
          }
        } catch {
          // retry
        }
        if (!cancelled) {
          attemptSync(attemptIndex + 1);
        }
      }, EXPIRY_SYNC_BACKOFF_MS[attemptIndex]);
    };

    attemptSync(0);

    return () => {
      cancelled = true;
      if (activeTimer) clearTimeout(activeTimer);
    };
  }, [isAwaitingExpirySync, orderId]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Redirect on success
  useEffect(() => {
    if (status !== 'SUCCESS') return;

    clearCart();

    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          startTransition(() => {
            router.push(`/orders/${orderId}`);
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, orderId, router, clearCart]);

  // Topup balance
  const handleTopup = (addAmount: number) => {
    if (addAmount <= 0) return;
    const nextBal = walletBalance + addAmount;
    setWalletBalance(nextBal);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(BALANCE_STORAGE_KEY, String(nextBal));
      } catch {}
    }
    setIsTopupModalOpen(false);
    setErrorMessage('');
    setTopupSuccessMsg(`Đã nạp thành công +${vnd(addAmount)} vào ví ZaloPay!`);
    setTimeout(() => setTopupSuccessMsg(''), 3500);
  };

  // Reset balance
  const handleResetBalance = () => {
    setWalletBalance(DEFAULT_BALANCE);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(BALANCE_STORAGE_KEY, String(DEFAULT_BALANCE));
      } catch {}
    }
    setErrorMessage('');
    setTopupSuccessMsg('Đã khôi phục số dư ví về 1.000.000đ');
    setTimeout(() => setTopupSuccessMsg(''), 3000);
  };

  // Confirm payment via POST /payments/zalopay/confirm
  const handleConfirmPayment = async () => {
    if (status === 'PROCESSING' || status === 'SUCCESS' || isCancelling) return;

    if (!orderId) {
      setStatus('FAILED');
      setErrorMessage('Không tìm thấy mã đơn hàng hợp lệ để xác nhận thanh toán.');
      return;
    }

    if (timeLeft <= 0 || orderInfo?.status === 'CANCELLED') {
      setStatus('FAILED');
      setErrorMessage(
        'Đơn hàng đã hết hạn thanh toán (quá 5 phút) hoặc đã bị hủy. Vui lòng quay lại Checkout.'
      );
      return;
    }

    if (amount > walletBalance) {
      setStatus('FAILED');
      const missing = amount - walletBalance;
      setErrorMessage(
        `Giao dịch không thành công do số dư ví ZaloPay (${vnd(walletBalance)}) không đủ (${vnd(amount)}). Thiếu ${vnd(missing)}, vui lòng nạp thêm tiền vào ví.`
      );
      return;
    }

    setStatus('PROCESSING');
    setErrorMessage('');

    try {
      await new Promise((r) => setTimeout(r, 800));

      const res = await apiClient('/payments/zalopay/confirm', {
        method: 'POST',
        body: JSON.stringify({
          orderId,
          appTransId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        const paidAmount = data.totalAmount || amount;
        const newBal = Math.max(0, walletBalance - paidAmount);
        setWalletBalance(newBal);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(BALANCE_STORAGE_KEY, String(newBal));
          } catch {}
        }
        clearActivePendingOrder(orderId);
        setStatus('SUCCESS');
      } else {
        setStatus('FAILED');
        const fallbackMsg =
          res.status === 403
            ? 'Bạn không có quyền xác nhận giao dịch này hoặc cổng Sandbox đang bị giới hạn truy cập (403).'
            : res.status === 409
            ? 'Trạng thái đơn hàng vừa thay đổi bởi thao tác khác. Vui lòng kiểm tra lại.'
            : res.status === 400
            ? 'Đơn hàng đã hết hạn thanh toán (quá 5 phút) hoặc trạng thái không hợp lệ.'
            : 'Xác thực giao dịch từ máy chủ ZaloPay thất bại';
        setErrorMessage(extractGatewayErrorMessage(data, fallbackMsg));
      }
    } catch (err: unknown) {
      setStatus('FAILED');
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể kết nối đến máy chủ Cổng thanh toán ZaloPay'
      );
    }
  };

  // Cancel order via POST /payments/zalopay/cancel
  const handleCancelAndRefund = async () => {
    if (!orderId || status === 'PROCESSING' || isCancelling) return;
    setIsCancelling(true);
    setErrorMessage('');
    try {
      const res = await apiClient('/payments/zalopay/cancel', {
        method: 'POST',
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMessage(
          extractGatewayErrorMessage(data, `Không thể hủy đơn hàng #${orderId} (${res.status})`)
        );
        return;
      }
      clearActivePendingOrder(orderId);
      router.push(`/checkout?orderId=${orderId}&canceled=true`);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Lỗi kết nối khi hủy giao dịch trên ZaloPay.'
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const isInsufficient = amount > walletBalance;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F7FB', color: '#1c1917', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* ── HEADER ZALOPAY GATEWAY ── */}
      <header style={{ background: 'linear-gradient(135deg, #0068FF 0%, #005AE0 50%, #0047BA 100%)', color: '#fff', padding: '12px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }} fill="none">
                <rect width="100" height="100" rx="20" fill="#0068FF" />
                <path d="M25 32H75L35 72H75" stroke="white" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' }}>ZaloPay</span>
                <span style={{ fontSize: 11, textTransform: 'uppercase', fontWeight: 600, opacity: 0.9, borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: 8 }}>
                  Sandbox Gateway
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: '#dbeafe' }}>
                Cổng thanh toán điện tử giả lập VNG Corporation
              </p>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, fontSize: 11 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#a7f3d0', border: '1px solid rgba(52, 211, 153, 0.4)', padding: '4px 10px', borderRadius: 9999, fontWeight: 600 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#34d399' }} />
              Sandbox Active
            </span>
          </div>
        </div>
      </header>

      {/* ── NỘI DUNG CHÍNH ── */}
      <main style={{ flex: 1, maxWidth: 960, width: '100%', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {status === 'SUCCESS' ? (
          /* MÀN HÌNH THÀNH CÔNG */
          <div style={{ maxWidth: 540, width: '100%', margin: '0 auto', backgroundColor: '#fff', borderRadius: 24, padding: 32, boxShadow: '0 20px 40px rgba(0,0,0,0.08)', border: '1px solid #d1fae5', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, margin: '0 auto 16px', borderRadius: '50%', backgroundColor: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={44} strokeWidth={2.5} />
            </div>

            <span style={{ display: 'inline-block', backgroundColor: '#d1fae5', color: '#065f46', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', padding: '4px 12px', borderRadius: 9999, marginBottom: 12, letterSpacing: '0.5px' }}>
              Giao dịch thành công
            </span>

            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1c1917', margin: '0 0 8px 0' }}>
              Thanh toán hoàn tất!
            </h1>
            <p style={{ color: '#57534e', fontSize: 14, margin: '0 0 24px 0' }}>
              Cổng ZaloPay đã xác thực giao dịch thành công và cập nhật trạng thái đơn hàng sang BrewLite Coffee.
            </p>

            <div style={{ backgroundColor: '#fafaf9', borderRadius: 16, padding: 18, border: '1px solid #e7e5e4', textAlign: 'left', marginBottom: 20, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e7e5e4', paddingBottom: 8 }}>
                <span style={{ color: '#78716c' }}>Mã đơn hàng:</span>
                <span style={{ fontWeight: 700, color: '#1c1917' }}>#{orderId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e7e5e4', paddingBottom: 8 }}>
                <span style={{ color: '#78716c' }}>Mã giao dịch ZaloPay:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1c1917' }}>{appTransId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e7e5e4', paddingBottom: 8 }}>
                <span style={{ color: '#78716c' }}>Số tiền thanh toán:</span>
                <span style={{ fontWeight: 800, color: '#0068FF', fontSize: 15 }}>{vnd(amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#78716c' }}>Số dư ví ZaloPay còn lại:</span>
                <span style={{ fontWeight: 700, color: '#059669' }}>{vnd(walletBalance)}</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 14, padding: 12, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#1d4ed8' }}>
              <RefreshCw size={14} className="animate-spin" />
              <span>Tự động chuyển đến BrewLite Coffee sau {redirectCountdown}s...</span>
            </div>

            <button
              type="button"
              onClick={() => {
                clearCart();
                router.push(`/orders/${orderId}`);
              }}
              style={{ width: '100%', padding: '14px 20px', backgroundColor: '#0068FF', color: '#fff', fontWeight: 800, borderRadius: 16, fontSize: 15, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <span>Về BrewLite xem chi tiết đơn hàng</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          /* GIAO DIỆN THANH TOÁN TIÊU CHUẨN */
          <div style={{ backgroundColor: '#fff', borderRadius: 24, boxShadow: '0 16px 36px rgba(0,0,0,0.06)', border: '1px solid #e7e5e4', overflow: 'hidden' }}>
            {/* Header đếm ngược */}
            <div style={{ backgroundColor: '#fffbeb', borderBottom: '1px solid #fde68a', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: '#92400e' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                <Clock size={16} color="#d97706" />
                <span>Thời gian giữ đơn hàng còn lại:</span>
              </div>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 15, color: '#b45309', backgroundColor: '#fff', padding: '2px 10px', borderRadius: 8, border: '1px solid #fef3c7' }}>
                {formatTime(timeLeft)}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
              {/* Cột trái: Đơn hàng & Thụ hưởng */}
              <div style={{ padding: 28, backgroundColor: '#fafaf9', borderRight: '1px solid #e7e5e4', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#78716c', fontWeight: 700 }}>
                    <Building2 size={14} color="#0068FF" />
                    <span>Đơn vị chấp nhận thanh toán</span>
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1c1917', margin: '4px 0 2px 0' }}>
                    Công ty Cổ phần Cà phê BrewLite
                  </h2>
                  <p style={{ margin: 0, fontSize: 12, color: '#78716c' }}>
                    Hệ thống đặt cà phê công nghệ & bánh ngọt cao cấp
                  </p>
                </div>

                <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, border: '1px solid #e7e5e4', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#78716c' }}>Mã đơn hàng:</span>
                    <span style={{ fontWeight: 700, color: '#1c1917' }}>#{orderId}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#78716c' }}>Mã giao dịch:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1c1917' }}>{appTransId}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #e7e5e4', paddingTop: 10 }}>
                    <span style={{ color: '#78716c', fontWeight: 600 }}>Tổng tiền:</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#0068FF' }}>{vnd(amount)}</span>
                  </div>
                </div>

                {topupSuccessMsg && (
                  <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12, padding: 10, color: '#065f46', fontSize: 12, fontWeight: 600 }}>
                    {topupSuccessMsg}
                  </div>
                )}

                {errorMessage && (
                  <div data-testid="payment-error" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 12, color: '#b91c1c', fontSize: 12, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Cột phải: Thông tin ví ZaloPay & Hành động */}
              <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1c1917', margin: '0 0 12px 0' }}>
                    Nguồn tiền thanh toán
                  </h3>

                  {/* Card Ví ZaloPay */}
                  <div style={{ backgroundColor: '#f0f7ff', border: isInsufficient ? '2px solid #ef4444' : '2px solid #0068FF', borderRadius: 16, padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#0068FF', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Wallet size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14, color: '#1c1917' }}>Ví điện tử ZaloPay</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{accountHolder} • {accountPhone}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>
                        Mặc định
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderTop: '1px solid #dbeafe', paddingTop: 10 }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>Số dư khả dụng:</span>
                      <span style={{ fontSize: 17, fontWeight: 800, color: isInsufficient ? '#ef4444' : '#059669' }}>
                        {vnd(walletBalance)}
                      </span>
                    </div>

                    {isInsufficient && (
                      <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                        ⚠️ Số dư không đủ (Thiếu {vnd(amount - walletBalance)})
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => setIsTopupModalOpen(true)}
                      style={{ flex: 1, padding: '8px 12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 10, fontSize: 12, fontWeight: 700, color: '#0068FF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    >
                      <PlusCircle size={14} />
                      <span>Nạp tiền vào ví</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetBalance}
                      style={{ padding: '8px 12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 10, fontSize: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      title="Đặt lại số dư 1.000.000đ"
                    >
                      <RotateCcw size={14} />
                      <span>Đặt lại</span>
                    </button>
                  </div>
                </div>

                {/* Các nút hành động chính */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    disabled={status === 'PROCESSING' || timeLeft <= 0 || isCancelling}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      backgroundColor: status === 'PROCESSING' || timeLeft <= 0 ? '#94a3b8' : '#0068FF',
                      color: '#fff',
                      fontWeight: 800,
                      borderRadius: 16,
                      fontSize: 15,
                      border: 'none',
                      cursor: status === 'PROCESSING' || timeLeft <= 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 4px 12px rgba(0, 104, 255, 0.25)',
                    }}
                  >
                    {status === 'PROCESSING' ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Đang xử lý giao dịch...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        <span>Xác nhận thanh toán ({vnd(amount)})</span>
                      </>
                    )}
                  </button>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={handleCancelAndRefund}
                      disabled={isCancelling || status === 'PROCESSING'}
                      style={{
                        flex: 1,
                        padding: '11px 16px',
                        backgroundColor: '#fff',
                        border: '1px solid #fca5a5',
                        color: '#dc2626',
                        fontWeight: 700,
                        borderRadius: 14,
                        fontSize: 13,
                        cursor: isCancelling ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      {isCancelling ? <RefreshCw size={14} className="animate-spin" /> : <XCircle size={14} />}
                      <span>Hủy đơn &amp; Hoàn kho</span>
                    </button>

                    <Link
                      href={orderId ? `/checkout?orderId=${orderId}` : '/checkout'}
                      style={{
                        padding: '11px 16px',
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        color: '#475569',
                        fontWeight: 700,
                        borderRadius: 14,
                        fontSize: 13,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <ArrowLeft size={14} />
                      <span>Quay lại</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Nạp tiền giả lập */}
        {isTopupModalOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
            <div style={{ backgroundColor: '#fff', borderRadius: 20, maxWidth: 400, width: '100%', padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Nạp tiền vào Ví Sandbox</h3>
                <button
                  type="button"
                  onClick={() => setIsTopupModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[200000, 500000, 1000000, 2000000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleTopup(val)}
                    style={{ padding: '12px 16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#0068FF', cursor: 'pointer', textAlign: 'left' }}
                  >
                    +{vnd(val)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ZaloPayGatewayPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F7FB' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #0068FF', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 14, color: '#64748b' }}>Đang tải Cổng thanh toán ZaloPay...</span>
          </div>
        </div>
      }
    >
      <ZaloPayGatewayContent />
    </Suspense>
  );
}
