'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

/**
 * Navbar — Thanh điều hướng chính của ứng dụng BrewLite.
 *
 * Hiển thị khác nhau dựa theo trạng thái đăng nhập:
 * - Chưa đăng nhập: Hiện nút "Đăng nhập" và "Đăng ký"
 * - Đã đăng nhập: Hiện email user và nút "Đăng xuất"
 */
export default function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-stone-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo / Tên thương hiệu */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🍵</span>
          <span className="text-xl font-bold text-stone-800">BrewLite</span>
        </Link>

        {/* Phần bên phải: Nút Auth */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              {/* Đã đăng nhập: Hiện thông tin user + nút Đăng xuất */}
              <span className="hidden text-sm text-stone-600 sm:inline-block">
                Xin chào,{' '}
                <span className="font-semibold text-stone-800">
                  {user.email}
                </span>
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-1"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              {/* Chưa đăng nhập: Hiện nút Đăng nhập + Đăng ký */}
              <Link
                href="/auth/login"
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
              >
                Đăng nhập
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg bg-[#6F4E37] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5C3D2E]"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
