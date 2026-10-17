'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import MenuIcon from '@/components/MenuIcons';
import { CATEGORY_LABELS, formatVnd, getProductImage, type Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const soldOut = product.stock === 0;
  const productUrl = `/products/${encodeURIComponent(product.id)}`;
  const image = imageFailed
    ? '/images/coffee-placeholder.svg'
    : getProductImage(product.imageUrl);
  const category = product.category
    ? CATEGORY_LABELS[product.category] || product.category.replace(/_/g, ' ')
    : 'BrewLite';

  return (
    <article className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E8E5E1] bg-white shadow-sm transition ${soldOut ? 'opacity-65' : 'hover:-translate-y-1 hover:shadow-lg'}`}>
      <div className="relative aspect-square overflow-hidden bg-[#F7F3EE]">
        {soldOut ? (
          <Image
            src={image}
            alt={product.name}
            fill
            unoptimized
            sizes="(max-width: 639px) 45vw, (max-width: 1023px) 30vw, 24vw"
            className="object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Link
            href={productUrl}
            aria-label={`Xem chi tiết ${product.name}`}
            className="relative block h-full w-full focus-visible:outline-2 focus-visible:outline-[#C28B5B]"
          >
            <Image
              src={image}
              alt={product.name}
              fill
              unoptimized
              sizes="(max-width: 639px) 45vw, (max-width: 1023px) 30vw, 24vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageFailed(true)}
            />
          </Link>
        )}

        {soldOut && <div className="pointer-events-none absolute inset-0 bg-white/30" />}
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-[#FBF8F3]/95 px-3 py-1.5 text-[11px] font-bold text-[#2A1810]">
          {soldOut ? 'Hết hàng' : category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="min-h-[2.7em] font-serif text-base font-bold leading-[1.35] sm:text-lg">
          {soldOut ? product.name : (
            <Link href={productUrl} className="hover:text-[#946844] focus-visible:underline">
              {product.name}
            </Link>
          )}
        </h3>
        <p className="mt-2 hidden min-h-[3em] text-sm leading-relaxed text-[#6B5D52] sm:line-clamp-2">
          {product.description || 'Đồ uống BrewLite'}
        </p>

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-[#F0ECE7] pt-4 sm:mt-4">
          <div>
            <span className="block text-[11px] uppercase text-[#8B786B]">Giá từ</span>
            <strong className="block whitespace-nowrap font-serif text-base sm:text-xl">
              {formatVnd(product.price)}
            </strong>
          </div>
          {soldOut ? (
            <span aria-label="Hết hàng" className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-200 text-stone-500">
              <MenuIcon name="lock" size={18} />
            </span>
          ) : (
            <Link
              href={productUrl}
              aria-label={`Chọn món ${product.name}`}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2A1810] text-white hover:bg-[#6D4C41] focus-visible:outline-2 focus-visible:outline-[#C28B5B]"
            >
              <MenuIcon name="arrow" size={19} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
