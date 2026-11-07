'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { setAuthSession } from '../../../lib/api-client';

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
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Họ và tên không được để trống.');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Email không đúng định dạng. Vui lòng kiểm tra lại.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp. Vui lòng thử lại.');
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
          email: email.trim(),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data?.message)
          ? data.message.join('; ')
          : (data?.message ?? 'Đăng ký thất bại, vui lòng thử lại.');
        throw new Error(msg);
      }

      setAuthSession({
        token: data.accessToken,
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
    <main style={{ maxWidth: 460, margin: '48px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        Tạo tài khoản BrewLite
      </h1>
      <p style={{ color: '#504440', marginBottom: 24 }}>
        Trải nghiệm gọi món không chạm và tích lũy ưu đãi độc quyền
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label htmlFor="fullName" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
            Họ và tên
          </label>
          <input
            id="fullName"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Mã Gia Vỹ"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d6ccc2' }}
          />
        </div>

        <div>
          <label htmlFor="phone" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
            Số điện thoại nhận món
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0901234567"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d6ccc2' }}
          />
        </div>

        <div>
          <label htmlFor="email" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
            Email tài khoản
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="3124410414@sv.sgu.edu.vn"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d6ccc2' }}
          />
        </div>

        <div>
          <label htmlFor="password" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
            Mật khẩu (tối thiểu 6 ký tự)
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d6ccc2' }}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
            Xác nhận mật khẩu
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d6ccc2' }}
          />
        </div>

        {error && (
          <div
            role="alert"
            style={{
              background: '#fef2f2',
              color: '#b91c1c',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #fecaca',
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            background: '#2c1810',
            color: '#fff',
            fontWeight: 600,
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? 'Đang xử lý...' : 'Tạo tài khoản & Đặt món ngay'}
        </button>
      </form>

      <p style={{ marginTop: 16, fontSize: 14 }}>
        Đã có tài khoản?{' '}
        <Link href="/login" style={{ color: '#845326', fontWeight: 600 }}>
          Đăng nhập
        </Link>
      </p>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ padding: 32 }}>Đang tải...</div>}>
      <RegisterFormContent />
    </Suspense>
  );
}
