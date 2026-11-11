'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/auth-store';
import { useCartStore } from '../../stores/cart-store';
import { apiClient } from '../../lib/api-client';
import styles from './orders.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OrderItem {
  id?: string | number;
  productId: string | number;
  name: string;
  productName?: string;
  size: 'S' | 'M' | 'L' | string;
  toppings?: string[] | string;
  quantity: number;
  unitPrice: number;
}

export interface PaymentInfo {
  id?: string | number;
  method: 'WALLET' | 'CARD' | 'MOMO' | 'ZALOPAY' | 'CASH' | string;
  status: string;
  amount: number;
  createdAt?: string;
}

export interface Order {
  id: string | number;
  status: 'PENDING' | 'PAID' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'PAYMENT_FAILED';
  totalAmount: number;
  finalAmount?: number;
  discountAmount?: number;
  discountCode?: string | null;
  createdAt: string;
  updatedAt?: string;
  staffId?: number | null;
  staffName?: string | null;
  items?: OrderItem[];
  payments?: PaymentInfo[];
}

type FilterKey = 'all' | 'active' | 'completed' | 'cancelled';

const ACTIVE_STATUSES = ['PAID', 'PREPARING', 'READY'];

function isActive(status: string): boolean {
  return ACTIVE_STATUSES.includes(status);
}

const vnd = (n: number) => (n || 0).toLocaleString('vi-VN') + ' ₫';

const formatDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (isToday) {
    return (
      'Hôm nay ' +
      d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    );
  }
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    bg: string;
    color: string;
    border: string;
    icon: string;
    animated?: 'spin' | 'bounce' | 'pulse';
  }
> = {
  PENDING: {
    label: 'Chờ thanh toán',
    bg: '#fef3c7',
    color: '#92400e',
    border: '#fde68a',
    icon: 'schedule',
    animated: 'pulse',
  },
  PAID: {
    label: 'Đã thanh toán • Chờ Barista nhận',
    bg: '#2c1810',
    color: '#ffdcc2',
    border: '#504440',
    icon: 'receipt_long',
  },
  PREPARING: {
    label: 'Barista đang pha chế',
    bg: '#845326',
    color: '#ffffff',
    border: '#b87333',
    icon: 'autorenew',
    animated: 'spin',
  },
  READY: {
    label: '🔔 Món đã xong • Mời lấy nước!',
    bg: '#059669',
    color: '#ffffff',
    border: '#34d399',
    icon: 'notifications_active',
    animated: 'bounce',
  },
  COMPLETED: {
    label: 'Đã nhận nước • Hoàn thành',
    bg: '#ecfdf5',
    color: '#047857',
    border: '#a7f3d0',
    icon: 'check_circle',
  },
  CANCELLED: {
    label: 'Đã hủy',
    bg: '#fef2f2',
    color: '#b91c1c',
    border: '#fecaca',
    icon: 'cancel',
  },
  PAYMENT_FAILED: {
    label: 'Thanh toán thất bại',
    bg: '#fef2f2',
    color: '#b91c1c',
    border: '#fecaca',
    icon: 'error_outline',
  },
};

// ── Default Mock Demo Orders (chuẩn Assignment 1) ────────────────────────────
const DEMO_ORDERS: Order[] = [
  {
    id: 104,
    status: 'READY',
    totalAmount: 65000,
    finalAmount: 65000,
    createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    staffName: 'Hoàng Nam',
    payments: [{ method: 'WALLET', status: 'SUCCESS', amount: 65000 }],
    items: [
      {
        productId: 1,
        name: 'Cà Phê Muối Đặc Biệt',
        size: 'L',
        toppings: ['Kem Muối Biển', 'Trân Châu Hoàng Kim'],
        quantity: 1,
        unitPrice: 65000,
      },
    ],
  },
  {
    id: 103,
    status: 'PREPARING',
    totalAmount: 95000,
    finalAmount: 85000,
    discountAmount: 10000,
    discountCode: 'BREWLITE10',
    createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    staffName: 'Trần Minh',
    payments: [{ method: 'CARD', status: 'SUCCESS', amount: 85000 }],
    items: [
      {
        productId: 2,
        name: 'Cold Brew Cam Vàng',
        size: 'M',
        toppings: [],
        quantity: 1,
        unitPrice: 50000,
      },
      {
        productId: 3,
        name: 'Matcha Latte Macchiato',
        size: 'M',
        toppings: ['Thạch Matcha'],
        quantity: 1,
        unitPrice: 45000,
      },
    ],
  },
  {
    id: 102,
    status: 'PENDING',
    totalAmount: 45000,
    finalAmount: 45000,
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    items: [
      {
        productId: 4,
        name: 'Cà Phê Sữa Tươi Sương Sáo',
        size: 'M',
        toppings: ['Sương Sáo'],
        quantity: 1,
        unitPrice: 45000,
      },
    ],
  },
  {
    id: 101,
    status: 'COMPLETED',
    totalAmount: 78000,
    finalAmount: 78000,
    createdAt: new Date(Date.now() - 86400 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 86000 * 1000).toISOString(),
    staffName: 'Thanh Thảo',
    payments: [{ method: 'WALLET', status: 'SUCCESS', amount: 78000 }],
    items: [
      {
        productId: 5,
        name: 'Bạc Xỉu Sài Gòn Ba Tầng',
        size: 'M',
        toppings: [],
        quantity: 2,
        unitPrice: 39000,
      },
    ],
  },
];

