'use client';

import React, { use, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Bell,
  Check,
  Clock,
  Coffee,
  Copy,
  Flame,
  History,
  RefreshCw,
  Snowflake,
  Sparkles,
  Store,
  X,
} from 'lucide-react';
import { useOrderPolling, type OrderDetail, type OrderDetailItem } from '../../../hooks/use-order-polling';
import { useCartStore } from '../../../stores/cart-store';
import { MOCK_PRODUCTS } from '../../../data/mock-products';
import styles from './confirmation/confirmation.module.css';

interface MergedOrderItem extends OrderDetailItem {
  toppings: string[];
}

function getItemImage(productId?: string | number, productName?: string, customImage?: string | null): string {
  if (customImage && (customImage.startsWith('/') || customImage.startsWith('http'))) {
    return customImage;
  }
  if (productId) {
    const byId = MOCK_PRODUCTS.find((p) => String(p.id) === String(productId));
    if (byId?.imageUrl) return byId.imageUrl;
  }
  const norm = (productName || '').normalize('NFC').toLowerCase().trim();
  const byName = MOCK_PRODUCTS.find((p) => p.name.normalize('NFC').toLowerCase().trim() === norm);
  if (byName?.imageUrl) return byName.imageUrl;

  if (norm.includes('muối') || norm.includes('muoi')) return '/images/products/ca-phe-muoi.png';
  if (norm.includes('bạc xỉu') || norm.includes('bac xiu')) return '/images/products/ca-phe-bac-xiu.png';
  if (norm.includes('sữa') || norm.includes('sua')) return '/images/products/ca-phe-sua.png';
  if (norm.includes('đen') || norm.includes('den')) return '/images/products/ca-phe-den.png';
  if (norm.includes('macchiato')) return '/images/products/iced-caramel-macchiato.png';
  if (norm.includes('matcha')) return '/images/products/matcha-latte.png';
  if (norm.includes('đào') || norm.includes('cam sả')) return '/images/products/tra-dao-cam-sa.png';
  if (norm.includes('pain') || norm.includes('chocolat')) return '/images/products/pain-au-chocolat.png';
  if (norm.includes('cheesecake')) return '/images/products/basque-burnt-cheesecake.png';
  if (norm.includes('tiramisu')) return '/images/products/classic-tiramisu.png';

  return '/images/products/ca-phe-sua.png';
}

function formatIceLevel(ice?: string): string {
  if (!ice) return '100% đá';
  const val = ice.trim();
  if (val.includes('100%')) return '100% đá';
  if (val.includes('70%')) return '70% đá';
  if (val.includes('50%')) return '50% đá';
  if (val.includes('0%') || val.toLowerCase().includes('không') || val.toLowerCase().includes('khong')) {
    return 'Không đá';
  }
  return val.endsWith('đá') ? val : `${val} đá`;
}

function formatSugarLevel(sugar?: string): string {
  if (!sugar) return '100% đường';
  const val = sugar.trim();
  if (val === '0%' || val.toLowerCase().includes('không') || val.toLowerCase().includes('khong')) {
    return 'Không đường';
  }
  if (val.endsWith('%')) return `${val} đường`;
  if (!val.toLowerCase().includes('đường') && !val.toLowerCase().includes('duong')) {
    return `${val} đường`;
  }
  return val;
}

