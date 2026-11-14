'use client';

import React, { Suspense, useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  Clock,
  Store,
  Sparkles,
  RefreshCw,
  Lock,
  XCircle,
  Tag,
  Check,
  Leaf,
  Copy,
  CheckCheck,
  QrCode,
  ScanFace,
  CheckCircle2,
  X,
  Snowflake,
  Flame,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { useCartStore, CartItem } from '../../stores/cart-store';
import { useAuthStore } from '../../stores/auth-store';
import { apiClient, getAuthToken } from '../../lib/api-client';
import styles from './checkout.module.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function vnd(n: number): string {
  return (n || 0).toLocaleString('vi-VN') + ' ₫';
}

const FALLBACK_DRINK_IMG = '/images/products/ca-phe-sua.png';

function getItemImage(item: { productId?: string | number; name?: string; imageUrl?: string }): string {
  if (item.imageUrl) return item.imageUrl;

  const nameNorm = (item.name || '').normalize('NFC').toLowerCase().trim();

  if (nameNorm.includes('pain') || nameNorm.includes('chocolat')) {
    return '/images/products/pain-au-chocolat.png';
  }
  if (nameNorm.includes('cheesecake') || nameNorm.includes('basque')) {
    return '/images/products/basque-burnt-cheesecake.png';
  }
  if (nameNorm.includes('tiramisu')) {
    return '/images/products/classic-tiramisu.png';
  }
  if (nameNorm.includes('croissant') || nameNorm.includes('cruffin')) {
    return '/images/products/pain-au-chocolat.png';
  }
  if (nameNorm.includes('muối') || nameNorm.includes('muoi')) {
    return '/images/products/ca-phe-muoi.png';
  }
  if (nameNorm.includes('sữa') || nameNorm.includes('sua')) {
    return '/images/products/ca-phe-sua.png';
  }
  if (nameNorm.includes('bạc xỉu') || nameNorm.includes('bac xiu')) {
    return '/images/products/ca-phe-bac-xiu.png';
  }
  if (nameNorm.includes('đen') || nameNorm.includes('den')) {
    return '/images/products/ca-phe-den.png';
  }
  if (nameNorm.includes('macchiato')) {
    return '/images/products/iced-caramel-macchiato.png';
  }
  if (nameNorm.includes('matcha')) {
    return '/images/products/matcha-latte.png';
  }
  if (nameNorm.includes('trà đào') || nameNorm.includes('cam sả') || nameNorm.includes('tra dao')) {
    return '/images/products/tra-dao-cam-sa.png';
  }

  return FALLBACK_DRINK_IMG;
}

function formatIceLevel(ice?: string): string {
  if (!ice) return '100% đá';
  const val = ice.trim();
  if (val.includes('100%')) return '100% đá';
  if (val.includes('70%')) return '70% đá';
  if (val.includes('50%')) return '50% đá';
  if (
    val.includes('0%') ||
    val.toLowerCase().includes('không') ||
    val.toLowerCase().includes('khong')
  ) {
    return 'Không đá';
  }
  return val.endsWith('đá') ? val : `${val} đá`;
}

function formatSugarLevel(sugar?: string): string {
  if (!sugar) return '100% đường';
  const val = sugar.trim();
  if (
    val === '0%' ||
    val.toLowerCase().includes('không') ||
    val.toLowerCase().includes('khong')
  ) {
    return 'Không đường';
  }
  if (val.endsWith('%')) {
    return `${val} đường`;
  }
  if (
    !val.toLowerCase().includes('đường') &&
    !val.toLowerCase().includes('duong')
  ) {
    return `${val} đường`;
  }
  return val;
}

function ApplePayLogo({ style }: { style?: React.CSSProperties }) {
  return (
    <svg
      style={{ height: 16, width: 'auto', fill: 'currentColor', display: 'inline-block', ...style }}
      viewBox="0 115 640 275"
      fill="currentColor"
      aria-label="Apple Pay"
    >
      <path d="M116.9 158.5c-7.5 8.9-19.5 15.9-31.5 14.9c-1.5-12 4.4-24.8 11.3-32.6c7.5-9.1 20.6-15.6 31.3-16.1c1.2 12.4-3.7 24.7-11.1 33.8m10.9 17.2c-17.4-1-32.3 9.9-40.5 9.9c-8.4 0-21-9.4-34.8-9.1c-17.9.3-34.5 10.4-43.6 26.5c-18.8 32.3-4.9 80 13.3 106.3c8.9 13 19.5 27.3 33.5 26.8c13.3-.5 18.5-8.6 34.5-8.6c16.1 0 20.8 8.6 34.8 8.4c14.5-.3 23.6-13 32.5-26c10.1-14.8 14.3-29.1 14.5-29.9c-.3-.3-28-10.9-28.3-42.9c-.3-26.8 21.9-39.5 22.9-40.3c-12.5-18.6-32-20.6-38.8-21.1m100.4-36.2v194.9h30.3v-66.6h41.9c38.3 0 65.1-26.3 65.1-64.3s-26.4-64-64.1-64zm30.3 25.5h34.9c26.3 0 41.3 14 41.3 38.6s-15 38.8-41.4 38.8h-34.8zm162.2 170.9c19 0 36.6-9.6 44.6-24.9h.6v23.4h28v-97c0-28.1-22.5-46.3-57.1-46.3c-32.1 0-55.9 18.4-56.8 43.6h27.3c2.3-12 13.4-19.9 28.6-19.9c18.5 0 28.9 8.6 28.9 24.5v10.8l-37.8 2.3c-35.1 2.1-54.1 16.5-54.1 41.5c.1 25.2 19.7 42 47.8 42m8.2-23.1c-16.1 0-26.4-7.8-26.4-19.6c0-12.3 9.9-19.4 28.8-20.5l33.6-2.1v11c0 18.2-15.5 31.2-36 31.2m102.5 74.6c29.5 0 43.4-11.3 55.5-45.4L640 193h-30.8l-35.6 115.1h-.6L537.4 193h-31.6L557 334.9l-2.8 8.6c-4.6 14.6-12.1 20.3-25.5 20.3c-2.4 0-7-.3-8.9-.5v23.4c1.8.4 9.3.7 11.6.7" />
    </svg>
  );
}

