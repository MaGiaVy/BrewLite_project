'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
import styles from '../../components/staff/staff.module.css';

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

  // 3. Low stock polling (inventory ingredients)
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
    const invTimer = setInterval(fetchInventory, 15000);
    return () => {
      active = false;
      clearInterval(invTimer);
    };
  }, [authorized]);

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

  const displayError = error || inventoryError;

  return (
    <div className={styles.container}>
      {/* Stock warning banner */}
      <StockBanner lowItems={lowStockItems} />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <span>☕ BrewLite · Quầy bar KDS</span>
        </div>
        <span className={styles.totalChip}>{activeOrdersCount} đơn chờ</span>
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