function normalizeToppings(raw?: string[] | string): string[] {
  if (Array.isArray(raw)) {
    return raw.map((t) => String(t).trim()).filter(Boolean);
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      return raw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function formatPaymentMethod(method?: string): string {
  if (!method) return 'Ví điện tử';
  const upper = method.toUpperCase();
  if (upper === 'ZALOPAY') return 'Ví ZaloPay';
  if (upper === 'MOMO' || upper === 'WALLET' || upper === 'EWALLET') return 'Ví điện tử';
  if (upper === 'CARD' || upper === 'BANK_CARD') return 'Thẻ ngân hàng';
  if (upper === 'APPLE_PAY') return 'Apple Pay';
  return method;
}

const formatVND = (n: number) => `${(n || 0).toLocaleString('vi-VN')} ₫`;

interface StatusUiConfig {
  badge: string;
  pillText: string;
  headline: string;
  variant: '' | 'ready' | 'completed' | 'cancelled' | 'pending';
  etaText: string;
}

const STATUS_UI_MAP: Record<string, StatusUiConfig> = {
  PENDING: {
    badge: 'PENDING • CHỜ THANH TOÁN',
    pillText: 'Đơn hàng đang chờ thanh toán',
    headline: 'Chờ hoàn tất thanh toán',
    variant: 'pending',
    etaText: 'Giữ chỗ 5 phút',
  },
  PAID: {
    badge: 'PAID • ĐÃ THANH TOÁN',
    pillText: 'Giao dịch không tiền mặt thành công',
    headline: 'Đặt hàng thành công!',
    variant: '',
    etaText: '~3 - 5 phút',
  },
  PREPARING: {
    badge: 'PREPARING • ĐANG PHA CHẾ',
    pillText: 'Barista đang pha chế trực tiếp',
    headline: 'Barista đang pha chế món của bạn!',
    variant: '',
    etaText: '~2 - 3 phút',
  },
  READY: {
    badge: 'READY • MỜI LẤY NƯỚC',
    pillText: 'Quầy Barista đang gọi bạn nhận món!',
    headline: 'Đồ uống đã sẵn sàng lấy!',
    variant: 'ready',
    etaText: 'Sẵn sàng ngay',
  },
  COMPLETED: {
    badge: 'COMPLETED • ĐÃ HOÀN TẤT',
    pillText: 'Đã bàn giao đồ uống hoàn tất',
    headline: 'Đã nhận nước thành công!',
    variant: 'completed',
    etaText: 'Đã bàn giao',
  },
  CANCELLED: {
    badge: 'CANCELLED • ĐÃ HỦY',
    pillText: 'Đơn hàng đã bị hủy',
    headline: 'Đơn hàng đã bị hủy',
    variant: 'cancelled',
    etaText: 'Đã hủy',
  },
  PAYMENT_FAILED: {
    badge: 'CANCELLED • LỖI THANH TOÁN',
    pillText: 'Thanh toán không thành công',
    headline: 'Đặt hàng thất bại',
    variant: 'cancelled',
    etaText: 'Không khả dụng',
  },
};

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  const { order, error, isPolling } = useOrderPolling(orderId, 5000);
  const rawTotalCartCount = useCartStore((s) => s.getTotalCount());

  const [mounted, setMounted] = useState(false);
  const [localSnapshot, setLocalSnapshot] = useState<OrderDetail | null>(null);
  const [localCustomizations, setLocalCustomizations] = useState<OrderDetailItem[]>([]);
  const [copied, setCopied] = useState(false);
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined' || !orderId) return;
    try {
      const saved = localStorage.getItem(`order_details_${orderId}`);
      if (saved) setLocalSnapshot(JSON.parse(saved) as OrderDetail);
      const savedCustoms = localStorage.getItem(`order_customizations_${orderId}`);
      if (savedCustoms) {
        const parsed = JSON.parse(savedCustoms);
        if (Array.isArray(parsed)) setLocalCustomizations(parsed);
      }
    } catch {
      // ignore corrupted snapshot
    }
  }, [orderId]);

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
      // Audio context might be blocked before user gesture
    }
  }, []);

  useEffect(() => {
    if (!order?.status) return;
    if (prevStatusRef.current && prevStatusRef.current !== order.status) {
      if (order.status === 'READY' || order.status === 'COMPLETED') {
        playPickupChime();
      }
    }
    prevStatusRef.current = order.status;
  }, [order?.status, playPickupChime]);

  const handleCopyOrderId = () => {
    if (!orderId) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        void navigator.clipboard.writeText(String(orderId));
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard restrictions
    }
  };

  const totalCartCount = mounted ? rawTotalCartCount : 0;
  const displayOrder = order ?? localSnapshot;

  if (!displayOrder && !error) {
    return (
      <main className={styles.container}>
        <div style={{ margin: 'auto', textAlign: 'center', padding: '60px 0' }}>
          <div
            style={{
              width: 36,
              height: 36,
              border: '3px solid #e7ded5',
              borderTopColor: '#2c1810',
              borderRadius: '50%',
              margin: '0 auto 12px auto',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <p style={{ color: '#786c67', fontSize: 13 }}>
            Đang tải trạng thái đơn hàng #{orderId}...
          </p>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </main>
    );
  }

  if (!displayOrder) {
    return (
      <main className={styles.container}>
        <div
          style={{
            maxWidth: 440,
            margin: '48px auto',
            textAlign: 'center',
            padding: 24,
            backgroundColor: '#ffffff',
            borderRadius: 20,
            border: '1px solid #fecaca',
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#b91c1c', margin: '0 0 8px 0' }}>
            Không thể tải đơn hàng #{orderId}
          </h2>
          <p style={{ color: '#7f1d1d', fontSize: 13, margin: '0 0 20px 0' }}>
            {error || 'Không tìm thấy thông tin đơn hàng hoặc phiên làm việc đã hết hạn.'}
          </p>
          <Link href="/orders" className={styles.primaryBtn}>
            <History size={17} />
            <span>Quay lại Lịch sử đơn</span>
          </Link>
        </div>
      </main>
    );
  }

  const rawItems =
    displayOrder.items && displayOrder.items.length > 0
      ? displayOrder.items
      : localSnapshot?.items || [];

  const mergedItems: MergedOrderItem[] = rawItems.map((it, idx) => {
    const localIt = localSnapshot?.items?.[idx];
    const localCust =
      localCustomizations[idx] ||
      localCustomizations.find((c) => String(c.productId) === String(it.productId));
    const apiToppings = normalizeToppings(it.toppings);
    const fallbackToppings = normalizeToppings(localIt?.toppings);

    return {
      ...it,
      productName: it.productName || it.name || localIt?.productName || localIt?.name || 'Đồ uống BrewLite',
      toppings: apiToppings.length > 0 ? apiToppings : fallbackToppings,
      temperature: it.temperature || localCust?.temperature || localIt?.temperature,
      servingStyle: it.servingStyle || localCust?.servingStyle || localIt?.servingStyle,
      iceLevel: it.iceLevel || localCust?.iceLevel || localIt?.iceLevel,
      sugarLevel: it.sugarLevel || localCust?.sugarLevel || localIt?.sugarLevel,
      notes: it.notes || localCust?.notes || localIt?.notes,
      isBakery: it.isBakery !== undefined ? it.isBakery : (localCust?.isBakery ?? localIt?.isBakery),
      imageUrl: it.imageUrl || localIt?.imageUrl,
    };
  });

  const status = displayOrder.status || 'PAID';
  const statusUi = STATUS_UI_MAP[status] ?? STATUS_UI_MAP.PAID;
  const isReady = status === 'READY';
  const isPreparing = status === 'PREPARING';
  const isCompleted = status === 'COMPLETED';
  const isPending = status === 'PENDING';
  const isCancelled = status === 'CANCELLED' || status === 'PAYMENT_FAILED';
  const isPaidOrBeyond = status === 'PAID' || isPreparing || isReady || isCompleted;

  const computedItemsSubtotal = mergedItems.reduce(
    (acc, it) => acc + Number(it.unitPrice || 0) * Number(it.quantity || 1),
    0,
  );
  const finalTotal = Number(
    displayOrder.finalAmount ?? displayOrder.totalAmount ?? localSnapshot?.totalAmount ?? computedItemsSubtotal,
  );
  const discountAmount = Number(
    displayOrder.discountAmount ?? localSnapshot?.discountAmount ?? 0,
  );
  const discountCode = displayOrder.discountCode ?? localSnapshot?.discountCode ?? null;
  const subtotal = Number(
    displayOrder.subtotal ??
    localSnapshot?.subtotal ??
    (computedItemsSubtotal > 0 ? computedItemsSubtotal : finalTotal + discountAmount),
  );
  const totalCups = mergedItems.reduce((acc, it) => acc + Number(it.quantity || 1), 0);
  const loyaltyPoints = !isCancelled && !isPending ? Math.floor(finalTotal / 1000) : 0;

  const paymentMethodLabel = formatPaymentMethod(
    localSnapshot?.paymentMethod ||
    displayOrder.paymentMethod ||
    displayOrder.payments?.[0]?.method,
  );

  const formattedTime = displayOrder.createdAt
    ? new Date(displayOrder.createdAt).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }) + ' Hôm nay'
    : 'Hôm nay';

  return (
    <main className={styles.container}>
      <div className={styles.ambientGlow} />

      {/* Top Navigation & Live Sync Badge */}
      <div className={styles.topNavBar}>
        <Link href="/orders" className={styles.backBtn}>
          <ArrowLeft size={16} strokeWidth={2.2} />
          <span>Lịch sử đơn</span>
        </Link>

        {isPolling && !isCancelled && !isCompleted && (
          <span className={styles.pollingBadge}>
            <span className={styles.pollingDot} />
            <span>Live Polling 5s</span>
          </span>
        )}
      </div>

      {error && (
        <div role="alert" className={styles.inlineErrorBanner}>
          {error}
        </div>
      )}

      <div className={styles.contentWrapper}>
        {/* Animated Status Icon + Loyalty Reward Chip */}
        <div className={styles.iconContainer}>
          <div className={styles.iconPulseRing} />
          <div className={styles.iconCircle}>
            <div
              className={`${styles.iconInner} ${statusUi.variant ? styles[statusUi.variant] : ''
                }`}
            >
              {isCancelled ? (
                <X size={26} strokeWidth={2.5} />
              ) : isPending ? (
                <Clock size={26} strokeWidth={2.3} />
              ) : isReady ? (
                <Bell size={26} strokeWidth={2.4} />
              ) : (
                <Check size={28} strokeWidth={2.6} />
              )}
            </div>
          </div>

          {!isCancelled && !isPending && (
            <div className={styles.loyaltyFloatingBadge}>
              <Sparkles size={12} strokeWidth={2.4} />
              <span>+{loyaltyPoints} Hạt Vàng</span>
            </div>
          )}
        </div>

        {/* Live Status Pill */}
        <div
          className={`${styles.statusPill} ${isReady ? styles.ready : isCancelled ? styles.cancelled : ''
            }`}
        >
          <span
            className={`${styles.pingDot} ${isReady ? styles.ready : isCancelled ? styles.cancelled : ''
              }`}
          />
          <span>{statusUi.pillText}</span>
        </div>

        {/* Headline & Subheadline */}
        <h1 className={styles.headline}>{statusUi.headline}</h1>

        <p className={styles.subheadline}>
          {isCancelled ? (
            <>
              Đơn hàng <strong>#BL-{orderId}</strong> đã bị hủy hoặc hết hạn thanh toán.
            </>
          ) : isPending ? (
            <>
              Đơn hàng <strong>#BL-{orderId}</strong> đang được giữ chỗ nguyên liệu. Vui lòng hoàn tất thanh toán để Barista pha chế ngay.
            </>
          ) : isReady ? (
            <>
              Mời bạn di chuyển đến{' '}
              <strong style={{ color: '#059669' }}>Kệ Express Bar số 04</strong> và đọc mã đơn{' '}
              <strong>#BL-{orderId}</strong> để nhận nước ngay.
            </>
          ) : isPreparing ? (
            <>
              Barista tại <strong>BrewLite Downtown Roastery</strong> đã tiếp nhận đơn và đang chiết xuất đồ uống tươi.
            </>
          ) : (
            <>
              Cảm ơn bạn đã lựa chọn trải nghiệm tự động &amp; không tiền mặt tại{' '}
              <strong>BrewLite Downtown Roastery</strong>.
            </>
          )}
        </p>

        {/* Boarding Pass Ticket Card */}
        <div className={styles.ticketCard}>
          <div
            className={`${styles.topRibbon} ${statusUi.variant && statusUi.variant !== 'completed' ? styles[statusUi.variant] : ''
              }`}
          />

          {/* Ticket Header */}
          <div className={styles.ticketHeader}>
            <div>
              <span className={styles.orderNumberLabel}>Mã số đơn hàng (Xuất trình tại quầy)</span>
              <div className={styles.orderIdRow}>
                <span className={styles.orderIdText}>#BL-{orderId}</span>
                <button
                  type="button"
                  onClick={handleCopyOrderId}
                  className={styles.copyButton}
                  title="Sao chép mã đơn"
                >
                  {copied ? (
                    <>
                      <Check size={12} strokeWidth={2.4} />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} strokeWidth={2} />
                      <span>Chép mã</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <span
                data-testid="order-status"
                className={`${styles.statusBadge} ${statusUi.variant && statusUi.variant !== 'completed' ? styles[statusUi.variant] : ''
                  }`}
              >
                {statusUi.badge}
              </span>
              <div className={styles.orderMetaRow}>
                <span className={styles.paymentTag}>{paymentMethodLabel}</span>
                <span>{formattedTime}</span>
              </div>
            </div>
          </div>

          {/* 2-Column Boarding Info Strip */}
          <div className={styles.ticketMetaGrid}>
            <div className={styles.ticketMetaCell}>
              <span className={styles.ticketMetaLabel}>Thời gian đặt</span>
              <span className={styles.ticketMetaValue}>{formattedTime}</span>
            </div>
            <div className={styles.ticketMetaCell}>
              <span className={styles.ticketMetaLabel}>Dự kiến có nước</span>
              <span className={styles.ticketMetaValue}>{statusUi.etaText}</span>
            </div>
          </div>

          {/* Express Station Banner */}
          <div className={`${styles.expressCard} ${isReady ? styles.ready : ''}`}>
            <div className={`${styles.expressIconWrapper} ${isReady ? styles.ready : ''}`}>
              <Store size={22} strokeWidth={2} />
            </div>
            <div>
              <div className={styles.expressTitle}>
                {isReady
                  ? 'Mời bạn nhận đồ uống tại Kệ Express Bar số 04!'
                  : 'Downtown Roastery Bar - 124 Lê Lợi, Bến Nghé, Q.1'}
              </div>
              <div className={styles.expressDesc}>
                {isReady
                  ? 'Ly nước của bạn đã hoàn thiện và đặt sẵn trên kệ trả món Express Pickup.'
                  : 'Vị trí nhận nước: Kệ Express Bar số 04 • Trạm Barista #01'}
              </div>
            </div>
          </div>

          {/* Stepper Tracker */}
          {!isCancelled && (
            <div className={styles.stepperSection}>
              <div className={styles.stepperHeader}>
                <span className={styles.stepperTitle}>Tiến trình phục vụ</span>
                <span className={styles.stepperStation}>Trạm Barista KDS #01</span>
              </div>
              <div className={styles.stepperGrid}>
                {/* Step 1: Đã thanh toán */}
                <div className={styles.stepperItem}>
                  <div className={styles.stepperBar}>
                    {isPaidOrBeyond ? <div className={styles.stepperBarFilled} /> : null}
                  </div>
                  <span className={styles.stepperLabel}>
                    {isPaidOrBeyond && <Check size={11} strokeWidth={2.4} style={{ color: '#059669' }} />}
                    <span>1. Đã thanh toán</span>
                  </span>
                </div>

                {/* Step 2: Đang pha chế */}
                <div className={styles.stepperItem}>
                  <div className={styles.stepperBar}>
                    {isPreparing ? (
                      <div className={styles.stepperBarActive} />
                    ) : isReady || isCompleted ? (
                      <div className={styles.stepperBarFilled} />
                    ) : null}
                  </div>
                  <span className={`${styles.stepperLabel} ${isPreparing ? styles.active : ''}`}>
                    {isPreparing ? (
                      <RefreshCw size={11} strokeWidth={2.4} />
                    ) : isReady || isCompleted ? (
                      <Check size={11} strokeWidth={2.4} style={{ color: '#059669' }} />
                    ) : null}
                    <span>2. Đang pha chế</span>
                  </span>
                </div>

                {/* Step 3: Sẵn sàng lấy */}
                <div className={styles.stepperItem}>
                  <div className={styles.stepperBar}>
                    {isReady ? (
                      <div className={styles.stepperBarReady} />
                    ) : isCompleted ? (
                      <div className={styles.stepperBarFilled} />
                    ) : null}
                  </div>
                  <span className={`${styles.stepperLabel} ${isReady ? styles.ready : ''}`}>
                    {isReady ? (
                      <Bell size={11} strokeWidth={2.4} style={{ color: '#059669' }} />
                    ) : isCompleted ? (
                      <Check size={11} strokeWidth={2.4} style={{ color: '#059669' }} />
                    ) : null}
                    <span>3. Sẵn sàng lấy</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Cut-out ticket line */}
          <div className={styles.cutoutWrapper}>
            <div className={styles.notchLeft} />
            <div className={styles.notchRight} />
            <div className={styles.dashedLine} />
          </div>

          {/* Product Items List */}
          <div className={styles.itemsSection}>
            <div className={styles.itemsHeader}>
              <span>Chi tiết thức uống ({totalCups} món)</span>
              <span>Thành tiền</span>
            </div>

            {mergedItems.map((item, idx) => {
              const productName = item.productName || item.name || 'Đồ uống BrewLite';
              const lowerName = productName.toLowerCase();
              const isBakery =
                Boolean(item.isBakery) ||
                lowerName.includes('bánh') ||
                lowerName.includes('pain') ||
                lowerName.includes('cheesecake') ||
                lowerName.includes('tiramisu');
              const isHot =
                item.temperature === 'hot' ||
                item.temperature === 'HOT' ||
                lowerName.includes('nóng') ||
                lowerName.includes('hot');
              const isWarm =
                item.servingStyle === 'Hâm nóng' ||
                item.servingStyle === 'Hâm nóng giòn' ||
                (!item.servingStyle && isHot);
              const imgUrl = getItemImage(item.productId, productName, item.imageUrl);

              return (
                <div key={item.id ?? idx} className={styles.itemCard}>
                  <div className={styles.itemImageWrapper}>
                    <Image
                      src={imgUrl}
                      alt={productName}
                      fill
                      unoptimized
                      sizes="64px"
                      className={styles.itemImage}
                    />
                  </div>

                  <div className={styles.itemContent}>
                    <h4 className={styles.itemTitle}>{productName}</h4>

                    <div className={styles.attributesRow}>
                      {isBakery ? (
                        <span className={styles.attrBadge}>
                          {isWarm ? (
                            <>
                              <Flame size={12} strokeWidth={2.2} className={styles.attrIcon} />
                              <span>Hâm nóng</span>
                            </>
                          ) : (
                            <>
                              <Snowflake size={12} strokeWidth={2.2} className={styles.attrIcon} />
                              <span>Dùng ngay</span>
                            </>
                          )}
                        </span>
                      ) : (
                        <>
                          <span className={styles.attrBadge}>Size {item.size || 'M'}</span>

                          <span className={styles.attrBadge}>
                            {isHot ? (
                              <>
                                <Flame size={12} strokeWidth={2.2} className={styles.attrIcon} />
                                <span>Uống Nóng</span>
                              </>
                            ) : (
                              <>
                                <Snowflake size={12} strokeWidth={2.2} className={styles.attrIcon} />
                                <span>Uống Lạnh</span>
                              </>
                            )}
                          </span>

                          {!isHot && (
                            <span className={styles.attrBadge}>
                              {formatIceLevel(item.iceLevel)}
                            </span>
                          )}

                          <span className={styles.attrBadge}>
                            {formatSugarLevel(item.sugarLevel)}
                          </span>
                        </>
                      )}
                    </div>

                    {item.toppings.length > 0 && (
                      <div className={styles.toppingsColumn}>
                        {item.toppings.map((t, tIdx) => (
                          <div key={tIdx} className={styles.toppingItem}>
                            <span className={styles.toppingPlus}>+</span>
                            <span>{t}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {item.notes && (
                      <div className={styles.itemNotes}>
                        <strong>Ghi chú:</strong> {item.notes}
                      </div>
                    )}
                  </div>

                  <div className={styles.itemRight}>
                    <span className={styles.itemPrice}>
                      {formatVND(Number(item.unitPrice || 0) * Number(item.quantity || 1))}
                    </span>
                    <span className={styles.itemQty}>
                      x{item.quantity} {isBakery ? 'phần' : 'ly'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment Summary */}
          <div className={styles.totalsCard}>
            <div className={styles.totalRow}>
              <span>Tạm tính ({totalCups} món)</span>
              <span className={styles.totalValue}>{formatVND(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className={styles.discountRow}>
                <span>
                  Khuyến mãi
                  {discountCode && <span className={styles.voucherChip}>{discountCode}</span>}
                </span>
                <span>-{formatVND(discountAmount)}</span>
              </div>
            )}

            <div className={styles.totalRow}>
              <span>Phí dịch vụ Express Bar</span>
              <span className={styles.totalValue}>Miễn phí</span>
            </div>

            <div className={styles.totalRow}>
              <span>Thuế VAT (0%)</span>
              <span className={styles.totalValue}>0 ₫</span>
            </div>

            <div className={styles.finalTotalRow}>
              <span className={styles.finalTotalLabel}>Tổng thanh toán</span>
              <span className={styles.finalTotalValue}>{formatVND(finalTotal)}</span>
            </div>

            {!isCancelled && !isPending && (
              <div className={styles.loyaltyRewardCard}>
                <span>Điểm thưởng tích lũy đơn này:</span>
                <span className={styles.loyaltyRewardPoints}>
                  +{loyaltyPoints} Hạt Vàng BrewLite Club
                </span>
              </div>
            )}
          </div>

          {/* Eco note */}
          <div className={styles.ecoSection}>
            <div className={styles.ecoRow}>
              <span>Phục vụ trong 100% Cốc Bã Mía Sinh Học phân hủy tự nhiên.</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionsWrapper}>
          {isPending && (
            <Link href={`/checkout?orderId=${orderId}`} className={styles.pendingPayBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                payments
              </span>
              <span>Thanh toán đơn ngay ({formatVND(finalTotal)})</span>
            </Link>
          )}

          <Link href="/menu" className={styles.primaryBtn}>
            <Coffee size={18} strokeWidth={2.2} />
            <span>Đặt thêm đơn mới</span>
          </Link>

          <div className={styles.secondaryActionsRow}>
            <Link href="/menu" className={styles.secondaryBtnCompact}>
              <Store size={15} strokeWidth={2.2} />
              <span>Về Thực đơn</span>
            </Link>

            <Link href="/orders" className={styles.secondaryBtnCompact}>
              <History size={15} strokeWidth={2.2} />
              <span>Lịch sử đơn</span>
            </Link>
          </div>

        </div>
      </div>

      {/* Fixed 5-item Mobile Bottom Navigation Bar */}
      <nav className={styles.bottomNav}>
        <div className={styles.bottomNavInner}>
          <Link href="/menu" className={styles.navItem}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              coffee
            </span>
            <span>Thực đơn</span>
          </Link>

          <Link href="/cart" className={styles.navItem} data-testid="cart-link">
            <div className={styles.navIconWrap}>
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                shopping_cart
              </span>
              {totalCartCount > 0 && (
                <span className={styles.navBadge}>{totalCartCount}</span>
              )}
            </div>
            <span>Giỏ hàng</span>
          </Link>

          <Link href="/orders" className={`${styles.navItem} ${styles.navItemActive}`}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}
            >
              receipt_long
            </span>
            <span>Đơn hàng</span>
          </Link>

          <Link href="/promotions" className={styles.navItem}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              confirmation_number
            </span>
            <span>Ưu đãi</span>
          </Link>

          <Link href="/account" className={styles.navItem}>
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
