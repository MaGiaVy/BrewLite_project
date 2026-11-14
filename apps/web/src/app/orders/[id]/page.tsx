'use client';

import React, { use, useEffect, useRef, useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../lib/api-client';
import { useOrderPolling } from '../../../hooks/use-order-polling';
import { useAuthStore } from '../../../stores/auth-store';
import { useCartStore } from '../../../stores/cart-store';

const ORDER_STEPS = [
  { key: 'PAID', label: '1. Đã thanh toán', desc: 'Đơn đã ghi nhận & gửi quầy Barista' },
  { key: 'PREPARING', label: '2. Đang pha chế', desc: 'Barista đang đong nguyên liệu & chiết xuất' },
  { key: 'READY', label: '3. Sẵn sàng lấy nước', desc: 'Mời bạn tới Kệ Express Bar 04 nhận đồ uống' },
  { key: 'COMPLETED', label: '4. Đã hoàn tất', desc: 'Bàn giao thành công & cộng điểm Hạt Vàng' },
];

function getStepIndex(status: string): number {
  switch (status) {
    case 'PENDING':
      return -1;
    case 'PAID':
      return 0;
    case 'PREPARING':
      return 1;
    case 'READY':
      return 2;
    case 'COMPLETED':
      return 3;
    default:
      return 0;
  }
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  const { order, error, isPolling } = useOrderPolling(orderId, 5000);
  const { user } = useAuthStore();
  const rawTotalCartCount = useCartStore((s) => s.getTotalCount());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalCartCount = mounted ? rawTotalCartCount : 0;

  const prevStatusRef = useRef<string | null>(null);

  // Chime sound notification
  const playPickupChime = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      [587.33, 880, 1174.66].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);
        gain.gain.setValueAtTime(0.001, now + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.14 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 0.38);
      });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (order?.status) {
      if (prevStatusRef.current && prevStatusRef.current !== order.status) {
        if (order.status === 'READY' || order.status === 'COMPLETED') {
          playPickupChime();
        }
      }
      prevStatusRef.current = order.status;
    }
  }, [order?.status, playPickupChime]);

  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);

  const handleCancelOrder = async () => {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này không? Nguyên liệu giữ chỗ sẽ được hoàn trả về kho.')) {
      return;
    }
    setIsCancelling(true);
    try {
      const res = await apiClient(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Không thể hủy đơn hàng.');
      }
      setCancelFeedback('Đã hủy đơn hàng thành công trong thời gian 5 phút cho phép.');
      setTimeout(() => {
        router.push('/orders');
      }, 1500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi hủy đơn hàng.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (!order && !error) {
    return (
      <main
        style={{
          maxWidth: 480,
          margin: '0 auto',
          padding: '48px 16px',
          textAlign: 'center',
          fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
          backgroundColor: '#fef8f4',
          minHeight: '100vh',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #845326', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
        <p style={{ color: '#786c67', fontSize: 14 }}>Đang tải trạng thái đơn hàng #{orderId}...</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main
        style={{
          maxWidth: 480,
          margin: '0 auto',
          padding: '48px 16px',
          textAlign: 'center',
          fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
          backgroundColor: '#fef8f4',
          minHeight: '100vh',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#b91c1c', margin: '0 0 8px 0' }}>Không thể tải đơn hàng</h2>
          <p style={{ color: '#7f1d1d', fontSize: 13, margin: '0 0 16px 0' }}>{error || 'Không tìm thấy thông tin đơn hàng.'}</p>
          <Link
            href="/orders"
            style={{
              padding: '10px 18px',
              borderRadius: 12,
              backgroundColor: '#845326',
              color: '#ffffff',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: 13,
              display: 'inline-block',
            }}
          >
            Quay lại Lịch sử đơn
          </Link>
        </div>
      </main>
    );
  }

  const displayOrder = order;
  const status = displayOrder.status;
  const currentStep = getStepIndex(status);
  const isCancelled = status === 'CANCELLED';
  const isReady = status === 'READY';
  const isPending = status === 'PENDING';
  const isCancelEligible =
    order &&
    (order.status === 'PENDING' || order.status === 'PAID') &&
    order.createdAt &&
    Date.now() - new Date(order.createdAt).getTime() <= 5 * 60 * 1000;

  return (
    <main
      style={{
        maxWidth: 480,
        margin: '0 auto',
        padding: '16px 16px 96px 16px',
        fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
        backgroundColor: '#fef8f4',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Bar Navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <Link
          href="/orders"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 9999,
            background: '#f3ede9',
            color: '#2c1810',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            arrow_back
          </span>
          <span>Lịch sử đơn</span>
        </Link>

        {isPolling && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#fef3c7',
              color: '#92400e',
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 9999,
              border: '1px solid #fde68a',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#b45309',
                display: 'inline-block',
              }}
            />
            Live Polling 5s
          </span>
        )}
      </div>

      {error && (
        <div
          role="alert"
          style={{
            background: '#fef2f2',
            color: '#b91c1c',
            padding: '10px 14px',
            borderRadius: 12,
            fontSize: 13,
            marginBottom: 16,
            border: '1px solid #fecaca',
          }}
        >
          {error}
        </div>
      )}

      {/* Prominent Callout when READY */}
      {isReady && (
        <section
          style={{
            background: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
            color: '#ffffff',
            borderRadius: 20,
            padding: 16,
            marginBottom: 18,
            boxShadow: '0 8px 20px -4px rgba(5, 150, 105, 0.4)',
            border: '1.5px solid #6ee7b7',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: '#ffffff',
                color: '#047857',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 26 }}>
                notifications_active
              </span>
            </div>
            <div>
              <span
                style={{
                  background: 'rgba(255,255,255,0.25)',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 9999,
                }}
              >
                ĐÃ HOÀN TẤT PHA CHẾ
              </span>
              <h2 style={{ margin: '2px 0 0 0', fontSize: 17, fontWeight: 800 }}>
                Đồ uống đã sẵn sàng tại quầy!
              </h2>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: '#ecfdf5', lineHeight: 1.4 }}>
            Mời bạn di chuyển đến <strong>Kệ Express Bar số 04</strong> và xuất trình
            mã QR nhận nước bên dưới.
          </p>
        </section>
      )}

      {/* ── INTERACTIVE PICKUP TICKET & SIMULATED QR CODE ── */}
      <section
        style={{
          background: '#ffffff',
          borderRadius: 20,
          border: '1px solid #e7e1dd',
          padding: 18,
          marginBottom: 18,
          boxShadow: '0 4px 16px rgba(44, 24, 16, 0.06)',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: 11, color: '#786c67', textTransform: 'uppercase', fontWeight: 700 }}>
              Vé nhận nước điện tử
            </span>
            <h1
              style={{
                fontFamily: "'Epilogue', sans-serif",
                fontSize: 22,
                fontWeight: 800,
                color: '#2c1810',
                margin: 0,
              }}
            >
              #BL-{orderId}
            </h1>
          </div>

          <span
            data-testid="order-status"
            style={{
              padding: '4px 10px',
              borderRadius: 9999,
              fontSize: 11,
              fontWeight: 800,
              background: isReady ? '#059669' : isCancelled ? '#b91c1c' : '#2c1810',
              color: '#ffffff',
            }}
          >
            {status}
          </span>
        </div>

        {/* QR Code Mockup Frame */}
        <div
          style={{
            background: '#fcfaf8',
            borderRadius: 16,
            padding: 16,
            border: '2px dashed #ded4cc',
            margin: '12px auto',
            maxWidth: 240,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 140,
              height: 140,
              background: '#2c1810',
              borderRadius: 12,
              padding: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            }}
          >
            {/* Visual SVG QR Pattern */}
            <svg
              viewBox="0 0 100 100"
              style={{ width: '100%', height: '100%', fill: '#ffffff' }}
            >
              <rect x="0" y="0" width="30" height="30" rx="4" />
              <rect x="5" y="5" width="20" height="20" fill="#2c1810" />
              <rect x="10" y="10" width="10" height="10" />
              <rect x="70" y="0" width="30" height="30" rx="4" />
              <rect x="75" y="5" width="20" height="20" fill="#2c1810" />
              <rect x="80" y="10" width="10" height="10" />
              <rect x="0" y="70" width="30" height="30" rx="4" />
              <rect x="5" y="75" width="20" height="20" fill="#2c1810" />
              <rect x="10" y="80" width="10" height="10" />
              <rect x="40" y="10" width="20" height="10" />
              <rect x="40" y="40" width="20" height="20" />
              <rect x="70" y="40" width="10" height="20" />
              <rect x="10" y="40" width="15" height="10" />
              <rect x="40" y="75" width="30" height="15" />
              <rect x="80" y="75" width="15" height="15" />
            </svg>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#845326', marginTop: 10 }}>
            Quét mã tại Kệ Express Bar số 04
          </span>
          <span style={{ fontSize: 10, color: '#786c67', marginTop: 2 }}>
            Khách hàng: {user?.fullName || 'Khách đặt qua Web Mobile'}
          </span>
        </div>

        {/* Barista & Station Info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            paddingTop: 10,
            borderTop: '1px solid #f3ede9',
            fontSize: 12,
          }}
        >
          <div>
            <span style={{ color: '#786c67', display: 'block', fontSize: 10 }}>ĐỊA ĐIỂM</span>
            <strong style={{ color: '#2c1810' }}>Trạm 01 • Express Bar</strong>
          </div>
          <div style={{ width: 1, height: 24, background: '#eee' }} />
          <div>
            <span style={{ color: '#786c67', display: 'block', fontSize: 10 }}>BARISTA</span>
            <strong style={{ color: '#845326' }}>
              👨‍🍳 {displayOrder.staffName || 'Hoàng Nam'}
            </strong>
          </div>
        </div>
      </section>

      {/* ── TIẾN TRÌNH PHA CHẾ (TIMELINE STEPPER) ── */}
      <section
        style={{
          background: '#ffffff',
          borderRadius: 20,
          border: '1px solid #e7e1dd',
          padding: 18,
          marginBottom: 18,
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        <h3
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: '#2c1810',
            margin: '0 0 16px 0',
          }}
        >
          Tiến trình đơn hàng
        </h3>

        {isCancelled ? (
          <div
            style={{
              background: '#fee2e2',
              color: '#b91c1c',
              padding: 14,
              borderRadius: 12,
              textAlign: 'center',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            Đơn hàng này đã bị hủy tại quầy hoặc hết thời gian thanh toán.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {ORDER_STEPS.map((step, idx) => {
              const isDone = idx < currentStep;
              const isCurrent = idx === currentStep;

              return (
                <div
                  key={step.key}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      background: isDone
                        ? '#047857'
                        : isCurrent
                        ? isReady
                          ? '#059669'
                          : '#2c1810'
                        : '#ede7e3',
                      color: isDone || isCurrent ? '#ffffff' : '#786c67',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 800,
                      flexShrink: 0,
                      boxShadow: isCurrent ? '0 0 0 4px rgba(44, 24, 16, 0.12)' : 'none',
                    }}
                  >
                    {isDone ? (
                      '✓'
                    ) : isCurrent && step.key === 'PREPARING' ? (
                      <span className="material-symbols-outlined animate-spin" style={{ fontSize: 18 }}>
                        autorenew
                      </span>
                    ) : isCurrent && step.key === 'READY' ? (
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        notifications_active
                      </span>
                    ) : (
                      idx + 1
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: isCurrent ? 800 : 600,
                        color: isCurrent || isDone ? '#2c1810' : '#887d77',
                      }}
                    >
                      {step.label}
                    </div>
                    <div style={{ fontSize: 12, color: '#786c67', marginTop: 2 }}>
                      {step.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── CHI TIẾT MÓN TRONG ĐƠN ── */}
      {displayOrder.items && displayOrder.items.length > 0 && (
        <section
          style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e7e1dd',
            padding: 16,
            marginBottom: 18,
          }}
        >
          <h3
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: '#2c1810',
              margin: '0 0 12px 0',
            }}
          >
            Chi tiết thức uống ({displayOrder.items.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {displayOrder.items.map((it, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 14,
                  paddingBottom: 8,
                  borderBottom:
                    i < (displayOrder.items?.length ?? 0) - 1
                      ? '1px dashed #eee'
                      : 'none',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#2c1810' }}>
                    {it.name}{' '}
                    <span style={{ color: '#845326', fontWeight: 800 }}>
                      ×{it.quantity}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#786c67', marginTop: 2 }}>
                    Size {it.size || 'M'}
                  </div>
                </div>
                <div style={{ fontWeight: 800, color: '#2c1810' }}>
                  {(it.unitPrice * it.quantity).toLocaleString('vi-VN')} ₫
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── TÓM TẮT THANH TOÁN ── */}
      <section
        style={{
          background: '#ffffff',
          borderRadius: 20,
          border: '1px solid #e7e1dd',
          padding: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
          <span style={{ color: '#786c67' }}>Tổng tiền thức uống:</span>
          <span style={{ fontWeight: 700 }}>
            {Number(displayOrder.totalAmount ?? 0).toLocaleString('vi-VN')} ₫
          </span>
        </div>

        {Boolean(displayOrder.discountAmount && displayOrder.discountAmount > 0) && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 13,
              marginBottom: 8,
              color: '#047857',
            }}
          >
            <span>Giảm giá voucher:</span>
            <span>-{Number(displayOrder.discountAmount).toLocaleString('vi-VN')} ₫</span>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 16,
            fontWeight: 800,
            color: '#845326',
            paddingTop: 8,
            borderTop: '1px solid #f3ede9',
          }}
        >
          <span>Thực thanh toán:</span>
          <span>
            {Number(displayOrder.finalAmount ?? displayOrder.totalAmount ?? 0).toLocaleString(
              'vi-VN',
            )}{' '}
            ₫
          </span>
        </div>

        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: '1px dashed #f0ece8',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12,
            color: '#786c67',
          }}
        >
          <span>Hạt tích lũy nhận được:</span>
          <span style={{ color: '#845326', fontWeight: 700 }}>
            +{Math.floor(Number(displayOrder.finalAmount ?? displayOrder.totalAmount ?? 0) / 1000)} Hạt Vàng
          </span>
        </div>
      </section>

      {/* ── HÀNH ĐỘNG DƯỚI CÙNG ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isPending && (
          <Link
            href={`/checkout?orderId=${orderId}`}
            style={{
              minHeight: 46,
              borderRadius: 12,
              background: '#845326',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              payments
            </span>
            <span>Thanh toán đơn ngay</span>
          </Link>
        )}

        <Link
          href="/menu"
          style={{
            minHeight: 46,
            borderRadius: 12,
            background: '#2c1810',
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 700,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            coffee
          </span>
          <span>Đặt thêm món khác</span>
        </Link>

        {cancelFeedback && (
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 12,
              color: '#065f46',
              fontSize: 13,
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            {cancelFeedback}
          </div>
        )}

        {isCancelEligible && (
          <button
            type="button"
            onClick={handleCancelOrder}
            disabled={isCancelling}
            style={{
              minHeight: 46,
              borderRadius: 12,
              backgroundColor: '#fff',
              border: '1.5px solid #fca5a5',
              color: '#dc2626',
              fontSize: 13,
              fontWeight: 700,
              cursor: isCancelling ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              cancel
            </span>
            <span>{isCancelling ? 'Đang hủy đơn...' : 'Hủy đơn hàng (5 phút cho phép)'}</span>
          </button>
        )}
      </div>

      {/* ── FIXED MOBILE BOTTOM NAVIGATION BAR ── */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: 'rgba(254, 248, 244, 0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(231, 225, 221, 0.85)',
          height: 64,
        }}
      >
        <div
          style={{
            maxWidth: 480,
            margin: '0 auto',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            padding: '0 8px',
          }}
        >
          <Link
            href="/menu"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: '#6b5c56',
              textDecoration: 'none',
              fontSize: 11,
              fontWeight: 500,
              gap: 2,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              coffee
            </span>
            <span>Thực đơn</span>
          </Link>

          <Link
            href="/cart"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: '#6b5c56',
              textDecoration: 'none',
              fontSize: 11,
              fontWeight: 500,
              gap: 2,
              position: 'relative',
            }}
          >
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                shopping_cart
              </span>
              {totalCartCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -9,
                    background: '#ba1a1a',
                    color: '#fff',
                    fontSize: 9,
                    fontWeight: 800,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 3px',
                  }}
                >
                  {totalCartCount}
                </span>
              )}
            </div>
            <span>Giỏ hàng</span>
          </Link>

          <Link
            href="/orders"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: '#2c1810',
              textDecoration: 'none',
              fontSize: 11,
              fontWeight: 700,
              gap: 2,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}
            >
              receipt_long
            </span>
            <span>Đơn hàng</span>
          </Link>

          <Link
            href="/menu"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: '#6b5c56',
              textDecoration: 'none',
              fontSize: 11,
              fontWeight: 500,
              gap: 2,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              account_circle
            </span>
            <span>Tài khoản</span>
          </Link>
        </div>
      </nav>
    </main>
  );
}
