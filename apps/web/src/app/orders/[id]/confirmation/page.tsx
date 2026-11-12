'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Flame, Snowflake, Check, Copy, Store, History, RefreshCw, Sparkles, Bell } from 'lucide-react';
import styles from './confirmation.module.css';
import { MOCK_PRODUCTS } from '../../../../data/mock-products';
import { apiClient } from '../../../../lib/api-client';

interface ConfirmationItem {
  id?: string | number;
  productId: string | number;
  productName?: string;
  name?: string;
  size?: string;
  toppings?: string[];
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
  temperature?: 'iced' | 'hot' | 'COLD' | 'HOT';
  servingStyle?: string;
  iceLevel?: string;
  sugarLevel?: string;
  notes?: string;
  isBakery?: boolean;
}

interface OrderConfirmationData {
  id: string | number;
  status: string;
  totalAmount: number;
  subtotal?: number;
  discountCode?: string | null;
  discountAmount?: number;
  createdAt: string;
  items: ConfirmationItem[];
  paymentMethod?: string;
}

function getItemImage(productId?: string | number, productName?: string, customImage?: string): string {
  if (customImage && customImage.startsWith('/')) return customImage;
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
  if (val.endsWith('%')) {
    return `${val} đường`;
  }
  if (!val.toLowerCase().includes('đường') && !val.toLowerCase().includes('duong')) {
    return `${val} đường`;
  }
  return val;
}

const formatVND = (n: number) => `${(n || 0).toLocaleString('vi-VN')} ₫`;

