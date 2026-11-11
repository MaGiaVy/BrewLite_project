'use client';

import React, { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import OrderConfirmationPage from '../orders/[id]/confirmation/page';

function OrderConfirmationBridge() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId') || '1042';

  // Chuyển hướng hoặc render trực tiếp trang confirmation với orderId
  const paramsPromise = React.useMemo(() => Promise.resolve({ id: orderId }), [orderId]);

  return <OrderConfirmationPage params={paramsPromise} />;
}

export default function OrderConfirmationRoute() {
  return (
    <Suspense
      fallback={
        <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center', color: '#786c67' }}>
          Đang tải xác nhận đơn hàng...
        </div>
      }
    >
      <OrderConfirmationBridge />
    </Suspense>
  );
}
