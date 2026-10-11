'use client';

import { useState, FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/Logo';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/checkout';
  const { register, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validate cơ bản phía client
    if (!email.trim()) {
      setError('Vui lòng nhập địa chỉ email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Email không đúng định dạng');
      return;
    }

    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      await register(email, password, confirmPassword);
      // Đăng ký thành công -> chuyển thẳng sang trang redirect (mặc định /checkout)
      router.push(redirectPath);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Đăng ký thất bại. Vui lòng thử lại.';
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
        Tạo tài khoản
      </h1>
      <p className="text-sm text-[#6B5D52] mb-6">
        Tạo tài khoản để bắt đầu đặt cà phê, nhận ưu đãi và tích lũy điểm thưởng.
      </p>

      {/* Thông báo lỗi */}
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs sm:text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form đăng ký */}
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
            Mật khẩu (≥ 6 ký tự)
          </label>
          <input
            id="password"
            type="password"
            placeholder="Ít nhất 6 ký tự"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-[#E8E5E1] bg-white px-4 py-3 text-sm text-[#2A1810] placeholder-stone-400 outline-none transition focus:border-[#2A1810] focus:ring-1 focus:ring-[#2A1810]"
            autoComplete="new-password"
          />
        </div>

        {/* Xác nhận mật khẩu */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-bold text-[#2A1810] mb-1"
          >
            Xác nhận mật khẩu
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-[#E8E5E1] bg-white px-4 py-3 text-sm text-[#2A1810] placeholder-stone-400 outline-none transition focus:border-[#2A1810] focus:ring-1 focus:ring-[#2A1810]"
            autoComplete="new-password"
          />
        </div>

        {/* Nút đăng ký */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-[#2A1810] py-3.5 text-sm font-bold text-white transition hover:bg-[#42271A] focus:outline-none focus:ring-2 focus:ring-[#C28B5B] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mt-2"
        >
          {isLoading ? 'Đang tạo tài khoản...' : 'Tạo Tài Khoản'}
        </button>
      </form>

      {/* Link sang trang đăng nhập */}
      <p className="mt-6 text-center text-xs text-[#6B5D52]">
        Đã có tài khoản?{' '}
        <Link
          href={`/auth/login${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
          className="font-bold text-[#2A1810] hover:text-[#C28B5B] underline underline-offset-2 transition"
        >
          Đăng nhập ngay
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[#6B5D52]">Đang tải...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
