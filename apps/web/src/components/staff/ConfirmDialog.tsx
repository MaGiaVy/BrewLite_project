import React, { useEffect } from 'react';
import styles from './staff.module.css';

export interface ConfirmDialogProps {
  title: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Quay lại',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.dialogContent}>
        <div className={styles.dialogTitle}>{title}</div>
        <div className={styles.dialogActions}>
          <button
            type="button"
            className={styles.btnDialogCancel}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={styles.btnDialogConfirm}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
