'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/Logo';

export default function RegisterPage() {
  const router = useRouter();
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

    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      setError('Mật khẩu phải chứa cả chữ cái và chữ số');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      await register(email, password, confirmPassword);
      router.push('/');
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
      {/* Logo / Tiêu đề */}
      <div className="mb-2">
        <Logo size="lg" />
      </div>
      <p className="text-stone-500 mb-8">
        Tạo tài khoản để bắt đầu đặt cà phê và trà yêu thích.
      </p>

      {/* Thông báo lỗi */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form đăng ký */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-stone-700 mb-1"
          >
            Địa chỉ Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="xincho@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-stone-800 placeholder-stone-400 outline-none transition focus:border-stone-500 focus:ring-1 focus:ring-stone-500"
            autoComplete="email"
          />
        </div>

        {/* Mật khẩu */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-stone-700 mb-1"
          >
            Mật khẩu
          </label>
          <input
            id="password"
            type="password"
            placeholder="Ít nhất 8 ký tự (có chữ và số)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-stone-800 placeholder-stone-400 outline-none transition focus:border-stone-500 focus:ring-1 focus:ring-stone-500"
            autoComplete="new-password"
          />
        </div>

        {/* Xác nhận mật khẩu */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-stone-700 mb-1"
          >
            Xác nhận mật khẩu
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-stone-800 placeholder-stone-400 outline-none transition focus:border-stone-500 focus:ring-1 focus:ring-stone-500"
            autoComplete="new-password"
          />
        </div>

        {/* Nút đăng ký */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-[#6F4E37] py-3 text-base font-semibold text-white transition hover:bg-[#5C3D2E] focus:outline-none focus:ring-2 focus:ring-[#6F4E37] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Đang xử lý...' : 'Tạo Tài Khoản'}
        </button>
      </form>

      {/* Link sang trang đăng nhập */}
      <p className="mt-6 text-center text-sm text-stone-500">
        Đã có tài khoản?{' '}
        <Link
          href="/auth/login"
          className="font-semibold text-stone-700 hover:text-stone-900 underline underline-offset-2 transition"
        >
          Đăng nhập ngay
        </Link>
      </p>
    </div>
  );
}
