'use client';

import { use, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import AuthHydration from '@/components/AuthHydration';
import { MOCK_PRODUCTS, ProductTopping } from '@/data/mockProducts';
import { useCartStore } from '@/stores/cartStore';

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  // Tìm sản phẩm trong mock data (hoặc backend API)
  const product = MOCK_PRODUCTS.find((p) => p.id === resolvedParams.id) || MOCK_PRODUCTS[0];

  // Trạng thái cấu hình món
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L'>('S');
  const [selectedToppings, setSelectedToppings] = useState<ProductTopping[]>([]);
  const [selectedIce, setSelectedIce] = useState('100% Đá');
  const [selectedSugar, setSelectedSugar] = useState('Chuẩn Ngọt');
  const [quantity, setQuantity] = useState(1);
  const [isAddedToast, setIsAddedToast] = useState(false);

  // Tính giá theo thời gian thực (Realtime Pricing)
  const sizeUpcharge = selectedSize === 'M' ? 5000 : selectedSize === 'L' ? 10000 : 0;
  const toppingsTotal = selectedToppings.reduce((sum, t) => sum + t.price, 0);
  const unitPrice = product.price + sizeUpcharge + toppingsTotal;
  const totalPrice = unitPrice * quantity;

  // Xử lý toggle topping
  const handleToggleTopping = (topping: ProductTopping) => {
    if (selectedToppings.some((t) => t.id === topping.id)) {
      setSelectedToppings(selectedToppings.filter((t) => t.id !== topping.id));
    } else {
      setSelectedToppings([...selectedToppings, topping]);
    }
  };

  // Thêm vào giỏ hàng
  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      basePrice: product.price,
      size: selectedSize,
      ice: selectedIce,
      sugar: selectedSugar,
      toppings: selectedToppings,
      quantity,
      imageUrl: product.imageUrl,
    });

    setIsAddedToast(true);
    setTimeout(() => {
      setIsAddedToast(false);
      router.push('/cart');
    }, 800);
  };

  const isSoldOut = product.stock <= 0;

  return (
    <AuthHydration>
      <div className="min-h-screen bg-[#FBF8F3] flex flex-col pb-24 md:pb-12">
        <Navbar />

        {/* Toast thông báo đã thêm */}
        {isAddedToast && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl bg-[#2A1810] px-5 py-3 text-sm font-semibold text-white shadow-xl animate-bounce">
            <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Đã thêm vào giỏ hàng thành công!
          </div>
        )}

        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
          {/* Thanh breadcrumb & trạng thái quầy bar */}
          <div className="flex items-center justify-between pb-6 border-b border-[#E8E5E1]">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#2A1810] hover:text-[#C28B5B] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay lại Thực đơn · Back to menu
            </Link>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Express Bar 01 · Sẵn sàng pha chế
            </span>
          </div>

          {/* Bố cục 2 Cột trên Desktop */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Cột Trái (5/12): Hình ảnh & Storytelling */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-white border border-[#E8E5E1] shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {/* Badges trên ảnh */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#2A1810]/90 backdrop-blur-sm text-[11px] font-bold text-white shadow-xs">
                    Signature Roastery
                  </span>
                  {product.origin && (
                    <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[11px] font-bold text-[#8A5A00] shadow-xs">
                      {product.origin}
                    </span>
                  )}
                </div>
              </div>

              {/* 3 Metric cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white border border-[#E8E5E1] p-3 text-center">
                  <p className="font-bold text-xs text-[#2A1810]">Đậm đà êm ái</p>
                  <p className="text-[10px] text-[#6B5D52] mt-0.5">Single Shot Phin</p>
                </div>
                <div className="rounded-2xl bg-white border border-[#E8E5E1] p-3 text-center">
                  <p className="font-bold text-xs text-[#2A1810]">Kem muối biển</p>
                  <p className="text-[10px] text-[#6B5D52] mt-0.5">Công thức ủ lạnh</p>
                </div>
                <div className="rounded-2xl bg-white border border-[#E8E5E1] p-3 text-center">
                  <p className="font-bold text-xs text-[#2A1810]">3 - 5 Phút</p>
                  <p className="text-[10px] text-[#6B5D52] mt-0.5">Trạm Express</p>
                </div>
              </div>

              {/* Taste Note card */}
              <div className="rounded-2xl bg-white border border-[#E8E5E1] p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-sm text-[#2A1810]">
                    Trải nghiệm hương vị · Taste Note
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#C28B5B] bg-[#F8EBE0] px-2 py-0.5 rounded-sm">
                    ARTISANAL RECIPE
                  </span>
                </div>
                <p className="text-xs text-[#6B5D52] leading-relaxed mt-2.5">
                  {product.tasteNote || product.description}
                </p>
                <div className="mt-3.5 pt-3.5 border-t border-[#F7F3EE] flex items-start gap-2 text-xs text-[#8A5A00] bg-amber-50/50 p-3 rounded-xl">
                  <span className="text-base">💡</span>
                  <span>
                    <strong>Gợi ý thưởng thức:</strong> Nên uống trực tiếp từ miệng ly (không cần ống hút) nghiêng góc 45° để cảm nhận trọn vẹn lớp kem béo mặn sóng sánh.
                  </span>
                </div>
              </div>
            </div>

            {/* Cột Phải (7/12): Cấu hình tùy chọn & Đặt món */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Header sản phẩm */}
              <div className="border-b border-[#E8E5E1] pb-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#C28B5B]">
                    CÀ PHÊ THỦ CÔNG · SIGNATURE
                  </span>
                  <span className="text-xs text-[#6B5D52] font-mono">
                    Mã: {product.code}
                  </span>
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#2A1810] mt-1.5">
                  {product.name}
                </h1>
                <p className="text-sm text-[#6B5D52] mt-0.5">
                  {product.subtitle}
                </p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-serif text-2xl font-bold text-[#2A1810]">
                    {product.price.toLocaleString('vi-VN')}đ
                  </span>
                  <span className="text-xs text-[#6B5D52]">
                    (Giá gốc size S · Base)
                  </span>
                </div>
              </div>

              {/* 1. Chọn kích thước · Size */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-[#2A1810]">
                    1. Chọn kích thước · Size
                  </label>
                  <span className="text-[11px] font-bold text-[#B3261E] uppercase">
                    Bắt buộc · Required
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      { id: 'S', label: 'Size S', vol: 'Nhỏ · 250ml', upcharge: 0 },
                      { id: 'M', label: 'Size M', vol: 'Vừa · 350ml', upcharge: 5000 },
                      { id: 'L', label: 'Size L', vol: 'Lớn · 500ml', upcharge: 10000 },
                    ] as const
                  ).map((size) => {
                    const isSelected = selectedSize === size.id;
                    return (
                      <button
                        key={size.id}
                        type="button"
                        onClick={() => setSelectedSize(size.id)}
                        className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition-all ${
                          isSelected
                            ? 'bg-[#2A1810] text-white border-[#2A1810] shadow-sm'
                            : 'bg-white text-[#2A1810] border-[#E8E5E1] hover:border-[#2A1810]'
                        }`}
                      >
                        <span className="font-bold text-sm">{size.label}</span>
                        <span className={`text-[11px] mt-0.5 ${isSelected ? 'text-stone-300' : 'text-[#6B5D52]'}`}>
                          {size.vol}
                        </span>
                        <span className={`text-xs font-semibold mt-1 ${isSelected ? 'text-[#C28B5B]' : 'text-[#2A1810]'}`}>
                          {size.upcharge > 0 ? `+${size.upcharge.toLocaleString('vi-VN')}đ` : '+0đ'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Tùy chọn Mức Đá & Mức Đường */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mức Đá */}
                <div>
                  <label className="text-xs font-bold text-[#2A1810] block mb-2">
                    Mức Đá · Ice level
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['100% Đá', '70% Đá', '50% Đá', 'Không Đá'].map((ice) => (
                      <button
                        key={ice}
                        type="button"
                        onClick={() => setSelectedIce(ice)}
                        className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                          selectedIce === ice
                            ? 'bg-[#2A1810] text-white border-[#2A1810]'
                            : 'bg-white text-[#6B5D52] border-[#E8E5E1] hover:border-stone-400'
                        }`}
                      >
                        {ice}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mức Đường */}
                <div>
                  <label className="text-xs font-bold text-[#2A1810] block mb-2">
                    Mức Đường · Sweetness
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Chuẩn Ngọt', '70% Đường', '50% Đường', 'Không Đường'].map((sugar) => (
                      <button
                        key={sugar}
                        type="button"
                        onClick={() => setSelectedSugar(sugar)}
                        className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                          selectedSugar === sugar
                            ? 'bg-[#2A1810] text-white border-[#2A1810]'
                            : 'bg-white text-[#6B5D52] border-[#E8E5E1] hover:border-stone-400'
                        }`}
                      >
                        {sugar}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Thêm Topping · Extras */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-[#2A1810]">
                    2. Thêm Topping · Extras
                  </label>
                  <span className="text-[11px] font-medium text-[#6B5D52]">
                    Tùy chọn · Optional
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {product.toppings.map((topping) => {
                    const isChecked = selectedToppings.some((t) => t.id === topping.id);
                    return (
                      <button
                        key={topping.id}
                        type="button"
                        onClick={() => handleToggleTopping(topping)}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                          isChecked
                            ? 'bg-[#F8EBE0] border-[#C28B5B]'
                            : 'bg-white border-[#E8E5E1] hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
                              isChecked
                                ? 'bg-[#2A1810] border-[#2A1810] text-white'
                                : 'border-[#E8E5E1] bg-white'
                            }`}
                          >
                            {isChecked && (
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm font-semibold text-[#2A1810]">
                            {topping.name}
                          </span>
                          {topping.recommended && (
                            <span className="text-[10px] font-bold text-[#8A5A00] bg-amber-100 px-2 py-0.5 rounded-full">
                              Khuyên dùng
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-[#2A1810]">
                          +{topping.price.toLocaleString('vi-VN')}đ
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Số lượng · Quantity */}
              <div className="flex items-center justify-between pt-2">
                <label className="text-sm font-bold text-[#2A1810]">
                  3. Số lượng · Quantity
                </label>
                <div className="flex items-center gap-3 rounded-full border border-[#E8E5E1] bg-white p-1 shadow-2xs">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[#2A1810] hover:bg-[#F7F3EE] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                  <span className="w-8 text-center font-bold text-base text-[#2A1810]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= 20}
                    onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[#2A1810] hover:bg-[#F7F3EE] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Nút hành động chính (Desktop) */}
              <div className="mt-4 pt-4 border-t border-[#E8E5E1]">
                {isSoldOut ? (
                  <button
                    disabled
                    className="w-full py-4 rounded-2xl bg-stone-300 text-stone-500 font-bold text-base cursor-not-allowed"
                  >
                    Sản phẩm tạm hết hàng · Sold out
                  </button>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-[#2A1810] text-white hover:bg-[#42271A] active:scale-[0.99] transition-all shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <span className="font-bold text-base">
                        Thêm vào giỏ hàng · Add to cart
                      </span>
                    </div>
                    <span className="font-serif text-lg font-bold text-white">
                      {totalPrice.toLocaleString('vi-VN')}đ
                    </span>
                  </button>
                )}

                <div className="mt-3 flex items-center justify-between text-xs text-[#6B5D52] px-1">
                  <span>⚡ Pha chế siêu tốc · Nhận ngay tại quầy</span>
                  <span>🔒 100% Cashless</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Sticky Action Bar trên Mobile (< md) */}
        {!isSoldOut && (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#FBF8F3]/95 backdrop-blur-md border-t border-[#E8E5E1] p-4 md:hidden shadow-xl">
            <button
              onClick={handleAddToCart}
              className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-[#2A1810] text-white active:scale-95 transition-all shadow-md"
            >
              <span className="font-bold text-sm">
                Thêm vào giỏ hàng
              </span>
              <span className="font-serif text-base font-bold">
                {totalPrice.toLocaleString('vi-VN')}đ
              </span>
            </button>
          </div>
        )}
      </div>
    </AuthHydration>
  );
}
