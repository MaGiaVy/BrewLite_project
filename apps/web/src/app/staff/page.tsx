'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  apiClient,
  AUTH_STORAGE_KEY,
  type AuthSession,
} from '../../lib/api-client';
import {
  groupByStatus,
  sortOldestFirst,
  type StaffOrder,
  type StaffOrderItem,
} from '../../lib/staff-orders';
import { useBaristaQueue } from '../../lib/use-barista-queue';
import {
  StatusTabs,
  type StaffTabKey,
} from '../../components/staff/StatusTabs';
import { OrderCard } from '../../components/staff/OrderCard';
import { RecipeSheet } from '../../components/staff/RecipeSheet';
import { ConfirmDialog } from '../../components/staff/ConfirmDialog';
import { StockBanner } from '../../components/staff/StockBanner';
import {
  SoldOutSheet,
  type StaffProductItem,
} from '../../components/staff/SoldOutSheet';
import styles from '../../components/staff/staff.module.css';

function findNewPaidOrderIds(
  orders: StaffOrder[],
  prevPaidIds: Set<number>,
  hasLoadedOnce: boolean,
): {
  newPaidOrderIds: number[];
  nextPaidIds: Set<number>;
  nextHasLoadedOnce: boolean;
} {
  const nextPaidIds = new Set(
    orders.filter((o) => o.status === 'PAID').map((o) => o.id),
  );
  if (!hasLoadedOnce) {
    return {
      newPaidOrderIds: [],
      nextPaidIds,
      nextHasLoadedOnce: true,
    };
  }
  const newPaidOrderIds: number[] = [];
  for (const id of nextPaidIds) {
    if (!prevPaidIds.has(id)) {
      newPaidOrderIds.push(id);
    }
  }
  return {
    newPaidOrderIds,
    nextPaidIds,
    nextHasLoadedOnce: true,
  };
}

function playWebAudioChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const freqs = [659.25, 987.77];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);
      gain.gain.setValueAtTime(0.18, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.46);
    });
  } catch {
    // Ignore audio context block if user hasn't interacted yet
  }
}

function readStoredUser(): AuthSession['user'] {
  if (typeof window === 'undefined') return null;
  const keys = Array.from(
    new Set([AUTH_STORAGE_KEY, 'brewlite-auth-storage', 'brewlite-auth']),
  );
  for (const key of keys) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as { state?: AuthSession } & AuthSession;
      const candidate = parsed?.state?.user ?? parsed?.user ?? null;
      if (candidate) return candidate;
    } catch {
      // ignore malformed storage value and continue to fallback key
    }
  }
  return null;
}

