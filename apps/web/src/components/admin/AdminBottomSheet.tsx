import React from 'react';
import styles from './admin.module.css';
import { CloseIcon } from './AdminIcons';

interface AdminBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  submitLabel?: string;
  onSubmit?: () => void;
  isSubmitting?: boolean;
}

export function AdminBottomSheet({
  isOpen,
  onClose,
  title,
  children,
  submitLabel = 'Lưu thay đổi',
  onSubmit,
  isSubmitting = false,
}: AdminBottomSheetProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.sheetOverlay} onClick={onClose} data-testid="bottom-sheet-overlay">
      <div
        className={styles.sheetContent}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
      >
        <div className={styles.sheetHeader}>
          <h3 id="sheet-title" className={styles.sheetTitle}>
            {title}
          </h3>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={onClose}
            aria-label="Đóng form"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div>{children}</div>

        {onSubmit && (
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={onSubmit}
            disabled={isSubmitting}
            data-testid="sheet-submit-btn"
          >
            {isSubmitting ? 'Đang lưu...' : submitLabel}
          </button>
        )}
      </div>
    </div>
  );
}