function AppleLogo({ style }: { style?: React.CSSProperties }) {
  return (
    <svg
      style={{ height: 18, width: 'auto', fill: 'currentColor', display: 'inline-block', ...style }}
      viewBox="0 0 384 512"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

type SelectedPaymentType = 'EWALLET' | 'BANK_CARD' | 'APPLE_PAY';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get('orderId');

  const { items, selectTotal, clear, appliedPromo } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<SelectedPaymentType>('EWALLET');
  const [ewalletProvider, setEwalletProvider] = useState<'ZALOPAY' | 'VIETQR'>('ZALOPAY');

  // Voucher đã áp dụng từ Giỏ hàng (Read-only tại Checkout)
  const [voucherCode, setVoucherCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [pricingVouchers, setPricingVouchers] = useState<any[]>([]);

  // Execution state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(orderIdParam || null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Bank Card Form
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [cardName, setCardName] = useState('BREWLITE GUEST');

  // Apple Pay / Face ID Modal
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricType, setBiometricType] = useState<'APPLE_PAY' | 'GOOGLE_PAY'>('APPLE_PAY');
  const [biometricState, setBiometricState] = useState<'READY' | 'SCANNING' | 'SUCCESS' | 'FAILED'>('READY');

  // 5-minute holding timer
  const [countdownSeconds, setCountdownSeconds] = useState<number>(300); // 5:00

  // Lưu Idempotency Key duy nhất cho phiên thanh toán (giữ nguyên khi retry)
  const idempotencyKeyRef = useRef<string | null>(null);
  const [currentIdempKeyDisplay, setCurrentIdempKeyDisplay] = useState<string>('');

  // Tự động nhận diện loại thẻ
  const cardBrand = useMemo(() => {
    const raw = cardNumber.replace(/\s/g, '');
    if (raw.startsWith('4')) return 'visa';
    if (raw.startsWith('5')) return 'mastercard';
    if (raw.startsWith('9704')) return 'napas';
    return 'card';
  }, [cardNumber]);

  // Sinh Idempotency Key
  const getOrCreateIdempotencyKey = () => {
    if (!idempotencyKeyRef.current) {
      const newKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `idemp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      idempotencyKeyRef.current = newKey;
      setCurrentIdempKeyDisplay(newKey);
    }
    return idempotencyKeyRef.current;
  };

  // Tải cấu hình voucher đang hoạt động từ GET /inventory/pricing-config
  useEffect(() => {
    let isCancelled = false;
    const fetchPricing = async () => {
      try {
        const res = await apiClient('/inventory/pricing-config');
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && Array.isArray(data?.vouchers)) {
            setPricingVouchers(data.vouchers);
          }
        }
      } catch {
        // Fallback offline
      }
    };
    void fetchPricing();
    return () => {
      isCancelled = true;
    };
  }, []);

  const calculateDiscount = (code: string, currentSubtotal: number) => {
    const upper = code.trim().toUpperCase();
    const found = pricingVouchers.find((v) => (v.code || '').toUpperCase() === upper);
    if (found) {
      const discountPercent = Number(found.discountPercent || 0);
      const maxDiscount = Number(found.maxDiscountAmount || Infinity);
      const minOrder = Number(found.minOrderAmount || 0);
      if (currentSubtotal >= minOrder) {
        const rawDiscount = Math.floor(currentSubtotal * (discountPercent / 100));
        const finalDiscount = Math.min(rawDiscount, maxDiscount);
        setDiscountAmount(finalDiscount);
        setVoucherApplied(true);
        return;
      }
    }

    // Fallback standard rules
    if (upper === 'BREWLITE10' || upper === 'GIAM10' || upper === 'BREW10') {
      const discount = Math.floor(currentSubtotal * 0.1);
      setDiscountAmount(discount);
      setVoucherApplied(true);
    } else if (upper === 'BREWCOZY' || upper === 'GIAM20' || upper === 'BREW20') {
      const discount = Math.min(25000, Math.floor(currentSubtotal * 0.15));
      setDiscountAmount(discount);
      setVoucherApplied(true);
    } else if (upper === 'BREW50') {
      const discount = Math.min(60000, Math.floor(currentSubtotal * 0.5));
      setDiscountAmount(discount);
      setVoucherApplied(true);
    } else {
      setDiscountAmount(0);
      setVoucherApplied(false);
    }
  };

  // Khởi tạo & Auth Check
  useEffect(() => {
    setMounted(true);
    getOrCreateIdempotencyKey();

    const token = getAuthToken();
    const hasAuth = isAuthenticated || Boolean(token);
    if (!hasAuth) {
      router.push('/auth/login?redirect=%2Fcheckout');
      return;
    }

    if (appliedPromo) {
      const code = appliedPromo.trim().toUpperCase();
      setVoucherCode(code);
      calculateDiscount(code, selectTotal());
    } else {
      setVoucherCode('');
      setDiscountAmount(0);
      setVoucherApplied(false);
    }
  }, [isAuthenticated, router, appliedPromo, selectTotal]);

  useEffect(() => {
    if (voucherCode) {
      calculateDiscount(voucherCode, selectTotal());
    }
  }, [pricingVouchers]);

  // Đếm ngược 5 phút
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Tính toán biểu phí chuẩn 0% VAT per SRS v4.3 AC-03.3
  const subtotal = selectTotal();
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const vat = 0; // 0% VAT per SRS v4.3 AC-03.3
  const totalAmount = afterDiscount; // 0% VAT, NO 1000 rounding!
  const loyaltyPoints = Math.floor(totalAmount / 1000);
  const totalItemCount = items.reduce((sum, it) => sum + it.quantity, 0);

  // Copy to clipboard
  const handleCopy = (text: string, fieldName: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // Kích hoạt sinh trắc học Face ID
  const triggerBiometric = (type: 'APPLE_PAY' | 'GOOGLE_PAY') => {
    setBiometricType(type);
    setShowBiometricModal(true);
    setBiometricState('SCANNING');

    setTimeout(async () => {
      setBiometricState('SUCCESS');
      setTimeout(async () => {
        setShowBiometricModal(false);
        await processPaymentBackend('APPLE_PAY');
      }, 700);
    }, 1200);
  };

  // Mở Cổng Sandbox ZaloPay Web
  const handleOpenZaloPaySandbox = async () => {
    if (items.length === 0 && !pendingOrderId) {
      setCheckoutError('Giỏ hàng trống. Vui lòng chọn món trước khi thanh toán.');
      return;
    }

    if (countdownSeconds <= 0) {
      setCheckoutError('Đơn hàng đã hết hạn thanh toán (quá 5 phút). Vui lòng quay lại tạo đơn mới.');
      return;
    }

    const currentKey = getOrCreateIdempotencyKey();
    setIsSubmitting(true);
    setCheckoutError(null);

    try {
      let orderId = pendingOrderId;

      // 1. Tạo đơn hàng nếu chưa có
      if (!orderId) {
        const orderPayload = {
          items: items.map((it) => ({
            productId: Number(it.productId),
            productName: it.name,
            size: it.size,
            sugarLevel: it.sugarLevel,
            iceLevel: it.iceLevel,
            temperature: it.temperature,
            notes: it.notes,
            toppings: (it.toppingNames && it.toppingNames.length > 0) ? it.toppingNames : (it.toppingIds ?? []),
            quantity: it.quantity,
            unitPrice: it.unitPrice,
          })),
          ...(voucherApplied && voucherCode.trim() ? { discountCode: voucherCode.trim() } : {}),
        };

        const orderRes = await apiClient('/orders', {
          method: 'POST',
          body: JSON.stringify(orderPayload),
          headers: {
            'Idempotency-Key': currentKey,
          },
        });

        if (!orderRes.ok) {
          const errData = await orderRes.json().catch(() => ({}));
          throw new Error(errData?.message ?? 'Tạo đơn hàng không thành công.');
        }

        const orderData = await orderRes.json();
        orderId = String(orderData?.id ?? orderData?.orderId ?? `ord-${Date.now()}`);
        setPendingOrderId(orderId);
      }

      // 2. Gọi POST /payments/zalopay/create (fallback sang sandbox client-side nếu server chưa bật ZALOPAY_KEY1/2)
      let appTransId = '';
      let gatewayAmount = totalAmount;
      try {
        const zpRes = await apiClient('/payments/zalopay/create', {
          method: 'POST',
          body: JSON.stringify({
            orderId: Number(orderId),
            amount: totalAmount,
          }),
        });

        if (zpRes.ok) {
          const zpData = await zpRes.json().catch(() => ({}));
          appTransId = zpData?.appTransId ?? zpData?.app_trans_id ?? '';
          gatewayAmount = zpData?.amount ?? totalAmount;
        }
      } catch {
        // Fallback smoothly to client-generated sandbox transaction ID in /gateway/zalopay
      }

      // 3. Lưu snapshot sang localStorage cho confirmation mà KHÔNG xóa giỏ hàng
      if (typeof window !== 'undefined') {
        try {
          const snapshot = {
            id: orderId,
            items: items.map((it, idx) => ({
              id: idx + 1,
              productId: it.productId,
              productName: it.name,
              name: it.name,
              size: it.size,
              toppings: it.toppingNames || [],
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              imageUrl: it.imageUrl,
              temperature: it.temperature,
              servingStyle: it.servingStyle,
              iceLevel: it.iceLevel,
              sugarLevel: it.sugarLevel,
              notes: it.notes,
              isBakery: it.isBakery,
            })),
            discountCode: voucherApplied ? voucherCode.trim() : null,
            discountAmount,
            subtotal,
            totalAmount,
            finalAmount: totalAmount,
            paymentMethod: 'Ví ZaloPay',
            createdAt: new Date().toISOString(),
            status: 'PENDING',
          };
          localStorage.setItem(`order_details_${orderId}`, JSON.stringify(snapshot));
        } catch {
          // ignore
        }
      }

      const appTransQuery = appTransId ? `&appTransId=${encodeURIComponent(appTransId)}` : '';
      router.push(`/gateway/zalopay?orderId=${orderId}${appTransQuery}&amount=${gatewayAmount}`);
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : 'Lỗi kết nối cổng thanh toán ZaloPay.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gửi lệnh thanh toán POST /payments
  const processPaymentBackend = async (overrideMethod?: SelectedPaymentType) => {
    if (items.length === 0 && !pendingOrderId) {
      setCheckoutError('Giỏ hàng trống. Vui lòng chọn món trước khi thanh toán.');
      return;
    }

    if (countdownSeconds <= 0) {
      setCheckoutError('Đơn hàng đã hết hạn thanh toán (quá 5 phút). Vui lòng quay lại tạo đơn mới.');
      return;
    }

    const currentKey = getOrCreateIdempotencyKey();
    setIsSubmitting(true);
    setCheckoutError(null);

    const effectiveMethod = overrideMethod || selectedMethod;
    const backendMethod = effectiveMethod === 'BANK_CARD' || effectiveMethod === 'APPLE_PAY' ? 'BANK_CARD' : 'EWALLET';

    try {
      let orderId = pendingOrderId;

      // 1. Tạo đơn hàng nếu chưa có
      if (!orderId) {
        const orderPayload = {
          items: items.map((it) => ({
            productId: Number(it.productId),
            productName: it.name,
            size: it.size,
            sugarLevel: it.sugarLevel,
            iceLevel: it.iceLevel,
            temperature: it.temperature,
            notes: it.notes,
            toppings: (it.toppingNames && it.toppingNames.length > 0) ? it.toppingNames : (it.toppingIds ?? []),
            quantity: it.quantity,
            unitPrice: it.unitPrice,
          })),
          ...(voucherApplied && voucherCode.trim() ? { discountCode: voucherCode.trim() } : {}),
        };

        const orderRes = await apiClient('/orders', {
          method: 'POST',
          body: JSON.stringify(orderPayload),
          headers: {
            'Idempotency-Key': currentKey,
          },
        });

        if (!orderRes.ok) {
          const errData = await orderRes.json().catch(() => ({}));
          throw new Error(errData?.message ?? 'Tạo đơn hàng không thành công.');
        }

        const orderData = await orderRes.json();
        orderId = String(orderData?.id ?? orderData?.orderId ?? `ord-${Date.now()}`);
        setPendingOrderId(orderId);
      }

      // 2. Thực hiện thanh toán với Idempotency Key
      const paymentRes = await apiClient('/payments', {
        method: 'POST',
        headers: {
          'Idempotency-Key': currentKey,
        },
        body: JSON.stringify({
          orderId: Number(orderId),
          method: backendMethod,
        }),
      });

      if (!paymentRes.ok) {
        const payData = await paymentRes.json().catch(() => ({}));
        throw new Error(
          payData?.message ?? 'Giao dịch thanh toán không thành công. Giỏ hàng của bạn vẫn được giữ nguyên để thử lại.',
        );
      }

      const payResult = await paymentRes.json();
      if (payResult?.status === 'PAYMENT_FAILED') {
        throw new Error(payResult?.message ?? 'Cổng thanh toán phản hồi: Giao dịch thất bại.');
      }

      // 3. Thanh toán thành công -> Lưu snapshot và customizations vào localStorage cho Confirmation
      if (typeof window !== 'undefined') {
        try {
          const snapshot = {
            id: orderId,
            items: items.map((it, idx) => ({
              id: idx + 1,
              productId: it.productId,
              productName: it.name,
              name: it.name,
              size: it.size,
              toppings: it.toppingNames || [],
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              imageUrl: it.imageUrl,
              temperature: it.temperature,
              servingStyle: it.servingStyle,
              iceLevel: it.iceLevel,
              sugarLevel: it.sugarLevel,
              notes: it.notes,
              isBakery: it.isBakery,
            })),
            discountCode: voucherApplied ? voucherCode.trim() : null,
            discountAmount,
            subtotal,
            totalAmount,
            finalAmount: totalAmount,
            paymentMethod:
              selectedMethod === 'BANK_CARD'
                ? 'Thẻ ngân hàng'
                : selectedMethod === 'APPLE_PAY'
                  ? 'Apple Pay'
                  : ewalletProvider === 'ZALOPAY'
                    ? 'Ví ZaloPay'
                    : 'VietQR Pro',
            createdAt: new Date().toISOString(),
            status: 'PAID',
          };
          localStorage.setItem(`order_details_${orderId}`, JSON.stringify(snapshot));
          localStorage.setItem(
            `order_customizations_${orderId}`,
            JSON.stringify(
              items.map((it) => ({
                productId: it.productId,
                productName: it.name,
                temperature: it.temperature,
                servingStyle: it.servingStyle,
                iceLevel: it.iceLevel,
                sugarLevel: it.sugarLevel,
                notes: it.notes,
                isBakery: it.isBakery,
              })),
            ),
          );
        } catch {
          // ignore
        }
      }

      // XÓA GIỎ HÀNG và chuyển sang trang đơn hàng
      clear();
      router.push(`/orders/${orderId}`);
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi thanh toán.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePay = async () => {
    if (selectedMethod === 'APPLE_PAY') {
      triggerBiometric('APPLE_PAY');
      return;
    }

    if (selectedMethod === 'EWALLET' && ewalletProvider === 'ZALOPAY') {
      await handleOpenZaloPaySandbox();
      return;
    }

    if (selectedMethod === 'BANK_CARD') {
      const cleanCard = cardNumber.replace(/\s/g, '');
      if (cleanCard.length < 16) {
        setCheckoutError('Vui lòng nhập đầy đủ 16 chữ số trên thẻ tín dụng / ghi nợ của bạn.');
        return;
      }
    }

    await processPaymentBackend();
  };

  const handleCancelPendingOrder = () => {
    setPendingOrderId(null);
    idempotencyKeyRef.current = null;
    getOrCreateIdempotencyKey();
    setCheckoutError(null);
  };

  const token = typeof window !== 'undefined' ? getAuthToken() : null;
  const hasAuth = isAuthenticated || Boolean(token);

  if (!mounted || !hasAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf6f0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #2c1810', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#78716c', fontSize: 14 }}>
            {!hasAuth && mounted ? 'Đang chuyển hướng tới trang Đăng nhập / Đăng ký...' : 'Đang tải trang thanh toán...'}
          </p>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !pendingOrderId) {
    return (
      <div className={styles.checkoutWrapper}>
        <main className={styles.mainContainer} style={{ maxWidth: 520, textAlign: 'center', marginTop: 40 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f5ede2', color: '#845326', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Store size={32} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#2c1810', marginBottom: 8, fontFamily: 'Epilogue, serif' }}>
            Giỏ hàng của bạn đang trống
          </h2>
          <p style={{ color: '#78716c', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
            Hãy chọn một món cà phê thơm ngon hoặc bánh tươi từ thực đơn trước khi tiến hành thanh toán nhé.
          </p>
          <Link
            href="/menu"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 28px',
              borderRadius: 9999,
              background: '#2c1810',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(44, 24, 16, 0.15)',
            }}
          >
            Quay lại Thực đơn
          </Link>
        </main>
      </div>
    );
  }

  const mins = Math.floor(countdownSeconds / 60);
  const secs = countdownSeconds % 60;
  const isUrgent = countdownSeconds <= 60;

  return (
    <div className={styles.checkoutWrapper}>
      <main className={styles.mainContainer}>
        {/* ── Sub-header: Breadcrumb & Stepper Capsule ── */}
        <div className={styles.subHeader}>
          <Link href="/cart" className={styles.backBtn} data-testid="cart-link">
            <ArrowLeft size={16} strokeWidth={2.2} />
            <span>Quay lại Giỏ hàng</span>
          </Link>

          {/* Stepper capsule: 1. Chọn món / 2. Giỏ hàng / 3. Thanh toán */}
          <div className={styles.stepperCapsule}>
            <Link href="/menu" className={styles.stepItem}>
              <span className={styles.stepNum}>1</span>
              <span>Chọn món</span>
            </Link>

            <span className={styles.stepDivider}>/</span>

            <Link href="/cart" className={styles.stepItem}>
              <span className={styles.stepNum}>2</span>
              <span>Giỏ hàng</span>
            </Link>

            <span className={styles.stepDivider}>/</span>

            <div className={styles.stepActive}>
              <span className={styles.stepActiveNum}>3</span>
              <span>Thanh toán</span>
            </div>
          </div>
        </div>

        {/* ── Banner đếm ngược 5 phút giữ chỗ nguyên liệu ── */}
        <div className={`${styles.countdownBanner} ${isUrgent ? styles.countdownUrgent : ''}`}>
          <div className={styles.countdownLeft}>
            <div className={styles.countdownIconBox}>
              <Clock size={20} strokeWidth={2} />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>
                {countdownSeconds > 0
                  ? 'Đang giữ chỗ nguyên liệu tại quầy Barista (5 phút)'
                  : 'Đơn hàng đã hết hạn thanh toán (quá 5 phút)'}
              </p>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, opacity: 0.85 }}>
                {countdownSeconds > 0
                  ? `Vui lòng hoàn tất thanh toán trước khi hết giờ. Sau 5 phút, nguyên liệu sẽ được tự động hoàn trả về kho.`
                  : 'Toàn bộ nguyên liệu đã được tự động hoàn trả về kho. Vui lòng quay lại tạo đơn mới.'}
              </p>
            </div>
          </div>

          {countdownSeconds > 0 ? (
            <div className={styles.countdownClock}>
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </div>
          ) : (
            <Link
              href="/cart"
              style={{
                padding: '8px 16px',
                borderRadius: 12,
                background: '#dc2626',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 12,
                textDecoration: 'none',
              }}
            >
              Quay lại Giỏ hàng
            </Link>
          )}
        </div>

        {/* ── 2-Column Responsive Layout: Order Summary & Payment Methods ── */}
        <div className={styles.checkoutGrid}>
          {/* ════════════════════════════════════════════════════════════════════
              CỘT TRÁI (~41%): TÓM TẮT ĐƠN HÀNG (ORDER SUMMARY)
             ════════════════════════════════════════════════════════════════════ */}
          <div className={styles.orderSummaryCard}>
            {/* Header tóm tắt */}
            <div className={styles.columnHeader}>
              <div>
                <p className={styles.columnEyebrow}>CHI TIẾT ĐƠN HÀNG</p>
                <h2 className={styles.columnTitle}>Tóm tắt đơn hàng</h2>
              </div>
              <span className={styles.orderTagBadge}>
                {pendingOrderId ? `#BL-${pendingOrderId.slice(-6).toUpperCase()}` : '#BL-NEW'}
              </span>
            </div>

            {/* Khối Pickup Location Card */}
            <div className={styles.pickupCard}>
              <div className={styles.pickupHeader}>
                <div className={styles.pickupIconBox}>
                  <Store size={14} strokeWidth={2} />
                </div>
                <h3 className={styles.pickupTitle}>Downtown Roastery Bar, Q.1</h3>
              </div>
              <p className={styles.pickupSubtitle}>Kệ Express Bar số 04 • Nhận tại quầy</p>
              <div className={styles.pickupEstimate}>
                <span className={styles.pickupEstimateDot} />
                <span>Chuẩn bị trong ~5 phút sau khi thanh toán</span>
              </div>
            </div>

            {/* Danh sách món trong đơn hàng */}
            <div className={styles.itemsListContainer}>
              {items.map((item) => {
                const isBakery = item.isBakery || item.name.toLowerCase().includes('bánh') || item.name.toLowerCase().includes('cheesecake') || item.name.toLowerCase().includes('tiramisu');
                const isHot = item.temperature === 'hot' || item.temperature === 'HOT';

                return (
                  <div key={item.lineId} className={styles.itemRow}>
                    <div className={styles.itemThumb}>
                      <Image
                        src={getItemImage(item)}
                        alt={item.name}
                        fill
                        unoptimized
                        sizes="60px"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>

                    <div className={styles.itemInfo}>
                      <div className={styles.itemTopLine}>
                        <h4 className={styles.itemName}>{item.name}</h4>
                        <span className={styles.itemPrice}>
                          {vnd(item.unitPrice * item.quantity)}
                        </span>
                      </div>

                      {/* Badges tùy chọn */}
                      <div className={styles.badgesGroup}>
                        {isBakery ? (
                          <span className={styles.attrBadge}>
                            {item.servingStyle === 'Hâm nóng' ? (
                              <>
                                <Flame size={11} strokeWidth={2.2} />
                                <span>Hâm nóng</span>
                              </>
                            ) : (
                              <>
                                <Snowflake size={11} strokeWidth={2.2} />
                                <span>Dùng ngay</span>
                              </>
                            )}
                          </span>
                        ) : (
                          <>
                            <span className={styles.attrBadge}>Size {item.size}</span>
                            {isHot ? (
                              <span className={styles.attrBadge}>
                                <Flame size={11} strokeWidth={2.2} />
                                <span>Uống Nóng</span>
                              </span>
                            ) : (
                              <span className={styles.attrBadge}>
                                <Snowflake size={11} strokeWidth={2.2} />
                                <span>Uống Lạnh</span>
                              </span>
                            )}
                            {!isHot && (
                              <span className={styles.attrBadge}>
                                <span>{formatIceLevel(item.iceLevel)}</span>
                              </span>
                            )}
                            <span className={styles.attrBadge}>
                              <span>{formatSugarLevel(item.sugarLevel)}</span>
                            </span>
                          </>
                        )}
                      </div>

                      {/* Toppings nếu có */}
                      {item.toppingNames && item.toppingNames.length > 0 && (
                        <div className={styles.badgesGroup} style={{ paddingTop: 2 }}>
                          {item.toppingNames.map((tName) => (
                            <span key={tName} className={styles.toppingBadge}>
                              <span style={{ fontSize: 10, fontWeight: 800 }}>+</span>
                              <span>{tName}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Ghi chú */}
                      {item.notes && (
                        <p className={styles.itemNote}>
                          <strong>Ghi chú:</strong> {item.notes}
                        </p>
                      )}

                      {/* Số lượng */}
                      <div style={{ paddingTop: 2 }}>
                        <span className={styles.itemQuantityBadge}>
                          SL: {String(item.quantity).padStart(2, '0')} {isBakery ? 'phần' : 'ly'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Khối Mã giảm giá đã áp dụng từ Giỏ hàng (Read-only) */}
            {voucherApplied && discountAmount > 0 ? (
              <div className={styles.appliedVoucherCard}>
                <div className={styles.voucherLeft}>
                  <div className={styles.voucherIconBox}>
                    <Tag size={16} strokeWidth={2.2} />
                  </div>
                  <div>
                    <div className={styles.voucherTitleRow}>
                      <span className={styles.voucherCodeText}>{voucherCode}</span>
                      <span className={styles.voucherAppliedPill}>Đã áp dụng</span>
                    </div>
                    <p className={styles.voucherDescText}>
                      Giảm {vnd(discountAmount)} trên tổng hóa đơn
                    </p>
                  </div>
                </div>
                <Link href="/cart" className={styles.voucherChangeLink}>
                  Đổi mã
                </Link>
              </div>
            ) : (
              <div className={styles.noVoucherBox}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tag size={14} style={{ color: '#a8a29e' }} />
                  <span style={{ fontSize: 12, color: '#78716c' }}>Chưa áp dụng ưu đãi</span>
                </div>
                <Link href="/cart" className={styles.voucherChangeLink}>
                  Chọn mã trong Giỏ hàng
                </Link>
              </div>
            )}

            {/* Chi tiết thanh toán */}
            <div className={styles.pricingBreakdown}>
              <div className={styles.pricingRow}>
                <span>Tạm tính ({totalItemCount} món)</span>
                <span className={styles.pricingValue}>{vnd(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className={`${styles.pricingRow} ${styles.discountRow}`}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Khuyến mãi</span>
                    {voucherCode && (
                      <span style={{ fontSize: 10, background: '#fef3c7', padding: '1px 6px', borderRadius: 4, border: '1px solid #fde68a' }}>
                        {voucherCode.toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span>-{vnd(discountAmount)}</span>
                </div>
              )}

              <div className={styles.pricingRow}>
                <span>Thuế VAT (0%)</span>
                <span className={styles.pricingValue}>0 ₫</span>
              </div>

              <div className={styles.loyaltyRow}>
                <span style={{ color: '#57534e' }}>Tích luỹ hạt thưởng</span>
                <span className={styles.loyaltyBadge}>
                  <Sparkles size={13} style={{ color: '#f59e0b', fill: '#fbbf24' }} />
                  <span>+{loyaltyPoints} Hạt Vàng</span>
                </span>
              </div>
            </div>

            {/* Khối Tổng thanh toán nổi bật */}
            <div className={styles.grandTotalBox}>
              <div className={styles.grandTotalRow}>
                <div>
                  <span className={styles.grandTotalLabel}>Tổng thanh toán:</span>
                </div>
                <span className={styles.grandTotalAmount}>{vnd(totalAmount)}</span>
              </div>
              <div className={styles.grandTotalSubtext}>
                <Sparkles size={13} style={{ color: '#845326' }} />
                <span>Tích lũy ngay +{loyaltyPoints} Hạt Vàng vào tài khoản BrewLite</span>
              </div>
            </div>

            {/* Dòng trích dẫn */}
            <p className={styles.columnFooterQuote}>
              Nghệ thuật rang mộc nguyên chất • Không tiền mặt
            </p>
          </div>

          {/* ════════════════════════════════════════════════════════════════════
              CỘT PHẢI (~59%): PHƯƠNG THỨC THANH TOÁN (PAYMENT METHODS)
             ════════════════════════════════════════════════════════════════════ */}
          <div className={styles.paymentCard}>
            {/* Header phương thức thanh toán */}
            <div className={styles.columnHeader}>
              <div>
                <p className={styles.columnEyebrow}>BƯỚC 3 / HOÀN TẤT</p>
                <h1 className={styles.columnTitle}>Phương thức thanh toán</h1>
              </div>
              <div className={styles.cashlessPill}>
                <Lock size={12} />
                <span>100% Cashless • An Toàn</span>
              </div>
            </div>

            {/* Thông báo lỗi thanh toán nếu có */}
            {checkoutError && (
              <div className={styles.errorBox} role="alert" data-testid="payment-error">
                <div className={styles.errorIcon}>
                  <AlertCircle size={18} strokeWidth={2.5} />
                </div>
                <div className={styles.errorContent}>
                  <h3 className={styles.errorTitle}>Thanh toán không thành công</h3>
                  <p className={styles.errorText}>{checkoutError}</p>
                  <div className={styles.errorIdempTag}>
                    Khóa Idempotency: {currentIdempKeyDisplay.slice(0, 20)}...
                  </div>
                  <div className={styles.errorActions}>
                    <button
                      type="button"
                      onClick={handlePay}
                      disabled={isSubmitting}
                      className={styles.errorRetryBtn}
                    >
                      Thử lại thanh toán (Giữ nguyên Key)
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelPendingOrder}
                      className={styles.errorCancelBtn}
                    >
                      Hủy đơn / Tạo mới
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Danh sách các phương thức thanh toán */}
            <div className={styles.methodsContainer}>
              {/* ── Lựa chọn 1: Chuyển khoản VietQR / Ví điện tử [Mặc định] ── */}
              <div
                onClick={() => setSelectedMethod('EWALLET')}
                className={`${styles.methodCard} ${selectedMethod === 'EWALLET' ? styles.methodCardActive : ''}`}
                data-testid="payment-method-wallet"
              >
                <div className={styles.methodHeader}>
                  <div className={styles.methodHeaderLeft}>
                    <div
                      className={`${styles.radioCircle} ${selectedMethod === 'EWALLET' ? styles.radioCircleActive : ''}`}
                    >
                      {selectedMethod === 'EWALLET' && <Check size={12} strokeWidth={3} />}
                    </div>

                    <div>
                      <div className={styles.methodTitleGroup}>
                        <span className={styles.methodTitle}>Chuyển khoản VietQR / Ví điện tử</span>
                        <span className={styles.recommendedTag}>Khuyên dùng</span>
                      </div>
                      <p className={styles.methodDesc}>
                        Quét mã QR bằng hơn 40 app Ngân hàng (MB, VCB, Techcombank...) hoặc Ví MoMo, ZaloPay
                      </p>
                    </div>
                  </div>

                  <div className={styles.methodBadgesRight}>
                    <span className={styles.zalopayPill}>
                      <span style={{ width: 6, height: 6, minWidth: 6, minHeight: 6, borderRadius: '50%', background: '#0068ff', display: 'inline-block', flexShrink: 0 }} />
                      ZaloPay Sandbox
                    </span>
                    <span className={styles.vietqrPill}>VietQR</span>
                  </div>
                </div>

                {/* Khối con mở rộng khi chọn EWALLET */}
                {selectedMethod === 'EWALLET' && (
                  <div className={styles.methodExpandedArea} onClick={(e) => e.stopPropagation()}>
                    {/* Tabs chuyển đổi Provider */}
                    <div className={styles.providerTabs}>
                      <button
                        type="button"
                        onClick={() => setEwalletProvider('ZALOPAY')}
                        className={`${styles.providerTabBtn} ${ewalletProvider === 'ZALOPAY' ? styles.providerTabActiveZalo : ''}`}
                      >
                        <span className={styles.tabDot} />
                        <span>Ví ZaloPay Sandbox (VNG)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEwalletProvider('VIETQR')}
                        className={`${styles.providerTabBtn} ${ewalletProvider === 'VIETQR' ? styles.providerTabActiveMB : ''}`}
                      >
                        <span>Chuyển khoản VietQR (MB Bank)</span>
                      </button>
                    </div>

                    {/* Nội dung Provider ZaloPay Sandbox */}
                    {ewalletProvider === 'ZALOPAY' ? (
                      <div className={styles.qrTransferLayout}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div className={styles.zalopayBrandHeader}>
                            <span style={{ width: 6, height: 6, minWidth: 6, minHeight: 6, borderRadius: '50%', background: '#0068ff', display: 'inline-block', flexShrink: 0 }} />
                            <span className={styles.zalopayBrandText}>ZaloPay Sandbox</span>
                          </div>
                          <div className={styles.zalopayQrBox}>
                            <Image
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                                `/gateway/zalopay?orderId=${pendingOrderId || 'NEW'}&amount=${totalAmount}`
                              )}`}
                              alt="ZaloPay Sandbox QR Code"
                              fill
                              unoptimized
                              sizes="176px"
                              style={{ objectFit: 'contain', padding: 6 }}
                            />
                          </div>
                          <span className={styles.qrHelperText}>
                            <QrCode size={11} style={{ color: '#0068ff' }} />
                            Quét bằng app ZaloPay Sandbox hoặc Zalo
                          </span>
                        </div>

                        <div className={styles.bankingInfoBox}>
                          <div className={styles.bankingCardTable} style={{ backgroundColor: '#f0f7ff', borderColor: '#cce4ff' }}>
                            <div className={styles.bankingRow} style={{ borderColor: '#d8eafd' }}>
                              <span className={styles.bankingLabel}>Cổng thanh toán:</span>
                              <span className={styles.bankingValue} style={{ color: '#0068ff' }}>
                                ZaloPay Sandbox (VNG) • LIVE
                              </span>
                            </div>
                            <div className={styles.bankingRow} style={{ borderColor: '#d8eafd' }}>
                              <span className={styles.bankingLabel}>Mã giao dịch:</span>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11 }}>
                                {pendingOrderId ? `zp_${pendingOrderId}` : 'zp_sandbox_live'}
                              </span>
                            </div>
                            <div className={styles.bankingRow} style={{ borderColor: '#d8eafd' }}>
                              <span className={styles.bankingLabel}>Số tiền thanh toán:</span>
                              <span style={{ fontWeight: 800, color: '#0068ff', fontSize: 13 }}>
                                {vnd(totalAmount)}
                              </span>
                            </div>
                            <div className={styles.bankingRow}>
                              <span className={styles.bankingLabel}>Trạng thái đồng bộ:</span>
                              <span style={{ fontSize: 11, color: '#57534e', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 6, height: 6, minWidth: 6, minHeight: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block', flexShrink: 0 }} />
                                Lắng nghe Webhook &amp; Polling...
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <button
                              type="button"
                              onClick={handleOpenZaloPaySandbox}
                              disabled={isSubmitting}
                              className={styles.zalopayOpenBtn}
                            >
                              <ExternalLink size={13} />
                              <span>Mở Cổng Thanh Toán ZaloPay (Sandbox Web)</span>
                            </button>

                            <button
                              type="button"
                              onClick={handlePay}
                              disabled={isSubmitting}
                              className={styles.zalopayGatewayBtn}
                            >
                              <span>Xác nhận thanh toán qua Ví ZaloPay</span>
                              <ArrowRight size={15} />
                            </button>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#2c5282', backgroundColor: '#ebf8ff', padding: '10px 12px', borderRadius: 10, border: '1px solid #bee3f8' }}>
                            <ShieldCheck size={14} style={{ color: '#0068ff', flexShrink: 0 }} />
                            <span>
                              Quét mã trên ứng dụng hoặc bấm nút thanh toán. Hệ thống sẽ tự động đối soát và pha chế ngay khi hoàn tất.
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Nội dung Provider VietQR MB Bank */
                      <div className={styles.qrTransferLayout}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div className={styles.qrImageBox}>
                            <Image
                              src={`https://img.vietqr.io/image/MB-0987654321-compact2.png?amount=${totalAmount}&addInfo=BREWLITE_${pendingOrderId || 'ORDER'}&accountName=BREWLITE%20ROASTERY`}
                              alt="VietQR MB Bank"
                              fill
                              unoptimized
                              sizes="170px"
                              style={{ objectFit: 'contain', padding: 4 }}
                            />
                          </div>
                          <span className={styles.qrHelperText}>
                            <QrCode size={11} style={{ color: '#845326' }} />
                            Tự động điền số tiền & nội dung
                          </span>
                        </div>

                        <div className={styles.bankingInfoBox}>
                          <div className={styles.bankingCardTable}>
                            <div className={styles.bankingRow}>
                              <span className={styles.bankingLabel}>Ngân hàng nhận:</span>
                              <span className={styles.bankingValue}>MB Bank (Ngân hàng Quân Đội)</span>
                            </div>
                            <div className={styles.bankingRow}>
                              <span className={styles.bankingLabel}>Chủ tài khoản:</span>
                              <span className={styles.bankingValue}>BREWLITE ROASTERY</span>
                            </div>
                            <div className={styles.bankingRow}>
                              <span className={styles.bankingLabel}>Số tài khoản:</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 13 }}>0987654321</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy('0987654321', 'accountNumber')}
                                  className={styles.copyBtn}
                                >
                                  {copiedField === 'accountNumber' ? (
                                    <>
                                      <CheckCheck size={11} style={{ color: '#16a34a' }} />
                                      <span style={{ color: '#16a34a' }}>Đã chép</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={11} />
                                      <span>Sao chép</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                            <div className={styles.bankingRow}>
                              <span className={styles.bankingLabel}>Số tiền chuyển:</span>
                              <span style={{ fontWeight: 800, color: '#a47148', fontSize: 13 }}>{vnd(totalAmount)}</span>
                            </div>
                            <div className={styles.bankingRow}>
                              <span className={styles.bankingLabel}>Nội dung chuyển:</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11, background: '#ffffff', padding: '2px 6px', borderRadius: 4, border: '1px solid #e2d8cc' }}>
                                  BREWLITE_{pendingOrderId || 'NEW'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(`BREWLITE_${pendingOrderId || 'NEW'}`, 'memo')}
                                  className={styles.copyBtn}
                                >
                                  {copiedField === 'memo' ? (
                                    <>
                                      <CheckCheck size={11} style={{ color: '#16a34a' }} />
                                      <span style={{ color: '#16a34a' }}>Đã chép</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={11} />
                                      <span>Sao chép</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#654e44', backgroundColor: '#f5ede2', padding: '10px 12px', borderRadius: 10, border: '1px solid #eae0d2' }}>
                            <ShieldCheck size={14} style={{ color: '#15803d', flexShrink: 0 }} />
                            <span>
                              Sau khi hoàn tất chuyển khoản, bấm nút &quot;Xác nhận đã chuyển khoản&quot; bên dưới để Barista bắt đầu pha chế ngay.
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Lựa chọn 2: Thẻ tín dụng / Ghi nợ ── */}
              <div
                onClick={() => setSelectedMethod('BANK_CARD')}
                className={`${styles.methodCard} ${selectedMethod === 'BANK_CARD' ? styles.methodCardActive : ''}`}
              >
                <div className={styles.methodHeader}>
                  <div className={styles.methodHeaderLeft}>
                    <div
                      className={`${styles.radioCircle} ${selectedMethod === 'BANK_CARD' ? styles.radioCircleActive : ''}`}
                    >
                      {selectedMethod === 'BANK_CARD' && <Check size={12} strokeWidth={3} />}
                    </div>

                    <div>
                      <div className={styles.methodTitleGroup}>
                        <span className={styles.methodTitle}>Thẻ tín dụng / Ghi nợ</span>
                        <span style={{ fontSize: 10, fontWeight: 700, background: '#efeae2', color: '#654e44', padding: '2px 8px', borderRadius: 9999 }}>
                          Napas • Visa • Master
                        </span>
                      </div>
                      <p className={styles.methodDesc}>
                        Xác thực 3D Secure bảo mật chuẩn quốc tế PCI-DSS
                      </p>
                    </div>
                  </div>

                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#efece8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#44403c' }}>
                    <CreditCard size={18} />
                  </div>
                </div>

                {/* Khối con mở rộng khi chọn BANK_CARD */}
                {selectedMethod === 'BANK_CARD' && (
                  <div className={styles.methodExpandedArea} onClick={(e) => e.stopPropagation()}>
                    {/* Thẻ Ngân Hàng Ảo Trực Quan 3D */}
                    <div className={styles.virtualCard}>
                      <div className={styles.cardCircleOverlay1} />
                      <div className={styles.cardCircleOverlay2} />

                      {/* Hàng chip EMV và Logo Brand */}
                      <div className={styles.cardTopRow}>
                        <div className={styles.emvChip}>
                          <div className={styles.emvLine} />
                          <div className={styles.emvLine} />
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          {cardBrand === 'visa' && (
                            <span style={{ fontFamily: 'sans-serif', fontStyle: 'italic', fontWeight: 900, fontSize: 20, letterSpacing: '0.08em', color: '#ffffff' }}>
                              VISA
                            </span>
                          )}
                          {cardBrand === 'mastercard' && (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#eb001b', opacity: 0.9, marginRight: -8 }} />
                              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#f79e1b', opacity: 0.9 }} />
                            </div>
                          )}
                          {cardBrand === 'napas' && (
                            <span style={{ fontSize: 12, fontWeight: 800, background: '#ffffff', color: '#e31e24', padding: '2px 6px', borderRadius: 4 }}>
                              NAPAS
                            </span>
                          )}
                          {cardBrand === 'card' && (
                            <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#d6d3d1' }}>BREWLITE PAY</span>
                          )}
                        </div>
                      </div>

                      {/* Số thẻ */}
                      <div className={styles.cardNumberDisplay}>
                        {cardNumber || '•••• •••• •••• ••••'}
                      </div>

                      {/* Tên chủ thẻ & Ngày hết hạn */}
                      <div className={styles.cardBottomRow}>
                        <div>
                          <span className={styles.cardBottomLabel}>Chủ thẻ</span>
                          <span className={styles.cardBottomVal}>{cardName || 'BREWLITE GUEST'}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={styles.cardBottomLabel}>Hết hạn</span>
                          <span className={styles.cardBottomVal}>{cardExpiry || '12/28'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Form nhập thông tin thẻ */}
                    <div className={styles.cardForm}>
                      <div>
                        <label className={styles.formLabel}>Số thẻ tín dụng / ghi nợ</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                            const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
                            setCardNumber(formatted);
                          }}
                          placeholder="4242 4242 4242 4242"
                          maxLength={19}
                          className={styles.formInput}
                        />
                      </div>

                      <div className={styles.cardInputsGrid}>
                        <div>
                          <label className={styles.formLabel}>Ngày hết hạn (MM/YY)</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                              const formatted = val.length > 2 ? `${val.slice(0, 2)}/${val.slice(2)}` : val;
                              setCardExpiry(formatted);
                            }}
                            placeholder="12/28"
                            maxLength={5}
                            className={styles.formInput}
                            style={{ textAlign: 'center' }}
                          />
                        </div>

                        <div>
                          <label className={styles.formLabel}>Mã bảo mật CVC / CVV</label>
                          <input
                            type="password"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="•••"
                            maxLength={4}
                            className={styles.formInput}
                            style={{ textAlign: 'center' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={styles.formLabel}>Tên in trên thẻ (không dấu)</label>
                        <input
                          type="text"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value.toUpperCase())}
                          placeholder="NGUYEN VAN A"
                          className={styles.formInput}
                          style={{ textTransform: 'uppercase', fontFamily: 'inherit' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 4 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setCardNumber('4242 4242 4242 4242');
                            setCardExpiry('12/28');
                            setCardCvc('888');
                            setCardName('BREWLITE TEST CARD');
                          }}
                          className={styles.quickFillCardBtn}
                        >
                          <Sparkles size={13} style={{ color: '#a47148' }} />
                          <span>Điền nhanh thẻ test Stripe (4242...)</span>
                        </button>

                        <span style={{ fontSize: 10, color: '#78716c', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ShieldCheck size={12} style={{ color: '#15803d' }} />
                          Mã hóa PCI-DSS & 3D Secure
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Lựa chọn 3: Apple Pay & Google Wallet ── */}
              <div
                onClick={() => setSelectedMethod('APPLE_PAY')}
                className={`${styles.methodCard} ${selectedMethod === 'APPLE_PAY' ? styles.methodCardActive : ''}`}
              >
                <div className={styles.methodHeader}>
                  <div className={styles.methodHeaderLeft}>
                    <div
                      className={`${styles.radioCircle} ${selectedMethod === 'APPLE_PAY' ? styles.radioCircleActive : ''}`}
                    >
                      {selectedMethod === 'APPLE_PAY' && <Check size={12} strokeWidth={3} />}
                    </div>

                    <div>
                      <div className={styles.methodTitleGroup}>
                        <span className={styles.methodTitle}>Apple Pay & Google Wallet</span>
                        <span style={{ fontSize: 10, fontWeight: 700, background: '#efeae2', color: '#654e44', padding: '2px 8px', borderRadius: 9999 }}>
                          1-Chạm
                        </span>
                      </div>
                      <p className={styles.methodDesc}>
                        Thanh toán không tiếp xúc trực tiếp từ thiết bị di động
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', borderRadius: 6, background: '#000000', color: '#ffffff' }}>
                    <ApplePayLogo />
                  </div>
                </div>

                {/* Khối con mở rộng khi chọn APPLE_PAY */}
                {selectedMethod === 'APPLE_PAY' && (
                  <div className={styles.methodExpandedArea} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.walletBox}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 38, height: 28, borderRadius: 6, background: '#1c130d', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <AppleLogo />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 12, color: '#1a120b', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>Techcombank Visa (Apple Wallet)</span>
                            <span style={{ fontSize: 9, background: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: 9999, fontWeight: 700 }}>
                              Mặc định
                            </span>
                          </div>
                          <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#78716c', fontFamily: 'monospace' }}>•••• 8899</p>
                        </div>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: 13, color: '#845326' }}>{vnd(totalAmount)}</span>
                    </div>

                    <div className={styles.walletExpressBtns}>
                      <button
                        type="button"
                        onClick={() => triggerBiometric('APPLE_PAY')}
                        className={styles.applePayBtn}
                      >
                        <ApplePayLogo style={{ height: 18 }} />
                        <span style={{ marginLeft: 6 }}>với Face ID</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => triggerBiometric('GOOGLE_PAY')}
                        className={styles.googlePayBtn}
                      >
                        <span style={{ fontWeight: 900, color: '#2563eb', fontSize: 16 }}>G</span>
                        <span>Pay 1-Chạm</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: '#654e44', background: '#faf5ee', padding: '8px 12px', borderRadius: 8, border: '1px solid #ede4d8' }}>
                      <ScanFace size={13} style={{ color: '#845326' }} />
                      <span>Chạm để kích hoạt xác thực Face ID / Vân tay không cần nhập thông tin</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Khối Cam kết trải nghiệm 100% Cashless */}
            <div className={styles.cashlessCommitmentBox}>
              <div className={styles.cashlessIcon}>
                <ShieldCheck size={18} strokeWidth={2} />
              </div>
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1a120b', margin: 0 }}>
                  Cam kết Trải nghiệm 100% Cashless
                </h3>
                <p style={{ fontSize: 12, color: '#57534e', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                  BrewLite vận hành mô hình không dùng tiền mặt nhằm tối ưu tốc độ phục vụ và giữ quầy bar sạch sẽ, thơm mùi hạt rang. Mọi giao dịch được mã hóa PCI-DSS cấp độ 1 và gửi lệnh tự động đến Barista ngay lập tức.
                </p>
              </div>
            </div>

            {/* Nút Thanh toán Chính */}
            <div>
              <button
                type="button"
                id="confirmPaymentBtn"
                data-testid="confirm-payment-button"
                onClick={handlePay}
                disabled={isSubmitting || countdownSeconds <= 0}
                className={`${styles.mainPayBtn} ${
                  isSubmitting || countdownSeconds <= 0 ? styles.mainPayBtnDisabled : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Đang xử lý giao dịch...</span>
                  </>
                ) : countdownSeconds <= 0 ? (
                  <>
                    <XCircle size={18} />
                    <span>Đơn hàng đã hết hạn (quá 5 phút)</span>
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>
                      {selectedMethod === 'EWALLET'
                        ? `Xác nhận đã chuyển khoản • ${vnd(totalAmount)} →`
                        : selectedMethod === 'BANK_CARD'
                          ? `Thanh toán qua Thẻ • ${vnd(totalAmount)} →`
                          : `Xác thực 1-Chạm • ${vnd(totalAmount)} →`}
                    </span>
                  </>
                )}
              </button>

              <div className={styles.paymentFooterInfo}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={14} style={{ color: '#15803d' }} />
                  <span>Bảo mật 256-bit SSL</span>
                </div>
                <Link href="/cart" style={{ color: '#78716c', textDecoration: 'underline' }}>
                  Quay lại giỏ hàng
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3 Bottom Feature Commitment Cards ── */}
        <div className={styles.bottomCommitmentsGrid}>
          <div className={styles.commitmentCard}>
            <Leaf size={22} strokeWidth={1.8} style={{ color: '#845326', flexShrink: 0 }} />
            <div>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1c1917' }}>Eco-Friendly Cup</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#78716c' }}>Cốc bã mía phân hủy 100%</p>
            </div>
          </div>

          <div className={styles.commitmentCard}>
            <Clock size={22} strokeWidth={1.8} style={{ color: '#845326', flexShrink: 0 }} />
            <div>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1c1917' }}>Không Cần Xếp Hàng</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#78716c' }}>Đến lấy nước ngay khi sẵn sàng</p>
            </div>
          </div>

          <div className={styles.commitmentCard}>
            <Sparkles size={22} strokeWidth={1.8} style={{ color: '#845326', flexShrink: 0 }} />
            <div>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1c1917' }}>Hạt Vàng BrewClub</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#78716c' }}>Tích điểm tự động theo tài khoản</p>
            </div>
          </div>
        </div>

        {/* ── Biometric Face ID Scanning Modal ── */}
        {showBiometricModal && (
          <div className={styles.biometricModalOverlay} onClick={() => setShowBiometricModal(false)}>
            <div className={styles.biometricModalBox} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e8dfd5', paddingBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {biometricType === 'APPLE_PAY' ? (
                    <div style={{ padding: '3px 8px', borderRadius: 6, background: '#000000', color: '#ffffff', display: 'flex', alignItems: 'center' }}>
                      <ApplePayLogo />
                    </div>
                  ) : (
                    <div style={{ padding: '3px 8px', borderRadius: 6, background: '#ffffff', border: '1px solid #d6d3d1', fontSize: 12, fontWeight: 700 }}>
                      <span style={{ color: '#2563eb' }}>G</span> Pay
                    </div>
                  )}
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1a120b' }}>BrewLite Roastery</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBiometricModal(false)}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: '#e7e5e4', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Chi tiết đơn thanh toán */}
              <div style={{ background: '#ffffff', borderRadius: 14, padding: 12, border: '1px solid #ede7de', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f4', paddingBottom: 6 }}>
                  <span style={{ color: '#78716c' }}>Đơn hàng:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>#{pendingOrderId || 'NEW'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f5f5f4', paddingBottom: 6 }}>
                  <span style={{ color: '#78716c' }}>Thẻ thanh toán:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>Techcombank Visa •••• 8899</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 2 }}>
                  <span style={{ fontWeight: 600, color: '#44403c' }}>Tổng thanh toán:</span>
                  <span style={{ fontWeight: 800, fontSize: 16, color: '#1a120b' }}>{vnd(totalAmount)}</span>
                </div>
              </div>

              {/* Khu vực animation laser quét Face ID */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '10px 0' }}>
                <div className={styles.scannerBox}>
                  {biometricState === 'SCANNING' && (
                    <>
                      <div className={styles.laserLine} />
                      <ScanFace size={40} style={{ color: '#845326' }} />
                    </>
                  )}
                  {biometricState === 'SUCCESS' && (
                    <div style={{ color: '#16a34a' }}>
                      <CheckCircle2 size={44} strokeWidth={2.5} />
                    </div>
                  )}
                  {biometricState === 'FAILED' && (
                    <div style={{ color: '#dc2626' }}>
                      <XCircle size={44} strokeWidth={2.5} />
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#1a120b' }}>
                    {biometricState === 'SCANNING' && 'Đang xác thực Face ID / Sinh trắc học...'}
                    {biometricState === 'SUCCESS' && 'Xác thực thành công!'}
                    {biometricState === 'FAILED' && 'Xác thực thất bại (Demo)'}
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#78716c' }}>
                    {biometricState === 'SCANNING' && 'Vui lòng nhìn vào thiết bị để phê duyệt thanh toán'}
                    {biometricState === 'SUCCESS' && 'Đang chuyển giao đơn hàng đến Barista...'}
                    {biometricState === 'FAILED' && 'Giao dịch bị từ chối'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowBiometricModal(false)}
                style={{ width: '100%', padding: '8px 0', border: 'none', background: 'transparent', color: '#78716c', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Hủy giao dịch
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf6f0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #2c1810', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#78716c', fontSize: 14 }}>Đang tải trang thanh toán...</p>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
