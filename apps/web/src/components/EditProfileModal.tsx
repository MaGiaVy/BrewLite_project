'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuthStore } from '../stores/auth-store';
import styles from './EditProfileModal.module.css';

export interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  onSuccess,
}: EditProfileModalProps) {
  const { user, updateProfile } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFullName(user?.fullName || 'Huỳnh Tuấn Kiệt');
      setPhone(user?.phone || '0988 888 888');
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setErrorMessage('Vui lòng nhập họ và tên của bạn.');
      return;
    }

    if (isChangingPassword) {
      if (!currentPassword) {
        setErrorMessage('Vui lòng nhập mật khẩu hiện tại.');
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        setErrorMessage('Mật khẩu mới phải có ít nhất 6 ký tự.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('Mật khẩu xác nhận không khớp.');
        return;
      }
    }

    setIsLoading(true);

    try {
      // Cập nhật store Zustand
      updateProfile({
        fullName: trimmedName,
        phone: phone.trim() || undefined,
      });

      const successNotice = isChangingPassword
        ? 'Cập nhật hồ sơ & đổi mật khẩu thành công!'
        : 'Cập nhật thông tin hồ sơ thành công!';

      setSuccessMessage(successNotice);
      if (onSuccess) {
        onSuccess(successNotice);
      }

      setTimeout(() => {
        setIsLoading(false);
        onClose();
      }, 700);
    } catch {
      setErrorMessage('Đã xảy ra lỗi khi lưu thông tin. Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  return (
    <div
      className={styles.modalBackdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Chỉnh sửa hồ sơ"
    >
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.titleRow}>
            <div className={styles.iconWrap}>
              <User size={20} />
            </div>
            <div>
              <h3 className={styles.modalTitle}>Chỉnh sửa hồ sơ</h3>
              <p className={styles.modalSubtitle}>Cập nhật thông tin tài khoản BrewLite</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Đóng cửa sổ"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {errorMessage && (
              <div className={styles.errorMessage} role="alert">
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className={styles.successMessage} role="status">
                <CheckCircle2 size={16} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Họ và tên */}
            <div className={styles.formGroup}>
              <label htmlFor="edit-fullname" className={styles.label}>
                <User size={13} color="#845326" />
                <span>Họ và tên</span>
              </label>
              <div className={styles.inputWrap}>
                <User size={16} className={styles.inputIcon} />
                <input
                  id="edit-fullname"
                  type="text"
                  className={styles.input}
                  placeholder="Nhập họ và tên..."
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email (Readonly) */}
            <div className={styles.formGroup}>
              <label htmlFor="edit-email" className={styles.label}>
                <Mail size={13} color="#845326" />
                <span>Email tài khoản (Cố định)</span>
              </label>
              <div className={styles.inputWrap}>
                <Mail size={16} className={styles.inputIcon} />
                <input
                  id="edit-email"
                  type="email"
                  className={`${styles.input} ${styles.inputDisabled}`}
                  value={user?.email || 'tuankiet.huynh@brewlite.vn'}
                  readOnly
                  disabled
                />
              </div>
            </div>

            {/* Số điện thoại */}
            <div className={styles.formGroup}>
              <label htmlFor="edit-phone" className={styles.label}>
                <Phone size={13} color="#845326" />
                <span>Số điện thoại</span>
              </label>
              <div className={styles.inputWrap}>
                <Phone size={16} className={styles.inputIcon} />
                <input
                  id="edit-phone"
                  type="tel"
                  className={styles.input}
                  placeholder="0988 888 888"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Đổi mật khẩu toggle */}
            <div className={styles.passwordToggleSection}>
              <button
                type="button"
                className={styles.toggleBtn}
                onClick={() => setIsChangingPassword(!isChangingPassword)}
              >
                <ShieldCheck size={16} />
                <span>{isChangingPassword ? 'Hủy đổi mật khẩu' : 'Đổi mật khẩu tài khoản'}</span>
                {isChangingPassword ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {isChangingPassword && (
                <div className={styles.passwordFields}>
                  {/* Current Password */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Mật khẩu hiện tại</label>
                    <div className={styles.inputWrap}>
                      <Lock size={15} className={styles.inputIcon} />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        className={styles.input}
                        placeholder="Nhập mật khẩu hiện tại..."
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className={styles.eyeBtn}
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        aria-label="Ẩn hiện mật khẩu"
                      >
                        {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Mật khẩu mới (ít nhất 6 ký tự)</label>
                    <div className={styles.inputWrap}>
                      <Lock size={15} className={styles.inputIcon} />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        className={styles.input}
                        placeholder="Mật khẩu mới..."
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className={styles.eyeBtn}
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label="Ẩn hiện mật khẩu"
                      >
                        {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Xác nhận mật khẩu mới</label>
                    <div className={styles.inputWrap}>
                      <Lock size={15} className={styles.inputIcon} />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className={styles.input}
                        placeholder="Nhập lại mật khẩu mới..."
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className={styles.eyeBtn}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label="Ẩn hiện mật khẩu"
                      >
                        {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={isLoading}
            >
              <CheckCircle2 size={16} />
              <span>{isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