export default function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [orderId, setOrderId] = useState<string>('');
  const [order, setOrder] = useState<OrderConfirmationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [receiptState, setReceiptState] = useState<'idle' | 'loading' | 'done'>('idle');
  const prevStatusRef = useRef<string | null>(null);

  // Unwrap params safely without unhandled Suspense boundary
  useEffect(() => {
    let mounted = true;
    Promise.resolve(params).then((p) => {
      if (mounted && p?.id) {
        setOrderId(String(p.id));
      }
    });
    return () => {
      mounted = false;
    };
  }, [params]);

  // Play sound when barista changes status to READY or COMPLETED
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
      // Audio context might be restricted before user gesture
    }
  }, []);

  // Fetch from API and merge with localStorage snapshot
  useEffect(() => {
    if (!orderId) return;

    let localSnapshot: OrderConfirmationData | null = null;
    let localCustoms: any[] = [];

    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`order_details_${orderId}`);
        if (saved) {
          localSnapshot = JSON.parse(saved);
        }
        const savedCustoms = localStorage.getItem(`order_customizations_${orderId}`);
        if (savedCustoms) {
          localCustoms = JSON.parse(savedCustoms);
        }
      } catch {
        // ignore
      }
    }

    let isMounted = true;

    const fetchOrderData = async (isInitial = false) => {
      try {
        const res = await apiClient(`/orders/${orderId}`);
        if (res.ok) {
          const apiData = await res.json();
          const mergedData = apiData?.data ?? apiData;
          if (!isMounted) return;

          if (
            prevStatusRef.current &&
            prevStatusRef.current !== mergedData.status &&
            (mergedData.status === 'READY' || mergedData.status === 'COMPLETED')
          ) {
            playPickupChime();
          }
          prevStatusRef.current = mergedData.status;

          // Merge API items with local toppings/customizations if API items lack them
          const mergedItems = (mergedData.items || []).map((it: any, idx: number) => {
            const localIt = localSnapshot?.items?.[idx];
            const localCust = localCustoms?.[idx] || (localCustoms || []).find((c) => String(c.productId) === String(it.productId));
            return {
              ...it,
              productName: it.productName || it.name || localIt?.productName || localIt?.name,
              toppings: (it.toppings && it.toppings.length > 0) ? it.toppings : (localIt?.toppings || []),
              temperature: it.temperature || localCust?.temperature || localIt?.temperature,
              servingStyle: it.servingStyle || localCust?.servingStyle || localIt?.servingStyle,
              iceLevel: it.iceLevel || localCust?.iceLevel || localIt?.iceLevel,
              sugarLevel: it.sugarLevel || localCust?.sugarLevel || localIt?.sugarLevel,
              notes: it.notes || localCust?.notes || localIt?.notes,
              isBakery: it.isBakery !== undefined ? it.isBakery : (localCust?.isBakery ?? localIt?.isBakery),
              imageUrl: it.imageUrl || localIt?.imageUrl,
            };
          });

          setOrder({
            id: mergedData.id || orderId,
            status: mergedData.status || 'PAID',
            totalAmount: mergedData.totalAmount ?? localSnapshot?.totalAmount ?? 0,
            subtotal: mergedData.subtotal ?? localSnapshot?.subtotal ?? mergedData.totalAmount ?? 0,
            discountCode: mergedData.discountCode ?? localSnapshot?.discountCode ?? null,
            discountAmount: mergedData.discountAmount ?? localSnapshot?.discountAmount ?? 0,
            createdAt: mergedData.createdAt || localSnapshot?.createdAt || new Date().toISOString(),
            paymentMethod: localSnapshot?.paymentMethod || 'Ví điện tử',
            items: mergedItems.length > 0 ? mergedItems : (localSnapshot?.items || []),
          });
          if (isInitial) setLoading(false);
          return;
        }
      } catch {
        // network / mock mode fallback
      }

      if (!isMounted) return;

      // Fallback from localStorage snapshot if API temporarily unreachable
      if (localSnapshot) {
        setOrder(localSnapshot);
      }
      if (isInitial) setLoading(false);
    };

    void fetchOrderData(true);

    const interval = setInterval(() => {
      void fetchOrderData(false);
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [orderId, playPickupChime]);

  const handleCopyOrderId = () => {
    if (!orderId) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(String(orderId));
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownloadReceipt = () => {
    setReceiptState('loading');
    setTimeout(() => {
      setReceiptState('done');
      setTimeout(() => setReceiptState('idle'), 3500);
    }, 800);
  };

  const status = order?.status || 'PAID';
  const isReady = status === 'READY';
  const isPreparing = status === 'PREPARING';
  const isCompleted = status === 'COMPLETED';
  const isCancelled = status === 'CANCELLED' || status === 'PAYMENT_FAILED';

  // Loyalty points: 1 Hạt Vàng per 1.000 VNĐ
  const loyaltyPoints = order && !isCancelled ? Math.floor(order.totalAmount / 1000) : 0;

  const paymentMethodLabel = order?.paymentMethod || 'Ví điện tử';

  const formattedTime = order?.createdAt
    ? new Date(order.createdAt).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }) + ' Hôm nay'
    : 'Hôm nay';

  if (loading) {
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
          <p style={{ color: '#786c67', fontSize: 13 }}>Đang tải thông tin đơn hàng...</p>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className={styles.container}>
        <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center', padding: 24, backgroundColor: '#fff', borderRadius: 20, border: '1px solid #e7ded5' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#2c1810', marginBottom: 8 }}>
            Không tìm thấy thông tin đơn hàng #{orderId}
          </h2>
          <p style={{ color: '#786c67', fontSize: 13, marginBottom: 20 }}>
            Vui lòng kiểm tra lại mã đơn hàng hoặc quay lại danh sách đơn của bạn.
          </p>
          <Link
            href="/orders"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: '#2c1810',
              color: '#fff',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            Về lịch sử đơn hàng
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.ambientGlow} />

      <div className={styles.contentWrapper}>
        {/* Animated Checkmark / Status Icon with floating loyalty chip */}
        <div className={styles.iconContainer}>
          <div className={styles.iconPulseRing} />
          <div className={styles.iconCircle}>
            <div
              className={`${styles.iconInner} ${
                isReady
                  ? styles.ready
                  : isCompleted
                  ? styles.completed
                  : isCancelled
                  ? styles.cancelled
                  : ''
              }`}
            >
              {isCancelled ? (
                <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
                  close
                </span>
              ) : isReady ? (
                <Bell size={26} strokeWidth={2.4} className="animate-bounce" />
              ) : isCompleted ? (
                <Check size={28} strokeWidth={2.6} />
              ) : (
                <Check size={28} strokeWidth={2.6} />
              )}
            </div>
          </div>

          {!isCancelled && (
            <div className={styles.loyaltyFloatingBadge}>
              <Sparkles size={12} strokeWidth={2.4} />
              <span>+{loyaltyPoints} Hạt Vàng</span>
            </div>
          )}
        </div>

        {/* Live Status Pill */}
        <div
          className={`${styles.statusPill} ${
            isReady ? styles.ready : isCancelled ? styles.cancelled : ''
          }`}
        >
          <span
            className={`${styles.pingDot} ${
              isReady ? styles.ready : isCancelled ? styles.cancelled : ''
            }`}
          />
          <span>
            {isCancelled
              ? 'Đơn hàng đã bị hủy'
              : isReady
              ? 'Quầy Barista đang gọi bạn nhận món!'
              : isPreparing
              ? 'Barista đang pha chế trực tiếp (Auto-sync 3s)'
              : isCompleted
              ? 'Đã bàn giao đồ uống hoàn tất'
              : 'Giao dịch không tiền mặt thành công (Auto-sync 3s)'}
          </span>
        </div>

        {/* Headline */}
        <h1 className={styles.headline}>
          {isCancelled
            ? 'Đặt hàng thất bại'
            : isReady
            ? 'Đồ uống đã sẵn sàng lấy!'
            : isPreparing
            ? 'Barista đang pha chế món của bạn!'
            : isCompleted
            ? 'Đã nhận nước thành công!'
            : 'Đặt hàng & Thanh toán thành công!'}
        </h1>

        <p className={styles.subheadline}>
          {isCancelled ? (
            <>Đơn hàng <strong>#BL-{orderId}</strong> đã bị hủy hoặc hết hạn thanh toán.</>
          ) : isReady ? (
            <>
              Mời bạn di chuyển đến <strong style={{ color: '#059669' }}>Kệ Express Bar số 04</strong> và đọc mã đơn <strong>#BL-{orderId}</strong> để nhận nước ngay.
            </>
          ) : isPreparing ? (
            <>
              Barista tại <strong>BrewLite Downtown Roastery</strong> đã tiếp nhận đơn và đang chiết xuất đồ uống tươi.
            </>
          ) : (
            <>
              Cảm ơn bạn đã lựa chọn trải nghiệm tự động &amp; không tiền mặt tại <strong>BrewLite Downtown Roastery</strong>.
            </>
          )}
        </p>

        {/* Boarding Pass Ticket Card */}
        <div className={styles.ticketCard}>
          <div
            className={`${styles.topRibbon} ${
              isReady ? styles.ready : isCancelled ? styles.cancelled : ''
            }`}
          />

          {/* Ticket Header: Order ID + Status */}
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
                className={`${styles.statusBadge} ${
                  isReady ? styles.ready : isCancelled ? styles.cancelled : ''
                }`}
              >
                {isCancelled
                  ? 'CANCELLED'
                  : isReady
                  ? 'READY • MỜI LẤY NƯỚC'
                  : isPreparing
                  ? 'PREPARING • ĐANG PHA CHẾ'
                  : isCompleted
                  ? 'COMPLETED • ĐÃ HOÀN TẤT'
                  : 'PAID • ĐÃ THANH TOÁN'}
              </span>
              <div className={styles.orderMetaRow}>
                <span className={styles.paymentTag}>{paymentMethodLabel}</span>
                <span>{formattedTime}</span>
              </div>
            </div>
          </div>

          {/* Express Counter Banner */}
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
                  : 'Vị trí nhận nước: Kệ Express Bar số 04 • Dự kiến pha chế: ~5-10 phút'}
              </div>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className={styles.stepperSection}>
            <div className={styles.stepperHeader}>
              <span className={styles.stepperTitle}>Tiến trình phục vụ</span>
              <span className={styles.stepperStation}>Trạm Barista KDS #01</span>
            </div>
            <div className={styles.stepperGrid}>
              {/* Step 1: Đã thanh toán */}
              <div className={styles.stepperItem}>
                <div className={styles.stepperBar}>
                  <div className={styles.stepperBarFilled} />
                </div>
                <span className={styles.stepperLabel}>
                  <Check size={11} strokeWidth={2.4} style={{ color: '#059669' }} />
                  1. Đã thanh toán
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
                <span
                  className={`${styles.stepperLabel} ${
                    isPreparing ? styles.active : isReady || isCompleted ? '' : ''
                  }`}
                >
                  {isPreparing ? (
                    <RefreshCw size={11} strokeWidth={2.4} className="animate-spin" />
                  ) : isReady || isCompleted ? (
                    <Check size={11} strokeWidth={2.4} style={{ color: '#059669' }} />
                  ) : null}
                  2. Đang pha chế
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
                  3. Sẵn sàng lấy
                </span>
              </div>
            </div>
          </div>

          {/* Cut-out ticket line */}
          <div className={styles.cutoutWrapper}>
            <div className={styles.notchLeft} />
            <div className={styles.notchRight} />
            <div className={styles.dashedLine} />
          </div>

          {/* Product Items List */}
          <div className={styles.itemsSection}>
            <div className={styles.itemsHeader}>
              <span>Chi tiết món đã đặt ({order?.items?.length || 0} món)</span>
              <span>Thành tiền</span>
            </div>

            {order?.items?.map((item, idx) => {
              const productName = item.productName || item.name || 'Đồ uống';
              const isBakery = item.isBakery || productName.toLowerCase().includes('bánh') || productName.toLowerCase().includes('pain') || productName.toLowerCase().includes('cheesecake') || productName.toLowerCase().includes('tiramisu');
              const isHot = item.temperature === 'hot' || item.temperature === 'HOT' || productName.toLowerCase().includes('nóng') || productName.toLowerCase().includes('hot');
              const isWarm = item.servingStyle === 'Hâm nóng' || item.servingStyle === 'Hâm nóng giòn' || (!item.servingStyle && isHot);
              const imgUrl = getItemImage(item.productId, productName, item.imageUrl);

              return (
                <div key={item.id ?? idx} className={styles.itemCard}>
                  {/* Thumbnail Image */}
                  <div className={styles.itemImageWrapper}>
                    <Image
                      src={imgUrl}
                      alt={productName}
                      fill
                      unoptimized
                      className={styles.itemImage}
                    />
                  </div>

                  {/* Info Column */}
                  <div className={styles.itemContent}>
                    <h4 className={styles.itemTitle}>{productName}</h4>

                    {/* Dòng 1: Size, Nóng/Lạnh (Icon cùng màu chữ text), Đá, Đường, hoặc Bánh */}
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
                          <span className={styles.attrBadge}>
                            Size {item.size || 'M'}
                          </span>

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

                    {/* Dòng 2+: Topping - Mỗi topping hiển thị 1 hàng riêng với màu vàng mật ong dịu dàng */}
                    {item.toppings && item.toppings.length > 0 && (
                      <div className={styles.toppingsColumn}>
                        {item.toppings.map((t, tIdx) => (
                          <div key={tIdx} className={styles.toppingItem}>
                            <span className={styles.toppingPlus}>+</span>
                            <span>{t}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Ghi chú Barista nếu có */}
                    {item.notes && (
                      <div className={styles.itemNotes}>
                        <strong>Ghi chú:</strong> {item.notes}
                      </div>
                    )}
                  </div>

                  {/* Right: Price & Quantity */}
                  <div className={styles.itemRight}>
                    <span className={styles.itemPrice}>
                      {formatVND(item.unitPrice * item.quantity)}
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
              <span>Tạm tính đồ uống</span>
              <span className={styles.totalValue}>
                {formatVND(
                  order?.subtotal ||
                    order?.items?.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0) ||
                    order?.totalAmount ||
                    0
                )}
              </span>
            </div>

            {Boolean(order?.discountAmount && order.discountAmount > 0) && (
              <div className={styles.discountRow}>
                <span>
                  Khuyến mãi
                  {order?.discountCode && (
                    <span className={styles.voucherChip}>{order.discountCode}</span>
                  )}
                </span>
                <span>-{formatVND(order?.discountAmount || 0)}</span>
              </div>
            )}


            <div className={styles.totalRow}>
              <span>Thuế VAT (0%)</span>
              <span className={styles.totalValue}>0 ₫</span>
            </div>

            <div className={styles.finalTotalRow}>
              <span className={styles.finalTotalLabel}>Tổng thanh toán</span>
              <span className={styles.finalTotalValue}>
                {formatVND(order?.totalAmount || 0)}
              </span>
            </div>

            {/* Loyalty points card */}
            {!isCancelled && (
              <div className={styles.loyaltyRewardCard}>
                <span>Điểm thưởng tích lũy đơn này:</span>
                <span className={styles.loyaltyRewardPoints}>
                  +{loyaltyPoints} Hạt Vàng BrewLite Club
                </span>
              </div>
            )}
          </div>

          {/* Eco note & E-receipt download */}
          <div className={styles.ecoSection}>
            <div className={styles.ecoRow}>
              <span style={{ fontSize: 13 }}>🌿</span>
              <span>Phục vụ trong 100% Cốc Bã Mía Sinh Học phân hủy tự nhiên.</span>
            </div>

            <button
              type="button"
              onClick={handleDownloadReceipt}
              className={styles.receiptBtn}
            >
              {receiptState === 'loading' ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Đang tải hóa đơn...</span>
                </>
              ) : receiptState === 'done' ? (
                <>
                  <Check size={13} strokeWidth={2.4} style={{ color: '#059669' }} />
                  <span style={{ color: '#059669' }}>Đã lưu hóa đơn điện tử (PDF)!</span>
                </>
              ) : (
                <>
                  <span>📄 Tải hóa đơn điện tử (E-Receipt)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2 Action Buttons (mobile-friendly) */}
        <div className={styles.actionsWrapper}>
          <Link href="/menu" className={styles.primaryBtn}>
            <Store size={18} strokeWidth={2.2} />
            <span>Tiếp tục đặt món</span>
          </Link>

          <Link href="/orders" className={styles.secondaryBtn}>
            <History size={18} strokeWidth={2.2} />
            <span>Xem lịch sử đơn hàng</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
