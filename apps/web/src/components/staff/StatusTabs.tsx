import React from 'react';
import styles from './staff.module.css';

export type StaffTabKey = 'PAID' | 'PREPARING' | 'READY' | 'COMPLETED';

export interface StatusTabsProps {
  counts: Record<StaffTabKey, number>;
  active: StaffTabKey;
  onChange: (tab: StaffTabKey) => void;
}

export function StatusTabs({ counts, active, onChange }: StatusTabsProps) {
  const tabs: Array<{ key: StaffTabKey; label: string }> = [
    { key: 'PAID', label: 'Mới' },
    { key: 'PREPARING', label: 'Đang pha' },
    { key: 'READY', label: 'Sẵn sàng' },
    { key: 'COMPLETED', label: 'Lịch sử' },
  ];

  return (
    <div className={styles.tabsContainer} role="tablist">
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ''}`}
            onClick={() => onChange(t.key)}
          >
            <span>{t.label}</span>
            <span className={styles.tabCount}>{counts[t.key] || 0}</span>
          </button>
        );
      })}
    </div>
  );
}
