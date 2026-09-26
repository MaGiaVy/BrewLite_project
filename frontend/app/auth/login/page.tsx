'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
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
      router.push('/');
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
      {/* Tiêu đề */}
      <h1 className="text-4xl font-bold text-stone-800 mb-2">BrewLite</h1>
      <p className="text-stone-500 mb-8">
        Đăng nhập để đặt cà phê và các món trà yêu thích.
      </p>

      {/* Thông báo lỗi */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form đăng nhập */}
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
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-stone-700"
            >
              Mật khẩu
            </label>
            <span className="text-sm text-stone-500 cursor-pointer hover:text-stone-700 transition">
              Quên mật khẩu?
            </span>
          </div>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-stone-800 placeholder-stone-400 outline-none transition focus:border-stone-500 focus:ring-1 focus:ring-stone-500"
            autoComplete="current-password"
          />
        </div>

        {/* Nút đăng nhập */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-[#6F4E37] py-3 text-base font-semibold text-white transition hover:bg-[#5C3D2E] focus:outline-none focus:ring-2 focus:ring-[#6F4E37] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Đang xử lý...' : 'Đăng Nhập'}
        </button>
      </form>

      {/* Link sang trang đăng ký */}
      <p className="mt-6 text-center text-sm text-stone-500">
        Bạn chưa có tài khoản?{' '}
        <Link
          href="/auth/register"
          className="font-semibold text-stone-700 hover:text-stone-900 underline underline-offset-2 transition"
        >
          Tạo tài khoản mới
        </Link>
      </p>
    </div>
  );
}
