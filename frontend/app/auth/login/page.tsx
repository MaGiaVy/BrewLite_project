'use client';

import { useState, FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/Logo';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/checkout';
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validate cơ bản phía client
    if (!email.trim()) {
      setError('Vui lòng nhập địa chỉ email');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    try {
      await login(email, password);
      // Đăng nhập thành công -> chuyển thẳng sang trang redirect (mặc định /checkout)
      router.push(redirectPath);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Đăng nhập thất bại. Vui lòng thử lại.';
      setError(message);
    }
  };

  return (
    <div>
      {/* Logo thương hiệu */}
      <div className="mb-6">
        <Logo size="lg" />
      </div>

      <h1 className="text-3xl font-serif font-bold text-[#2A1810] mb-1.5">
        Đăng nhập
      </h1>
      <p className="text-sm text-[#6B5D52] mb-6">
        Đăng nhập để đặt cà phê, tích lũy điểm thưởng và thanh toán siêu tốc.
      </p>

      {/* Thông báo lỗi */}
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs sm:text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form đăng nhập */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-bold text-[#2A1810] mb-1"
          >
            Địa chỉ Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="khach@brewlite.vn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-[#E8E5E1] bg-white px-4 py-3 text-sm text-[#2A1810] placeholder-stone-400 outline-none transition focus:border-[#2A1810] focus:ring-1 focus:ring-[#2A1810]"
            autoComplete="email"
          />
        </div>

        {/* Mật khẩu */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-bold text-[#2A1810] mb-1"
          >
            Mật khẩu
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-[#E8E5E1] bg-white px-4 py-3 text-sm text-[#2A1810] placeholder-stone-400 outline-none transition focus:border-[#2A1810] focus:ring-1 focus:ring-[#2A1810]"
            autoComplete="current-password"
          />
        </div>

        {/* Nút đăng nhập */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-[#2A1810] py-3.5 text-sm font-bold text-white transition hover:bg-[#42271A] focus:outline-none focus:ring-2 focus:ring-[#C28B5B] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mt-2"
        >
          {isLoading ? 'Đang xác thực...' : 'Đăng Nhập'}
        </button>
      </form>

      {/* Link sang trang đăng ký */}
      <p className="mt-6 text-center text-xs text-[#6B5D52]">
        Bạn chưa có tài khoản?{' '}
        <Link
          href={`/auth/register${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
          className="font-bold text-[#2A1810] hover:text-[#C28B5B] underline underline-offset-2 transition"
        >
          Tạo tài khoản mới
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[#6B5D52]">Đang tải...</div>}>
      <LoginForm />
    </Suspense>
  );
}
