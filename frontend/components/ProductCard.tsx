'use client';

import Link from 'next/link';
import { Product } from '@/data/mockProducts';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const isSoldOut = product.stock <= 0;
  const formattedPrice = product.price.toLocaleString('vi-VN');

  return (
    <div
      className={`group relative flex flex-col rounded-2xl bg-white border border-[#E8E5E1] p-3 sm:p-4 transition-all duration-300 hover:shadow-md hover:border-[#C28B5B]/50 ${
        isSoldOut ? 'opacity-70' : ''
      }`}
    >
      {/* Khối Hình ảnh tỉ lệ vuông 1:1 */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#F7F3EE]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt={product.name}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            isSoldOut ? 'grayscale contrast-75' : ''
          }`}
          loading="lazy"
        />

        {/* Badge phân loại ở góc trên bên trái */}
        {product.badge && !isSoldOut && (
          <div className="absolute top-2.5 left-2.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase shadow-xs ${
                product.badge === 'BESTSELLER'
                  ? 'bg-[#2A1810] text-white'
                  : product.badge === 'TRUYỀN THỐNG'
                  ? 'bg-amber-100 text-[#8A5A00] border border-amber-200'
                  : product.badge === 'PHA MÁY'
                  ? 'bg-stone-800 text-stone-100'
                  : product.badge === 'Ủ LẠNH 18H'
                  ? 'bg-[#F8EBE0] text-[#8A5A00] border border-[#EAD8CA]'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {product.badge === 'BESTSELLER' && (
                <svg className="w-3 h-3 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              )}
              {product.badge}
            </span>
          </div>
        )}

        {/* Overlay nếu Hết hàng */}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-[#B3261E] shadow-sm">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
              Hết hàng · Sold out
            </span>
          </div>
        )}
      </div>

      {/* Thông tin sản phẩm */}
      <div className="flex flex-1 flex-col pt-3 sm:pt-4">
        {/* Tên món + Tag phân loại */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-base sm:text-lg font-bold text-[#2A1810] group-hover:text-[#C28B5B] transition-colors line-clamp-1">
            {product.name}
          </h3>
          <span className="shrink-0 text-[10px] font-bold tracking-wider uppercase text-[#6B5D52] bg-[#F7F3EE] px-1.5 py-0.5 rounded-sm">
            {product.category}
          </span>
        </div>

        {/* Mô tả món (Ẩn trên mobile siêu nhỏ, hiện trên màn hình lớn) */}
        <p className="mt-1 text-xs text-[#6B5D52] line-clamp-2 leading-relaxed hidden sm:block">
          {product.description}
        </p>

        {/* Chân thẻ: Giá tiền và Nút xem chi tiết */}
        <div className="mt-auto flex items-end justify-between pt-3 sm:pt-4 border-t border-[#F7F3EE]">
          <div>
            <p className="text-[10px] font-medium text-[#6B5D52]">
              Giá từ · From
            </p>
            <p className="font-serif text-base sm:text-lg font-bold text-[#2A1810]">
              Từ {formattedPrice}đ
            </p>
          </div>

          {/* Nút bấm chuyển sang trang chi tiết */}
          {isSoldOut ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-400 cursor-not-allowed">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          ) : (
            <Link
              href={`/products/${product.id}`}
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white border border-[#E8E5E1] text-[#2A1810] shadow-xs transition-all duration-200 group-hover:bg-[#2A1810] group-hover:text-white group-hover:border-[#2A1810]"
              aria-label={`Chọn tùy chỉnh cho ${product.name}`}
            >
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
