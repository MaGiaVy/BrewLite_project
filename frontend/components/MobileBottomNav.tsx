'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/stores/cartStore';
import { useAuth } from '@/hooks/useAuth';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const totalCartItems = useCartStore((state) => state.getTotalItems());
  const { isAuthenticated } = useAuth();

  // Ẩn Bottom Nav trên trang Chi tiết sản phẩm hoặc Checkout theo đúng quy định DESIGN.md
  if (pathname.startsWith('/products/') || pathname === '/checkout') {
    return null;
  }

  const isMenu = pathname === '/' || pathname.startsWith('/menu');
  const isCart = pathname === '/cart';
  const isOrders = pathname.startsWith('/orders');
  const isProfile = pathname.startsWith('/auth');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FBF8F3]/95 backdrop-blur-md border-t border-[#E8E5E1] md:hidden px-3 py-2 pb-safe shadow-lg">
      <div className="grid grid-cols-4 items-center">
        {/* Tab 1: Thực đơn */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            isMenu ? 'text-[#2A1810]' : 'text-[#6B5D52] hover:text-[#2A1810]'
          }`}
        >
          <div className={`p-1 rounded-xl ${isMenu ? 'bg-[#F8EBE0]' : ''}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h1a4 4 0 1 1 0 8h-1" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
            </svg>
          </div>
          <span className={`text-[11px] mt-0.5 ${isMenu ? 'font-bold' : 'font-medium'}`}>
            Thực đơn
          </span>
        </Link>

        {/* Tab 2: Giỏ hàng */}
        <Link
          href="/cart"
          className={`relative flex flex-col items-center justify-center py-1 transition-colors ${
            isCart ? 'text-[#2A1810]' : 'text-[#6B5D52] hover:text-[#2A1810]'
          }`}
        >
          <div className={`relative p-1 rounded-xl ${isCart ? 'bg-[#F8EBE0]' : ''}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {totalCartItems > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#2A1810] px-0.5 text-[9px] font-bold text-white shadow-xs">
                {totalCartItems}
              </span>
            )}
          </div>
          <span className={`text-[11px] mt-0.5 ${isCart ? 'font-bold' : 'font-medium'}`}>
            Giỏ hàng
          </span>
        </Link>

        {/* Tab 3: Đơn hàng */}
        <Link
          href="/orders"
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            isOrders ? 'text-[#2A1810]' : 'text-[#6B5D52] hover:text-[#2A1810]'
          }`}
        >
          <div className={`p-1 rounded-xl ${isOrders ? 'bg-[#F8EBE0]' : ''}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className={`text-[11px] mt-0.5 ${isOrders ? 'font-bold' : 'font-medium'}`}>
            Đơn hàng
          </span>
        </Link>

        {/* Tab 4: Tài khoản */}
        <Link
          href={isAuthenticated ? '/orders' : '/auth/login'}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            isProfile ? 'text-[#2A1810]' : 'text-[#6B5D52] hover:text-[#2A1810]'
          }`}
        >
          <div className={`p-1 rounded-xl ${isProfile ? 'bg-[#F8EBE0]' : ''}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span className={`text-[11px] mt-0.5 ${isProfile ? 'font-bold' : 'font-medium'}`}>
            {isAuthenticated ? 'Tài khoản' : 'Đăng nhập'}
          </span>
        </Link>
      </div>
    </nav>
  );
}
