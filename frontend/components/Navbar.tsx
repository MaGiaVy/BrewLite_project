'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore } from '@/stores/cartStore';
import Logo from '@/components/Logo';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const totalCartItems = useCartStore((state) => state.getTotalItems());
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowUserDropdown(false);
    router.push('/');
  };

  const isMenu = pathname === '/' || pathname.startsWith('/menu') || pathname.startsWith('/products');
  const isOrders = pathname.startsWith('/orders');

  return (
    <header className="sticky top-0 z-50 bg-[#FBF8F3]/90 backdrop-blur-md border-b border-[#E8E5E1] transition-all">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Bên trái: Logo thương hiệu */}
        <div className="flex items-center">
          <Logo size="md" />
        </div>

        {/* Ở giữa: Điều hướng Menu & Orders (Ẩn trên mobile nhỏ, hiện trên md) */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className={`text-sm font-semibold transition-colors pb-1 border-b-2 ${
              isMenu
                ? 'border-[#2A1810] text-[#2A1810]'
                : 'border-transparent text-[#6B5D52] hover:text-[#2A1810]'
            }`}
          >
            Thực đơn · Menu
          </Link>
          <Link
            href="/orders"
            className={`text-sm font-semibold transition-colors pb-1 border-b-2 ${
              isOrders
                ? 'border-[#2A1810] text-[#2A1810]'
                : 'border-transparent text-[#6B5D52] hover:text-[#2A1810]'
            }`}
          >
            Đơn hàng · Orders
          </Link>
        </nav>

        {/* Bên phải: Điểm thưởng + Giỏ hàng + Tài khoản */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Badge Điểm thưởng Loyalty (hiển thị khi đã đăng nhập hoặc khách có điểm) */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F8EBE0] border border-[#EAD8CA] text-xs font-semibold text-[#8A5A00]">
            <svg
              className="w-4 h-4 text-[#C28B5B]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="12" cy="12" r="10" stroke="#8A5A00" strokeWidth="1.5" fill="#F8EBE0" />
              <path
                d="M12 6v12M15 9.5c0-1.5-1.3-2.5-3-2.5s-3 1-3 2.5 1.5 2 3 2.5 3 1 3 2.5-1.3 2.5-3 2.5-3-1-3-2.5"
                stroke="#8A5A00"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span>
              +{user?.loyaltyPoints ?? 120} điểm
            </span>
          </div>

          {/* Nút Giỏ hàng (Kèm badge số lượng đếm thật từ cartStore) */}
          <Link
            href="/cart"
            className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white border border-[#E8E5E1] text-[#2A1810] hover:border-[#2A1810] transition-colors shadow-xs"
            aria-label="Xem giỏ hàng"
          >
            <svg
              className="w-5 h-5 text-[#2A1810]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            {totalCartItems > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#2A1810] px-1 text-[11px] font-bold text-white shadow-sm ring-2 ring-white">
                {totalCartItems}
              </span>
            )}
          </Link>

          {/* Tài khoản Người dùng / Avatar */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center justify-center w-11 h-11 rounded-full bg-[#2A1810] text-[#FBF8F3] hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#C28B5B] focus:ring-offset-2"
                aria-label="Tùy chọn tài khoản"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl border border-[#E8E5E1] z-50">
                  <div className="px-3 py-2 border-b border-[#E8E5E1]">
                    <p className="text-xs text-[#6B5D52]">Đang đăng nhập bằng</p>
                    <p className="text-sm font-semibold text-[#2A1810] truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href="/orders"
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center w-full px-3 py-2 text-sm font-medium text-[#2A1810] rounded-xl hover:bg-[#F7F3EE] transition-colors mt-1"
                  >
                    Lịch sử đơn hàng
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-2 text-sm font-medium text-[#B3261E] rounded-xl hover:bg-red-50 transition-colors mt-1"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#2A1810] text-sm font-semibold text-white hover:bg-[#42271A] transition-colors shadow-xs"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
