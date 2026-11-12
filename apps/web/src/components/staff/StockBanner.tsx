import React from 'react';
import styles from './staff.module.css';

export interface StockBannerProps {
  lowItems: string[];
}

export function StockBanner({ lowItems }: StockBannerProps) {
  if (!lowItems || lowItems.length === 0) return null;

  return (
    <div className={styles.stockBanner} role="alert">
      <span>⚠️ Sắp hết: {lowItems.join(', ')}</span>
    </div>
  );
}