export default function StaffBaristaKdsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<StaffTabKey>('PAID');
  const [selectedRecipeItem, setSelectedRecipeItem] = useState<StaffOrderItem | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    order: StaffOrder;
    next: 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
    title: string;
    confirmLabel: string;
  } | null>(null);

  const [lowStockItems, setLowStockItems] = useState<string[]>([]);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [products, setProducts] = useState<StaffProductItem[]>([]);
  const [soldOutOpen, setSoldOutOpen] = useState<boolean>(false);
  const [busyProductId, setBusyProductId] = useState<number | null>(null);
  const [soldOutError, setSoldOutError] = useState<string | null>(null);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPaidIdsRef = useRef<Set<number>>(new Set());
  const hasLoadedQueueOnceRef = useRef<boolean>(false);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // 1. Role Guard: only STAFF and ADMIN
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const user = readStoredUser();
    const role = user?.role;
    if (role === 'STAFF' || role === 'ADMIN') {
      setAuthorized(true);
    } else {
      router.replace('/login?redirect=%2Fstaff');
      setAuthorized(false);
    }
  }, [router]);

  // 2. Barista Queue Polling Hook (only starts once authorized)
  const { orders, error, pendingId, transition } = useBaristaQueue(3000, authorized === true);
  const initialOrdersRef = useRef<StaffOrder[]>(orders);

  // 2b. Chime + Toast on newly arriving PAID orders (even after empty queue)
  useEffect(() => {
    if (!authorized) return;
    if (!hasLoadedQueueOnceRef.current && orders === initialOrdersRef.current) {
      return;
    }
    const { newPaidOrderIds, nextPaidIds, nextHasLoadedOnce } =
      findNewPaidOrderIds(
        orders,
        prevPaidIdsRef.current,
        hasLoadedQueueOnceRef.current,
      );
    if (newPaidOrderIds.length > 0 && soundEnabled) {
      playWebAudioChime();
      showToast(`🔔 Đơn mới #BL-${newPaidOrderIds[0]} vừa thanh toán!`);
    }
    prevPaidIdsRef.current = nextPaidIds;
    hasLoadedQueueOnceRef.current = nextHasLoadedOnce;
  }, [authorized, orders, soundEnabled, showToast]);

  // 3. Low stock & products polling (inventory ingredients + /products for 86 control)
  const fetchProducts = useCallback(async () => {
    try {
      const res = await apiClient('/products', { cache: 'no-store' });
      if (!res.ok) return;
      const payload = await res.json();
      const rawList = Array.isArray(payload) ? payload : payload?.data ?? [];
      if (!Array.isArray(rawList)) return;
      setProducts(
        rawList.map((p: any) => {
          const outOfStockSizes = Array.isArray(p.outOfStockSizes)
            ? p.outOfStockSizes
            : [];
          const isOutOfStock = Boolean(p.isOutOfStock);
          // Backend omits isSoldOutManual for STAFF on GET /products; infer manual 86 when out of stock without shortage sizes
          const isSoldOutManual =
            typeof p.isSoldOutManual === 'boolean'
              ? p.isSoldOutManual
              : isOutOfStock && outOfStockSizes.length === 0;
          return {
            id: Number(p.id),
            name: String(p.name || `Món #${p.id}`),
            price: Number(p.price ?? p.basePrice ?? 0),
            isOutOfStock,
            availableServings: Number(p.availableServings ?? 0),
            isSoldOutManual,
          };
        }),
      );
      setSoldOutError(null);
    } catch {
      // Ignore transient network errors when polling product availability
    }
  }, []);

  useEffect(() => {
    if (!authorized) return;
    let active = true;

    const fetchInventory = async () => {
      try {
        const res = await apiClient('/inventory/ingredients', { cache: 'no-store' });
        if (!res.ok) {
          if (active) setInventoryError('Không thể kiểm tra cảnh báo tồn kho nguyên liệu');
          return;
        }
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.data ?? [];
        const low = list
          .filter((i: any) => i.status === 'LOW_STOCK' || i.status === 'OUT_OF_STOCK')
          .map((i: any) => i.name || `Nguyên liệu #${i.id}`);
        if (active) {
          setLowStockItems(low);
          setInventoryError(null);
        }
      } catch {
        if (active) {
          setInventoryError('Không thể kiểm tra cảnh báo tồn kho nguyên liệu');
        }
      }
    };

    fetchInventory();
    fetchProducts();
    const invTimer = setInterval(() => {
      fetchInventory();
      fetchProducts();
    }, 15000);
    return () => {
      active = false;
      clearInterval(invTimer);
    };
  }, [authorized, fetchProducts]);

  const handleToggleSoldOut = async (product: StaffProductItem) => {
    if (busyProductId !== null) return;
    const nextSoldOut = !product.isSoldOutManual;
    setBusyProductId(product.id);
    setSoldOutError(null);
    try {
      const res = await apiClient(`/products/${product.id}/sold-out`, {
        method: 'PATCH',
        body: JSON.stringify({ isSoldOutManual: nextSoldOut }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg =
          (Array.isArray(err?.message) ? err.message.join(', ') : err?.message) ||
          `Không thể cập nhật trạng thái món ${product.name}`;
        setSoldOutError(msg);
        return;
      }
      const updated = await res.json().catch(() => null);
      const confirmedSoldOut =
        typeof updated?.isSoldOutManual === 'boolean'
          ? updated.isSoldOutManual
          : nextSoldOut;
      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                isSoldOutManual: confirmedSoldOut,
                isOutOfStock:
                  typeof updated?.isOutOfStock === 'boolean'
                    ? updated.isOutOfStock
                    : confirmedSoldOut,
                availableServings:
                  typeof updated?.availableServings === 'number'
                    ? updated.availableServings
                    : confirmedSoldOut
                    ? 0
                    : item.availableServings,
              }
            : item,
        ),
      );
      showToast(
        confirmedSoldOut
          ? `🚫 Đã báo hết món (86): ${product.name}`
          : `✅ Đã mở bán lại: ${product.name}`,
      );
    } catch {
      setSoldOutError(`Lỗi kết nối khi cập nhật 86 cho ${product.name}`);
    } finally {
      setBusyProductId(null);
    }
  };

  // 4. Group & Sort orders
  const grouped = useMemo(() => groupByStatus(orders), [orders]);

  const activeOrdersCount = useMemo(() => {
    return grouped.PAID.length + grouped.PREPARING.length + grouped.READY.length;
  }, [grouped]);

  const displayedOrders = useMemo(() => {
    const list = grouped[activeTab] || [];
    if (activeTab === 'COMPLETED') {
      return [...list].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    return sortOldestFirst(list);
  }, [grouped, activeTab]);

  // 5. Actions
  const handleAction = (
    order: StaffOrder,
    next: 'PREPARING' | 'READY' | 'COMPLETED',
  ) => {
    if (next === 'COMPLETED') {
      setConfirmModal({
        order,
        next: 'COMPLETED',
        title: `Xác nhận đơn #BL-${order.id} đã hoàn tất và giao cho khách?`,
        confirmLabel: 'Xác nhận giao khách',
      });
      return;
    }
    transition(order.id, next);
  };

  const handleCancel = (order: StaffOrder) => {
    setConfirmModal({
      order,
      next: 'CANCELLED',
      title: `Xác nhận hủy đơn #BL-${order.id}? Tồn kho BOM sẽ được hoàn lại.`,
      confirmLabel: 'Xác nhận hủy đơn',
    });
  };

  const executeConfirmModal = () => {
    if (!confirmModal) return;
    const { order, next } = confirmModal;
    setConfirmModal(null);
    transition(order.id, next);
  };

  if (authorized === null) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>Đang kiểm tra quyền truy cập...</div>
      </div>
    );
  }

  if (authorized === false) {
    return null;
  }

  const counts: Record<StaffTabKey, number> = {
    PAID: grouped.PAID.length,
    PREPARING: grouped.PREPARING.length,
    READY: grouped.READY.length,
    COMPLETED: grouped.COMPLETED.length,
  };

  const soldOutCount = useMemo(
    () => products.filter((p) => p.isSoldOutManual).length,
    [products],
  );

  const displayError = error || inventoryError;

  return (
    <div className={styles.container}>
      {/* Toast notification */}
      {toastMsg && (
        <div className={styles.toastBanner} role="status">
          {toastMsg}
        </div>
      )}

      {/* Stock warning banner */}
      <StockBanner lowItems={lowStockItems} />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <span>☕ BrewLite · Quầy bar KDS</span>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={`${styles.headerActionBtn} ${
              soundEnabled ? styles.headerActionBtnActive : ''
            }`}
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playWebAudioChime();
            }}
            aria-label="Bật hoặc tắt chuông báo đơn mới"
          >
            {soundEnabled ? '🔊 Chuông' : '🔇 Tắt'}
          </button>
          <button
            type="button"
            className={`${styles.headerActionBtn} ${
              soldOutCount > 0 ? styles.headerActionBtnDanger : ''
            }`}
            onClick={() => {
              setSoldOutError(null);
              setSoldOutOpen(true);
              void fetchProducts();
            }}
          >
            🚫 Báo hết món (86){soldOutCount > 0 ? ` · ${soldOutCount}` : ''}
          </button>
          <span className={styles.totalChip}>{activeOrdersCount} đơn chờ</span>
        </div>
      </header>

      {/* Error notification if polling or transition fails */}
      {displayError && (
        <div
          role="alert"
          style={{
            background: '#fffbeb',
            color: '#b45309',
            fontSize: '12px',
            fontWeight: 700,
            padding: '6px 16px',
            borderBottom: '1px solid #fef3c7',
            textAlign: 'center',
          }}
        >
          ⚠️ {displayError}
        </div>
      )}

      {/* Status tabs */}
      <StatusTabs counts={counts} active={activeTab} onChange={setActiveTab} />

      {/* Order card list */}
      <main className={styles.orderList}>
        {displayedOrders.length === 0 ? (
          <div className={styles.emptyState}>Không có đơn</div>
        ) : (
          displayedOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              busy={pendingId === order.id}
              onAction={handleAction}
              onCancel={handleCancel}
              onOpenRecipe={(item) => setSelectedRecipeItem(item)}
            />
          ))
        )}
      </main>

      {/* Bottom Nav */}
      <nav className={styles.bottomNav}>
        <button
          type="button"
          className={`${styles.navItem} ${
            activeTab !== 'COMPLETED' ? styles.navItemActive : ''
          }`}
          onClick={() => setActiveTab('PAID')}
        >
          📋 Đơn đang pha ({activeOrdersCount})
        </button>
        <button
          type="button"
          className={`${styles.navItem} ${
            activeTab === 'COMPLETED' ? styles.navItemActive : ''
          }`}
          onClick={() => setActiveTab('COMPLETED')}
        >
          ✅ Lịch sử đã xong ({grouped.COMPLETED.length})
        </button>
      </nav>

      {/* Recipe Sheet Bottom Modal */}
      {selectedRecipeItem && (
        <RecipeSheet
          item={selectedRecipeItem}
          onClose={() => setSelectedRecipeItem(null)}
        />
      )}

      {/* Sold-Out (86) Sheet */}
      {soldOutOpen && (
        <SoldOutSheet
          products={products}
          busyProductId={busyProductId}
          error={soldOutError}
          onToggleSoldOut={handleToggleSoldOut}
          onClose={() => setSoldOutOpen(false)}
        />
      )}

      {/* Confirm Dialog */}
      {confirmModal && (
        <ConfirmDialog
          title={confirmModal.title}
          confirmLabel={confirmModal.confirmLabel}
          onConfirm={executeConfirmModal}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
