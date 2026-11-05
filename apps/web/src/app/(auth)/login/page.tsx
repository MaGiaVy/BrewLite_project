'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { setAuthSession } from '../../../lib/api-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '/menu';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Email không đúng định dạng. Vui lòng kiểm tra lại.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data?.message)
          ? data.message.join('; ')
          : (data?.message ?? 'Email hoặc mật khẩu không chính xác.');
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
        Đăng nhập BrewLite
      </h1>
      <p style={{ color: '#504440', marginBottom: 24 }}>
        Đăng nhập để đặt món không tiền mặt và tích điểm Hạt Vàng
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            Mật khẩu
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
          {isLoading ? 'Đang xử lý...' : 'Đăng nhập vào BrewLite'}
        </button>
      </form>

      <p style={{ marginTop: 16, fontSize: 14 }}>
        Chưa có tài khoản?{' '}
        <Link href="/register" style={{ color: '#845326', fontWeight: 600 }}>
          Đăng ký ngay
        </Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: 32 }}>Đang tải...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
