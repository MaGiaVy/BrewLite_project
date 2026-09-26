'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

/**
 * ProtectedRoute — Component bảo vệ trang nội bộ.
 * Nếu người dùng chưa đăng nhập (không có token), tự động redirect về /auth/login.
 * Nếu đã đăng nhập, hiển thị nội dung con (children) bình thường.
 */
export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, accessToken } = useAuthStore();

  useEffect(() => {
    // Kiểm tra cả Zustand state lẫn localStorage (đề phòng hydration chưa xong)
    const tokenInStorage =
      typeof window !== 'undefined'
        ? localStorage.getItem('accessToken')
        : null;

    if (!isAuthenticated && !accessToken && !tokenInStorage) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, accessToken, router]);

  // Nếu chưa có token, hiển thị loading spinner trong khi redirect
  if (!isAuthenticated && !accessToken) {
    const tokenInStorage =
      typeof window !== 'undefined'
        ? localStorage.getItem('accessToken')
        : null;

    if (!tokenInStorage) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-stone-50">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#6F4E37] border-t-transparent" />
            <p className="mt-4 text-stone-500">Đang chuyển hướng...</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
