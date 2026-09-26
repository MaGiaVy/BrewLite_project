'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

/**
 * AuthHydration — Component giải quyết vấn đề mất dữ liệu khi refresh trình duyệt.
 *
 * Khi người dùng tải lại trang (F5), Zustand persist middleware cần một khoảng thời gian
 * ngắn để đọc lại dữ liệu từ localStorage (gọi là "hydration").
 * Component này đảm bảo children chỉ render SAU KHI hydration hoàn tất,
 * tránh hiện tượng "nhấp nháy" (flash) trạng thái chưa đăng nhập rồi mới đăng nhập.
 */
export default function AuthHydration({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Zustand persist sẽ tự động rehydrate khi component mount ở client
    // Chúng ta chỉ cần đánh dấu là đã hydrate xong
    const unsubFinishHydration = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // Nếu hydration đã xong trước khi subscribe (trường hợp nhanh)
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return () => {
      unsubFinishHydration();
    };
  }, []);

  // Hiển thị loading spinner cho đến khi hydration hoàn tất
  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#6F4E37] border-t-transparent" />
          <p className="mt-4 text-sm text-stone-500">Đang tải BrewLite...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