// ── Pending Countdown Component (5 Phút Tự Hủy) ──────────────────────────────
function PendingCountdown({
  createdAt,
  onExpire,
}: {
  createdAt: string;
  onExpire?: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const expireTime = new Date(createdAt).getTime() + 5 * 60 * 1000;
    return Math.max(0, Math.floor((expireTime - Date.now()) / 1000));
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const expireTime = new Date(createdAt).getTime() + 5 * 60 * 1000;
      const rem = Math.max(0, Math.floor((expireTime - Date.now()) / 1000));
      setTimeLeft(rem);
      if (rem <= 0) {
        clearInterval(timer);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [createdAt, onExpire]);

  if (timeLeft <= 0) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
          color: '#b91c1c',
          background: '#fef2f2',
          padding: '2px 6px',
          borderRadius: 6,
          fontSize: 10,
          fontWeight: 700,
          border: '1px solid #fecaca',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
          warning
        </span>
        Hết hạn (Đang hoàn kho)
      </span>
    );
  }

  const mm = Math.floor(timeLeft / 60);
  const ss = timeLeft % 60;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        color: '#92400e',
        background: '#fef3c7',
        padding: '2px 6px',
        borderRadius: 6,
        fontSize: 10,
        fontWeight: 700,
        fontFamily: 'monospace',
        border: '1px solid #fde68a',
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 12, color: '#b45309' }}
      >
        timer
      </span>
      <span>
        Tự hủy sau {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
      </span>
    </span>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────
export default function OrderListPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const rawTotalCartCount = useCartStore((s) => s.getTotalCount());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalCartCount = mounted ? rawTotalCartCount : 0;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [selectedHeroOrderId, setSelectedHeroOrderId] = useState<string | number | null>(null);
  const [cancellingPending, setCancellingPending] = useState(false);
  const [liveToast, setLiveToast] = useState<{
    orderId: string | number;
    status: string;
    message: string;
  } | null>(null);

  const prevStatusMapRef = useRef<Record<string, string>>({});

  // 1. Quản lý danh sách ID đơn bị ẩn (xóa mềm hiển thị khỏi UI)
  const [hiddenOrderIds, setHiddenOrderIds] = useState<(string | number)[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('brewlite_hidden_order_ids');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const saveHiddenOrderIds = (ids: (string | number)[]) => {
    setHiddenOrderIds(ids);
    try {
      localStorage.setItem('brewlite_hidden_order_ids', JSON.stringify(ids));
    } catch {
      // ignore
    }
  };

  // 2. Âm thanh chuông báo tinh tế (Web Audio API Customer Chime)
  const playCustomerChime = useCallback(() => {
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
      // ignore audio permission restrictions
    }
  }, []);

  // 3. Tải danh sách đơn hàng & Polling real-time mỗi 5 giây
  const fetchOrders = useCallback(
    async (isInitial = false) => {
      try {
        const res = await apiClient('/orders/me');
        if (res.ok) {
          const json = await res.json();
          let list: Order[] = Array.isArray(json?.data)
            ? json.data
            : Array.isArray(json)
            ? json
            : [];

          // Nếu API trả về rỗng nhưng chưa có đơn (chế độ demo / đồ án)
          if (list.length === 0) {
            list = DEMO_ORDERS;
          }

          // Kiểm tra thay đổi trạng thái từ Barista KDS
          if (Object.keys(prevStatusMapRef.current).length > 0) {
            for (const ord of list) {
              const key = String(ord.id);
              const prev = prevStatusMapRef.current[key];
              if (prev && prev !== ord.status) {
                if (ord.status === 'PREPARING') {
                  setSelectedHeroOrderId(ord.id);
                  setLiveToast({
                    orderId: ord.id,
                    status: 'PREPARING',
                    message: `☕ Barista đã nhận Đơn #BL-${ord.id} và đang bắt đầu pha chế!`,
                  });
                } else if (ord.status === 'READY') {
                  playCustomerChime();
                  setSelectedHeroOrderId(ord.id);
                  setLiveToast({
                    orderId: ord.id,
                    status: 'READY',
                    message: `🔔 MÓN ĐÃ XONG! Mời bạn lấy Đơn #BL-${ord.id} tại Kệ Express Bar 04!`,
                  });
                } else if (ord.status === 'COMPLETED') {
                  playCustomerChime();
                  setLiveToast({
                    orderId: ord.id,
                    status: 'COMPLETED',
                    message: `✅ Đơn #BL-${ord.id} đã hoàn tất. Chúc bạn thưởng thức ngon miệng!`,
                  });
                } else if (ord.status === 'CANCELLED') {
                  setLiveToast({
                    orderId: ord.id,
                    status: 'CANCELLED',
                    message: `⚠️ Đơn #BL-${ord.id} đã được hủy.`,
                  });
                }
              }
            }
          }

          const nextMap: Record<string, string> = {};
          list.forEach((o) => {
            nextMap[String(o.id)] = o.status;
          });
          prevStatusMapRef.current = nextMap;

          setOrders(list);
        } else {
          // Graceful fallback cho demo offline
          setOrders(DEMO_ORDERS);
        }
      } catch {
        // Dự phòng danh sách mẫu nếu backend chưa kết nối
        setOrders(DEMO_ORDERS);
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    [playCustomerChime],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=%2Forders');
      return;
    }

    let isMounted = true;
    void fetchOrders(true);

    const interval = setInterval(() => {
      if (isMounted) void fetchOrders(false);
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated, router, fetchOrders]);

  // 4. Hủy một đơn nháp PENDING
  const handleCancelSingleOrder = async (orderId: string | number) => {
    try {
      await apiClient(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      // Cập nhật state cục bộ ngay lập tức
      setOrders((prev) =>
        prev.map((o) =>
          String(o.id) === String(orderId) ? { ...o, status: 'CANCELLED' } : o,
        ),
      );
      void fetchOrders(false);
    } catch {
      setOrders((prev) =>
        prev.map((o) =>
          String(o.id) === String(orderId) ? { ...o, status: 'CANCELLED' } : o,
        ),
      );
    }
  };

  // 5. Hủy tất cả đơn PENDING dở dang
  const handleCancelAllPending = async () => {
    const pendings = orders.filter((o) => o.status === 'PENDING');
    if (!pendings.length) return;
    setCancellingPending(true);
    try {
      await Promise.all(
        pendings.map((p) =>
          apiClient(`/orders/${p.id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'CANCELLED' }),
          }),
        ),
      );
      setOrders((prev) =>
        prev.map((o) =>
          o.status === 'PENDING' ? { ...o, status: 'CANCELLED' } : o,
        ),
      );
      void fetchOrders(false);
    } catch {
      setOrders((prev) =>
        prev.map((o) =>
          o.status === 'PENDING' ? { ...o, status: 'CANCELLED' } : o,
        ),
      );
    } finally {
      setCancellingPending(false);
    }
  };

  // 6. Xóa mềm đơn hàng khỏi hiển thị (Lưu localStorage)
  const handleDeleteOrder = (orderId: string | number) => {
    saveHiddenOrderIds(
      hiddenOrderIds.includes(orderId)
        ? hiddenOrderIds
        : [...hiddenOrderIds, orderId],
    );
  };

  // 7. Dọn dẹp tất cả đơn đã hủy
  const handleCleanCancelled = () => {
    const cancelledIds = orders
      .filter((o) => o.status === 'CANCELLED' || o.status === 'PAYMENT_FAILED')
      .map((o) => o.id);
    if (!cancelledIds.length) return;
    saveHiddenOrderIds(Array.from(new Set([...hiddenOrderIds, ...cancelledIds])));
  };

  // 8. Khôi phục hiển thị
  const handleRestoreHidden = () => {
    saveHiddenOrderIds([]);
  };

  // ── Tính toán các danh sách hiển thị ─────────────────────────────────────────
  const visibleOrders = useMemo(() => {
    return orders.filter((o) => !hiddenOrderIds.includes(o.id));
  }, [orders, hiddenOrderIds]);

  const pendingOrders = useMemo(() => {
    return visibleOrders.filter((o) => o.status === 'PENDING');
  }, [visibleOrders]);

  const activeOrders = useMemo(() => {
    return [...visibleOrders.filter((o) => isActive(o.status))].sort((a, b) => {
      const rank = (s: string) => (s === 'READY' ? 0 : s === 'PREPARING' ? 1 : 2);
      return rank(a.status) - rank(b.status);
    });
  }, [visibleOrders]);

  const readyOrders = useMemo(() => {
    return activeOrders.filter((o) => o.status === 'READY');
  }, [activeOrders]);

  const heroOrder = useMemo(() => {
    return (
      activeOrders.find((o) => String(o.id) === String(selectedHeroOrderId)) ||
      activeOrders[0]
    );
  }, [activeOrders, selectedHeroOrderId]);

  const totalPoints = useMemo(() => {
    return visibleOrders.reduce((sum, o) => {
      return ['PAID', 'COMPLETED', 'PREPARING', 'READY'].includes(o.status)
        ? sum + Math.floor((o.finalAmount ?? o.totalAmount) / 1000)
        : sum;
    }, 0);
  }, [visibleOrders]);

  const filteredOrders = useMemo(() => {
    return visibleOrders.filter((o) => {
      if (filter === 'all') return true;
      if (filter === 'active') return isActive(o.status) || o.status === 'PENDING';
      if (filter === 'completed') return o.status === 'COMPLETED';
      if (filter === 'cancelled')
        return o.status === 'CANCELLED' || o.status === 'PAYMENT_FAILED';
      return true;
    });
  }, [visibleOrders, filter]);

  const filterTabs: { key: FilterKey; label: string; count: number }[] = [
    { key: 'all', label: 'Tất cả', count: visibleOrders.length },
    {
      key: 'active',
      label: 'Đang thực hiện',
      count: visibleOrders.filter((o) => isActive(o.status) || o.status === 'PENDING')
        .length,
    },
    {
      key: 'completed',
      label: 'Đã hoàn thành',
      count: visibleOrders.filter((o) => o.status === 'COMPLETED').length,
    },
    {
      key: 'cancelled',
      label: 'Đã hủy',
      count: visibleOrders.filter(
        (o) => o.status === 'CANCELLED' || o.status === 'PAYMENT_FAILED',
      ).length,
    },
  ];

  // Dynamic 3-step Progress Stepper for hero active order
  const heroStatus = heroOrder?.status ?? 'PAID';
  const heroSteps = [
    {
      label: '1. Đã thanh toán & gửi quầy',
      desc:
        heroStatus === 'PAID'
          ? 'Đã vào màn hình Barista KDS, chờ tiếp nhận'
          : 'Xác thực thành công qua Cashless',
      done: heroStatus === 'PREPARING' || heroStatus === 'READY',
      active: heroStatus === 'PAID',
      icon: 'receipt',
    },
    {
      label: '2. Barista đang pha chế',
      desc:
        heroStatus === 'PREPARING'
          ? 'Đang đong nguyên liệu & chiết xuất trực tiếp'
          : heroStatus === 'READY'
          ? 'Đã hoàn tất pha chế & kiểm tra chất lượng'
          : 'Sẽ bắt đầu khi Barista bấm nhận đơn',
      done: heroStatus === 'READY',
      active: heroStatus === 'PREPARING',
      icon: heroStatus === 'READY' ? 'check' : 'autorenew',
    },
    {
      label: '3. Sẵn sàng lấy món!',
      desc:
        heroStatus === 'READY'
          ? '🔔 Mời bạn đến Kệ Express Bar 04 xuất trình mã nhận nước!'
          : 'Chuông sẽ báo ngay khi Barista pha xong',
      done: false,
      active: heroStatus === 'READY',
      icon: 'notifications_active',
    },
  ];

  return (
    <main className={styles.ordersContainer}>
      {/* ── Top Header Navigation ── */}
      <div className={styles.topBar}>
        <Link href="/menu" className={styles.backBtn}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            arrow_back
          </span>
          <span>Thực đơn</span>
        </Link>
        <div className={styles.syncBadge}>
          <span className={styles.pingDot} />
          <span>Đồng bộ Barista KDS (5s)</span>
        </div>
      </div>

      {/* ── Header Title & Mini Stats ── */}
      <section className={styles.headerSection}>
        <div className={styles.liveTag}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 14, color: '#845326' }}
          >
            radio_button_checked
          </span>
          <span>Cập nhật trực tiếp thời gian thực</span>
        </div>
        <h1 className={styles.pageTitle}>Đơn hàng của tôi</h1>
        <p className={styles.pageSubtitle}>
          Theo dõi tiến độ pha chế &amp; lịch sử giao dịch không tiền mặt
          {user?.fullName ? ` của ${user.fullName}` : ''}.
        </p>

        {/* Mini Stats Grid */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={`${styles.statValue} ${styles.statValueAccent}`}>
              {String(
                visibleOrders.filter(
                  (o) => isActive(o.status) || o.status === 'PENDING',
                ).length,
              ).padStart(2, '0')}
            </span>
            <span className={styles.statLabel}>Đang xử lý</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>
              {String(visibleOrders.length).padStart(2, '0')}
            </span>
            <span className={styles.statLabel}>Tổng đơn</span>
          </div>
          <div className={styles.statCard}>
            <span className={`${styles.statValue} ${styles.statValueAccent}`}>
              +{totalPoints}
            </span>
            <span className={styles.statLabel}>Hạt Vàng</span>
          </div>
        </div>
      </section>

      {/* ── READY PICKUP CALL BANNER (QUẦY BARISTA GỌI TÊN BẠN) ── */}
      {readyOrders.length > 0 && (
        <section className={styles.pickupBanner}>
          <div className={styles.pickupBannerTop}>
            <div className={styles.pickupIconWrap}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 26 }}
              >
                notifications_active
              </span>
            </div>
            <div>
              <span className={styles.pickupTag}>
                🔔 Quầy Barista đang gọi bạn
              </span>
              <h2 className={styles.pickupTitle}>
                Đơn #{readyOrders[0].id} đã pha chế xong!
              </h2>
            </div>
          </div>
          <p className={styles.pickupDesc}>
            Mời bạn di chuyển đến <strong>Kệ Express Bar số 04</strong> để nhận đồ
            uống ngay khi còn tươi ngon nhất.
          </p>
          <Link
            href={`/orders/${readyOrders[0].id}`}
            className={styles.pickupBtn}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              qr_code_2
            </span>
            <span>{`Mở mã nhận nước #BL-${readyOrders[0].id}`}</span>
          </Link>
        </section>
      )}

      {/* ── THÔNG BÁO ĐƠN CHỜ THANH TOÁN (5 PHÚT TỰ HỦY) ── */}
      {pendingOrders.length > 0 && (
        <section className={styles.pendingBanner}>
          <div className={styles.pendingHeader}>
            <div className={styles.pendingIcon}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                schedule
              </span>
            </div>
            <div>
              <h3 className={styles.pendingTitle}>
                Có {pendingOrders.length} đơn hàng đang chờ thanh toán
              </h3>
              <p className={styles.pendingSubtitle}>
                Hệ thống tự động hủy đơn sau 5 phút nếu chưa thanh toán.
              </p>
            </div>
          </div>
          <div className={styles.pendingActions}>
            <button
              type="button"
              onClick={handleCancelAllPending}
              disabled={cancellingPending}
              className={styles.pendingCancelBtn}
            >
              {cancellingPending ? 'Đang hủy...' : 'Hủy tất cả'}
            </button>
            <Link
              href={`/checkout?orderId=${pendingOrders[0].id}`}
              className={styles.pendingPayBtn}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                payments
              </span>
              <span>Thanh toán #BL-{pendingOrders[0].id}</span>
            </Link>
          </div>
        </section>
      )}

      {/* ── HERO LIVE TRACKER CARD (TIẾN ĐỘ BARISTA TRỰC TIẾP) ── */}
      {(filter === 'all' || filter === 'active') && heroOrder && (
        <section
          className={`${styles.heroCard} ${
            heroStatus === 'READY' ? styles.heroCardReady : ''
          }`}
        >
          {/* Multi-Order Switcher */}
          {activeOrders.length > 1 && (
            <div className={styles.heroSwitcher}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#6b5c56' }}>
                Đơn trực tiếp:
              </span>
              {activeOrders.map((ao) => (
                <button
                  key={ao.id}
                  type="button"
                  onClick={() => setSelectedHeroOrderId(ao.id)}
                  className={`${styles.heroSwitchBtn} ${
                    String(heroOrder.id) === String(ao.id)
                      ? styles.heroSwitchBtnActive
                      : ''
                  }`}
                >
                  #BL-{ao.id} (
                  {ao.status === 'READY'
                    ? '🔔 Xong'
                    : ao.status === 'PREPARING'
                    ? '☕ Đang pha'
                    : 'Chờ'}
                  )
                </button>
              ))}
            </div>
          )}

          {/* Header Card */}
          <div className={styles.heroHeader}>
            <div>
              <span
                className={styles.heroStatusPill}
                style={{
                  background: STATUS_CONFIG[heroStatus]?.bg ?? '#2c1810',
                  color: STATUS_CONFIG[heroStatus]?.color ?? '#ffffff',
                }}
              >
                <span className={styles.pingDot} />
                {STATUS_CONFIG[heroStatus]?.label ?? heroStatus}
              </span>
              <div className={styles.heroOrderId}>{`#BL-${heroOrder.id}`}</div>
              <div className={styles.heroOrderDate}>
                Đặt lúc {formatDate(heroOrder.createdAt)}
              </div>
            </div>
            <div className={styles.heroStationBadge}>
              <span className={styles.heroStationTitle}>Điểm nhận nước</span>
              <span className={styles.heroStationName}>Trạm 01 • Express Bar</span>
              {heroOrder.staffName && (
                <div style={{ fontSize: 11, color: '#845326', fontWeight: 700, marginTop: 2 }}>
                  👨‍🍳 {heroOrder.staffName}
                </div>
              )}
            </div>
          </div>

          {/* Dynamic 3-Step Progress Stepper */}
          <div className={styles.stepperContainer}>
            {heroSteps.map((step, idx) => (
              <div key={idx} className={styles.stepRow}>
                <div
                  className={`${styles.stepCircle} ${
                    step.done
                      ? styles.stepCircleDone
                      : step.active
                      ? heroStatus === 'READY'
                        ? styles.stepCircleActiveReady
                        : styles.stepCircleActive
                      : styles.stepCirclePending
                  }`}
                >
                  <span
                    className={`material-symbols-outlined ${
                      step.active && heroStatus === 'PREPARING'
                        ? 'animate-spin'
                        : ''
                    }`}
                    style={{ fontSize: 18 }}
                  >
                    {step.done ? 'check' : step.icon}
                  </span>
                </div>
                <div className={styles.stepContent}>
                  <div className={styles.stepLabel}>{step.label}</div>
                  <div className={styles.stepDesc}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Items & Footer CTA */}
          <div className={styles.heroFooter}>
            <div>
              <div style={{ fontSize: 11, color: '#786c67' }}>
                Tổng ({heroOrder.items?.length ?? 1} món):
              </div>
              <div className={styles.heroTotalText}>
                {vnd(heroOrder.finalAmount ?? heroOrder.totalAmount)}
              </div>
            </div>
            <Link
              href={`/orders/${heroOrder.id}`}
              className={`${styles.heroActionBtn} ${
                heroStatus === 'READY' ? styles.heroActionBtnReady : ''
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                {heroStatus === 'READY' ? 'qr_code_2' : 'visibility'}
              </span>
              <span>
                {heroStatus === 'READY' ? 'Mã nhận nước' : 'Xem tiến trình'}
              </span>
            </Link>
          </div>
        </section>
      )}

      {/* ── FILTER TABS (MOBILE HORIZONTAL SCROLL) ── */}
      <div className={styles.filterTabsRow}>
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`${styles.filterTabBtn} ${
              filter === tab.key ? styles.filterTabBtnActive : ''
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`${styles.tabBadge} ${
                filter === tab.key ? styles.tabBadgeActive : ''
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── ORDER HISTORY LIST SECTION ── */}
      <section>
        <div className={styles.listSectionHeader}>
          <h2 className={styles.listTitle}>
            Lịch sử giao dịch ({filteredOrders.length})
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {visibleOrders.some(
              (o) => o.status === 'CANCELLED' || o.status === 'PAYMENT_FAILED',
            ) && (
              <button
                type="button"
                onClick={handleCleanCancelled}
                className={styles.cleanBtn}
                title="Dọn dẹp các đơn đã hủy"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 14 }}
                >
                  cleaning_services
                </span>
                <span>Dọn đơn hủy</span>
              </button>
            )}
            {hiddenOrderIds.length > 0 && (
              <button
                type="button"
                onClick={handleRestoreHidden}
                className={styles.restoreBtn}
              >
                Khôi phục ({hiddenOrderIds.length})
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#786c67' }}>
            <span
              className="material-symbols-outlined animate-spin"
              style={{ fontSize: 28, color: '#845326' }}
            >
              progress_activity
            </span>
            <p style={{ marginTop: 8, fontSize: 13 }}>Đang tải lịch sử đơn...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Empty State */
          <div className={styles.emptyState}>
            <div className={styles.emptyIconWrap}>
              <span className="material-symbols-outlined" style={{ fontSize: 32 }}>
                receipt_long
              </span>
            </div>
            <h3 className={styles.emptyTitle}>Chưa có đơn hàng nào</h3>
            <p className={styles.emptyText}>
              {filter === 'all'
                ? 'Hãy khám phá thực đơn thức uống tươi ngon và đặt ly cà phê đầu tiên của bạn!'
                : 'Không tìm thấy đơn hàng trong danh mục này. Hãy thử kiểm tra mục khác.'}
            </p>
            <Link href="/menu" className={styles.emptyBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                coffee
              </span>
              <span>Khám phá thực đơn ngay</span>
            </Link>
          </div>
        ) : (
          <div className={styles.ordersList}>
            {filteredOrders.map((ord) => {
              const cfg = STATUS_CONFIG[ord.status] ?? STATUS_CONFIG['COMPLETED'];
              const isReady = ord.status === 'READY';
              const isPending = ord.status === 'PENDING';
              const isCancelled =
                ord.status === 'CANCELLED' || ord.status === 'PAYMENT_FAILED';
              const payMethod = ord.payments?.[0]?.method ?? 'CASHLESS';

              return (
                <article
                  key={ord.id}
                  className={`${styles.orderCard} ${
                    isReady ? styles.orderCardReady : ''
                  }`}
                >
                  {/* Top Row: Mã đơn & Trạng thái */}
                  <div className={styles.cardTopRow}>
                    <span className={styles.cardOrderCode}>{`#BL-${ord.id}`}</span>
                    <span
                      className={styles.cardStatusBadge}
                      style={{
                        background: cfg.bg,
                        color: cfg.color,
                        border: `1px solid ${cfg.border}`,
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 14 }}
                      >
                        {cfg.icon}
                      </span>
                      <span>{cfg.label}</span>
                    </span>
                  </div>

                  {/* Date & Barista info */}
                  <div className={styles.cardDateRow}>
                    <span>{formatDate(ord.createdAt)}</span>
                    {ord.staffName && (
                      <span className={styles.baristaTag}>
                        👨‍🍳 {ord.staffName}
                      </span>
                    )}
                  </div>

                  {/* Items Summary Preview */}
                  <div className={styles.cardItemsPreview}>
                    {ord.items && ord.items.length > 0 ? (
                      ord.items.map((it, idx) => (
                        <div key={idx} className={styles.cardItemLine}>
                          <span className={styles.cardItemName}>
                            <strong>{it.quantity}×</strong> {it.name || it.productName || 'Món nước'}
                            <span className={styles.cardItemCustom}>
                              {' '}(Size {it.size || 'M'}
                              {Array.isArray(it.toppings) && it.toppings.length > 0
                                ? `, +${it.toppings.join(', ')}`
                                : typeof it.toppings === 'string' && it.toppings
                                ? `, +${it.toppings}`
                                : ''})
                            </span>
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#2c1810' }}>
                            {vnd(it.unitPrice * it.quantity)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: 13, color: '#786c67' }}>
                        Đơn đặt thức uống BrewLite
                      </div>
                    )}
                  </div>

                  {/* Payment Info & Total */}
                  <div className={styles.cardMetaRow}>
                    <span className={styles.cardPayMethod}>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 15, color: '#845326' }}
                      >
                        credit_card
                      </span>
                      <span>
                        {payMethod === 'WALLET'
                          ? 'Ví BrewLite Pay'
                          : payMethod === 'MOMO'
                          ? 'Ví MoMo'
                          : payMethod === 'CARD'
                          ? 'Thẻ ngân hàng'
                          : payMethod}
                      </span>
                    </span>
                    <span className={styles.cardTotalAmount}>
                      {vnd(ord.finalAmount ?? ord.totalAmount)}
                    </span>
                  </div>

                  {/* Contextual Status Note */}
                  {isPending ? (
                    <div className={styles.cardNoteBox}>
                      <PendingCountdown
                        createdAt={ord.createdAt}
                        onExpire={() => void fetchOrders(false)}
                      />
                      <span>Đang giữ nguyên liệu tại quầy pha chế</span>
                    </div>
                  ) : ord.status === 'PAID' ? (
                    <div className={styles.cardNoteBox}>
                      <span>⏳ Đã gửi xuống quầy Barista • Dự kiến ~3-5 phút</span>
                    </div>
                  ) : ord.status === 'PREPARING' ? (
                    <div className={styles.cardNoteBox}>
                      <span style={{ color: '#845326', fontWeight: 700 }}>
                        ☕ Barista đang pha chế trực tiếp tại Trạm #01
                      </span>
                    </div>
                  ) : isReady ? (
                    <div
                      className={styles.cardNoteBox}
                      style={{ background: '#ecfdf5', color: '#047857' }}
                    >
                      <span style={{ fontWeight: 700 }}>
                        🔔 Mời bạn đến Kệ Express Bar 04 nhận đồ uống ngay!
                      </span>
                    </div>
                  ) : ord.status === 'COMPLETED' ? (
                    <div className={styles.cardNoteBox}>
                      <span>
                        ✅ Đã bàn giao thành công • +
                        {Math.floor((ord.finalAmount ?? ord.totalAmount) / 1000)} Hạt Vàng
                      </span>
                    </div>
                  ) : null}

                  {/* Action Buttons */}
                  <div className={styles.cardActionsRow}>
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleCancelSingleOrder(ord.id)}
                          className={styles.cardBtnSecondary}
                        >
                          Hủy đơn
                        </button>
                        <Link
                          href={`/checkout?orderId=${ord.id}`}
                          className={styles.cardBtnPrimary}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 16 }}
                          >
                            payments
                          </span>
                          <span>Thanh toán</span>
                        </Link>
                      </>
                    ) : isCancelled ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(ord.id)}
                          className={`${styles.cardBtnSecondary} ${styles.cardBtnDanger}`}
                          title="Ẩn đơn này khỏi danh sách"
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 16 }}
                          >
                            delete
                          </span>
                          <span>Xóa</span>
                        </button>
                        <Link
                          href={`/orders/${ord.id}`}
                          className={styles.cardBtnSecondary}
                        >
                          Chi tiết
                        </Link>
                      </>
                    ) : isReady ? (
                      <>
                        <Link
                          href={`/orders/${ord.id}`}
                          className={`${styles.cardBtnPrimary} ${styles.cardBtnReady}`}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 18 }}
                          >
                            qr_code_2
                          </span>
                          <span>Lấy nước ngay (QR)</span>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href={`/orders/${ord.id}`}
                          className={styles.cardBtnSecondary}
                        >
                          Chi tiết
                        </Link>
                        <Link
                          href="/menu"
                          className={styles.cardBtnPrimary}
                        >
                          Đặt lại
                        </Link>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ── FLOATING LIVE TOAST NOTIFICATION FROM BARISTA ── */}
      {liveToast && (
        <aside
          role="status"
          className={`${styles.floatingToast} ${
            liveToast.status === 'READY' ? styles.floatingToastReady : ''
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
            {liveToast.status === 'READY'
              ? 'notifications_active'
              : liveToast.status === 'COMPLETED'
              ? 'task_alt'
              : 'coffee_maker'}
          </span>
          <div style={{ flex: 1, fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>
            {liveToast.message}
          </div>
          <button
            type="button"
            onClick={() => setLiveToast(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            ✕
          </button>
        </aside>
      )}

      {/* ── FIXED MOBILE BOTTOM NAVIGATION BAR ── */}
      <nav className={styles.bottomNav}>
        <div className={styles.bottomNavInner}>
          <Link href="/menu" className={styles.navItem}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22 }}
            >
              coffee
            </span>
            <span>Thực đơn</span>
          </Link>

          <Link href="/cart" className={styles.navItem}>
            <div className={styles.navIconWrap}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 22 }}
              >
                shopping_cart
              </span>
              {totalCartCount > 0 && (
                <span className={styles.navBadge}>{totalCartCount}</span>
              )}
            </div>
            <span>Giỏ hàng</span>
          </Link>

          <Link
            href="/orders"
            className={`${styles.navItem} ${styles.navItemActive}`}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}
            >
              receipt_long
            </span>
            <span>Đơn hàng</span>
          </Link>

          <Link href="/promotions" className={styles.navItem}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22 }}
            >
              confirmation_number
            </span>
            <span>Ưu đãi</span>
          </Link>

          <Link href="/account" className={styles.navItem}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22 }}
            >
              account_circle
            </span>
            <span>Tài khoản</span>
          </Link>
        </div>
      </nav>
    </main>
  );
}
