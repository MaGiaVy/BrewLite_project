import React from 'react';
import styles from './staff.module.css';
import { AlertTriangleIcon } from '../admin/AdminIcons';

export interface StockBannerProps {
  lowItems: string[];
}

export function StockBanner({ lowItems }: StockBannerProps) {
  if (!lowItems || lowItems.length === 0) return null;

  return (
    <div className={styles.stockBanner} role="alert">
      <AlertTriangleIcon size={14} className={styles.alertIcon} />
      <span>Sắp hết: {lowItems.join(', ')}</span>
    </div>
  );
}
