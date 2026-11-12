import React from 'react';
import styles from './admin.module.css';
import { ChartIcon, CupIcon, BoxIcon, UsersIcon } from './AdminIcons';

export type AdminTabKey = 'overview' | 'menu' | 'inventory' | 'management';

interface AdminBottomBarProps {
  activeTab: AdminTabKey;
  onSelectTab: (tab: AdminTabKey) => void;
  hasLowStock?: boolean;
}

export function AdminBottomBar({
  activeTab,
  onSelectTab,
  hasLowStock = false,
}: AdminBottomBarProps) {
  return (
    <nav className={styles.bottomNav} aria-label="Thanh điều hướng quản trị">
      <button
        type="button"
        className={`${styles.tabItem} ${activeTab === 'overview' ? styles.tabItemActive : ''}`}
        onClick={() => onSelectTab('overview')}
        data-testid="tab-overview"
        aria-selected={activeTab === 'overview'}
      >
        <ChartIcon size={20} />
        <span className={styles.tabLabel}>Tổng quan</span>
      </button>

      <button
        type="button"
        className={`${styles.tabItem} ${activeTab === 'menu' ? styles.tabItemActive : ''}`}
        onClick={() => onSelectTab('menu')}
        data-testid="tab-menu"
        aria-selected={activeTab === 'menu'}
      >
        <CupIcon size={20} />
        <span className={styles.tabLabel}>Thực đơn</span>
      </button>

      <button
        type="button"
        className={`${styles.tabItem} ${activeTab === 'inventory' ? styles.tabItemActive : ''}`}
        onClick={() => onSelectTab('inventory')}
        data-testid="tab-inventory"
        aria-selected={activeTab === 'inventory'}
      >
        <BoxIcon size={20} />
        {hasLowStock && <span className={styles.tabBadge} aria-label="Cảnh báo tồn kho" />}
        <span className={styles.tabLabel}>Kho BOM</span>
      </button>

      <button
        type="button"
        className={`${styles.tabItem} ${activeTab === 'management' ? styles.tabItemActive : ''}`}
        onClick={() => onSelectTab('management')}
        data-testid="tab-management"
        aria-selected={activeTab === 'management'}
      >
        <UsersIcon size={20} />
        <span className={styles.tabLabel}>Quản trị</span>
      </button>
    </nav>
  );
}
