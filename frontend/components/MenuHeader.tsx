'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import MenuIcon from '@/components/MenuIcons';
import { useAuth } from '@/hooks/useAuth';

// Header riêng cho trang Menu để không ảnh hưởng Navbar đang được nhóm sử dụng.
export default function MenuHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      setMobileOpen(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#E8E5E1] bg-[#FBF8F3]/95 backdrop-blur-lg">
      <div className="mx-auto flex min-h-[76px] max-w-[1320px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
        <Link href="/menu" aria-label="BrewLite - thực đơn" className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Image
            src="/images/brewlite-cup.svg"
            alt="Logo BrewLite"
            width={51}
            height={51}
            priority
            className="h-10 w-10 sm:h-12 sm:w-12"
          />
          <span className="leading-none">
            <span className="block font-serif text-2xl font-bold tracking-tight sm:text-[28px]">
              Brew<span className="text-[#B98250]">Lite</span>
            </span>
            <span className="mt-1 block text-[11px] font-bold uppercase tracking-[0.2em] text-[#756153]">
              CASHLESS COFFEE
            </span>
          </span>
        </Link>

        <nav aria-label="Điều hướng chính" className="hidden items-center gap-2 lg:flex">
          <Link href="/menu" aria-current="page" className="rounded-full bg-[#2A1810] px-6 py-2.5 text-sm font-semibold text-white">
            Thực đơn
          </Link>
          <span className="cursor-not-allowed rounded-full px-4 py-2.5 text-sm text-[#786A60]" title="Phần đơn hàng do nhóm làm ở Task 9">
            Đơn hàng
          </span>
          <a href="#uu-dai" className="rounded-full px-4 py-2.5 text-sm hover:bg-[#F2E9DF]">
            Ưu đãi
          </a>
          <a href="#ve-brewlite" className="rounded-full px-4 py-2.5 text-sm hover:bg-[#F2E9DF]">
            Về BrewLite
          </a>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {isAuthenticated && user?.loyaltyPoints != null && (
            <span className="hidden rounded-full bg-[#F8EBE0] px-3 py-2 text-xs font-semibold text-[#785034] xl:inline">
              ★ {user.loyaltyPoints} điểm
            </span>
          )}

          <span
            title="Giỏ hàng đang được làm trong Task 5"
            aria-label="Giỏ hàng chưa tích hợp"
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#E4D8CE] bg-white text-[#483024]"
          >
            <MenuIcon name="bag" size={19} />
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2A1810] px-1 text-[11px] font-bold text-white">
              0
            </span>
          </span>

          {isAuthenticated ? (
            <div className="hidden items-center gap-2 sm:flex">
              <span title={user?.email} className="max-w-[145px] truncate text-xs text-[#625146]">
                {user?.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-[#D9CFC7] px-3 py-2 text-xs font-bold text-[#3E2723] hover:bg-[#F2E9DF]"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="hidden rounded-full bg-[#2A1810] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5E4031] sm:inline-flex"
            >
              Đăng nhập
            </Link>
          )}

          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
            onClick={() => setMobileOpen((current) => !current)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E4D8CE] bg-white lg:hidden"
          >
            <MenuIcon name={mobileOpen ? 'close' : 'menu'} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav id="mobile-menu" aria-label="Điều hướng trên điện thoại" className="border-t border-[#E8E5E1] bg-[#FBF8F3] px-5 py-4 lg:hidden">
          <div className="mx-auto flex max-w-[1320px] flex-col gap-3 text-sm font-semibold">
            <Link href="/menu" onClick={() => setMobileOpen(false)}>Thực đơn</Link>
            <a href="#uu-dai" onClick={() => setMobileOpen(false)}>Ưu đãi</a>
            <a href="#ve-brewlite" onClick={() => setMobileOpen(false)}>Về BrewLite</a>
            {isAuthenticated ? (
              <button type="button" onClick={handleLogout} className="text-left">Đăng xuất</button>
            ) : (
              <Link href="/auth/login">Đăng nhập / Đăng ký</Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
