'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User, Phone, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { setAuthSession } from '../../../lib/api-client';
import styles from '../auth.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '/menu';

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Họ và tên không được để trống.');
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Email không đúng định dạng. Vui lòng kiểm tra lại.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    if (!agreeTerms) {
      setError('Vui lòng đồng ý với điều khoản dịch vụ và chính sách thành viên của BrewLite để tiếp tục.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim() || undefined,
          email: trimmedEmail,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data?.message)
          ? data.message.join('; ')
          : (data?.message ?? 'Đăng ký không thành công, vui lòng thử lại.');
        throw new Error(msg);
      }

      setAuthSession({
        token: data.accessToken ?? data.token,
        user: data.user,
      });

      router.push(redirectParam);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Đã xảy ra lỗi, vui lòng thử lại.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className={styles.authHeader}>
        <h1 className={styles.authHeading}>Tạo tài khoản BrewLite</h1>
        <p className={styles.authSubheading}>
          Đăng ký để đặt món không tiền mặt và tích điểm ưu đãi thành viên BrewLite.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        {/* 1. Họ và tên */}
        <div className={styles.fieldGroup}>
          <label htmlFor="fullName" className={styles.fieldLabel}>
            Họ và tên
          </label>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon}>
              <User size={18} />
            </span>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Huỳnh Tuấn Kiệt"
              className={styles.input}
              style={{ minHeight: 48 }}
            />
          </div>
        </div>

        {/* 2. Số điện thoại nhận món */}
        <div className={styles.fieldGroup}>
          <label htmlFor="phone" className={styles.fieldLabel}>
            Số điện thoại nhận món
          </label>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon}>
              <Phone size={18} />
            </span>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0901234567"
              className={styles.input}
              style={{ minHeight: 48 }}
            />
          </div>
        </div>

        {/* 3. Email tài khoản */}
        <div className={styles.fieldGroup}>
          <label htmlFor="email" className={styles.fieldLabel}>
            Email tài khoản
          </label>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon}>
              <Mail size={18} />
            </span>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user123@gmail.com"
              className={styles.input}
              style={{ minHeight: 48 }}
            />
          </div>
        </div>

        {/* 4. Mật khẩu */}
        <div className={styles.fieldGroup}>
          <label htmlFor="password" className={styles.fieldLabel}>
            Mật khẩu (tối thiểu 6 ký tự)
          </label>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon}>
              <Lock size={18} />
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              className={styles.input}
              style={{ minHeight: 48 }}
            />
            <button
              type="button"
              aria-label="Toggle password visibility"
              className={styles.toggleEyeBtn}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* 5. Xác nhận mật khẩu */}
        <div className={styles.fieldGroup}>
          <label htmlFor="confirmPassword" className={styles.fieldLabel}>
            Xác nhận lại mật khẩu
          </label>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon}>
              <Lock size={18} />
            </span>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Xác nhận mật khẩu"
              className={styles.input}
              style={{ minHeight: 48 }}
            />
            <button
              type="button"
              aria-label="Toggle confirm password visibility"
              className={styles.toggleEyeBtn}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* 6. Checkbox điều khoản */}
        <label htmlFor="agreeTerms" className={styles.checkboxRow}>
          <input
            id="agreeTerms"
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className={styles.checkboxInput}
          />
          <span>Tôi đồng ý với điều khoản dịch vụ và chính sách thành viên của BrewLite</span>
        </label>

        {error && (
          <div role="alert" className={styles.errorAlert}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={styles.submitBtn}
          style={{ minHeight: 48 }}
        >
          {isLoading ? (
            <span>Đang tạo tài khoản...</span>
          ) : (
            <>
              <span>Đăng ký tài khoản ngay</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 32, textAlign: 'center', color: '#504440' }}>
          Đang tải màn hình đăng ký...
        </div>
      }
    >
      <RegisterFormContent />
    </Suspense>
  );
}
