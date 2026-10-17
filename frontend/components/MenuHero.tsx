'use client';

import Image from 'next/image';
import MenuIcon from '@/components/MenuIcons';
import { CATEGORY_LABELS } from '@/types/product';

interface MenuHeroProps {
  search: string;
  category: string;
  categories: string[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}

export default function MenuHero({
  search,
  category,
  categories,
  onSearchChange,
  onCategoryChange,
}: MenuHeroProps) {
  function chooseCategory(value: string) {
    onCategoryChange(value);
    document.getElementById('thuc-don')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <section className="border-b border-[#EEE8E0] bg-[#F7F3EE]">
      <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-6 sm:px-6 md:pb-14 lg:px-10">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#EEE7DF] bg-white/70 px-4 py-3 text-xs sm:text-sm">
          <span className="flex items-center gap-2 font-medium text-[#5B4434]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#AE774D]" />
            BrewLite Roastery · Đặt trước, nhận tại quầy
            <span className="rounded-full bg-[#F8EBE0] px-2 py-1 text-[11px] text-[#814D26]">
              Pickup
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-[#7D6654]">
            <MenuIcon name="clock" size={15} />
            Đặt món không dùng tiền mặt
          </span>
        </div>

        <div className="grid items-center gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12">
          <div>
            <div className="mb-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F8EBE0] px-3 py-2 text-[11px] font-bold tracking-[0.08em] text-[#8B512D]">
                <MenuIcon name="spark" size={15} /> ĐẶT MÓN NHANH
              </span>
              <span className="rounded-full bg-[#EBE8E2] px-3 py-2 text-[11px] font-semibold text-[#66574A]">
                100% CASHLESS COFFEE
              </span>
            </div>

            <p className="mb-2 text-xs font-bold uppercase tracking-[.25em] text-[#966C4A]">
              Fresh brew · Easy pickup
            </p>
            <h1 className="font-serif text-[clamp(2.7rem,5.1vw,5.25rem)] font-bold leading-[1.09] tracking-tight">
              Skip the line,
              <br />
              <span className="italic text-[#8C5A36]">order your cozy cup.</span>
            </h1>
            <p className="mt-6 max-w-[600px] text-[15px] leading-7 text-[#6B5D52] sm:text-base">
              Cà phê rang thủ công, cold brew và những món bánh thơm ngon.
              Chọn món yêu thích và nhận nước tại quầy mà không cần xếp hàng.
            </p>

            <div className="mt-7 rounded-2xl border border-[#E8E0D8] bg-white/90 p-2 shadow-sm">
              <label className="relative block">
                <span className="sr-only">Tìm món trên thực đơn</span>
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#856E5C]">
                  <MenuIcon name="search" size={19} />
                </span>
                <input
                  value={search}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Tìm cà phê muối, matcha, cold brew..."
                  className="h-11 w-full rounded-xl border-0 bg-transparent pl-10 pr-3 text-sm outline-none placeholder:text-[#9A8B7E] focus-visible:ring-2 focus-visible:ring-[#C28B5B]/40"
                />
              </label>
              <div className="mt-1 flex flex-wrap gap-2 border-t border-[#F3EBE2] pt-2 text-xs">
                <button
                  type="button"
                  aria-pressed={category === 'ALL'}
                  onClick={() => chooseCategory('ALL')}
                  className={`rounded-full px-3 py-1.5 font-bold ${category === 'ALL' ? 'bg-[#2A1810] text-white' : 'bg-[#F6F0E9] text-[#6B5D52]'}`}
                >
                  Tất cả
                </button>
                {categories.slice(0, 3).map((code) => (
                  <button
                    key={code}
                    type="button"
                    aria-pressed={category === code}
                    onClick={() => chooseCategory(code)}
                    className={`rounded-full px-3 py-1.5 font-medium ${category === code ? 'bg-[#2A1810] text-white' : 'bg-[#F6F0E9] text-[#6B5D52]'}`}
                  >
                    {CATEGORY_LABELS[code] || code.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative isolate min-h-[280px] overflow-hidden rounded-3xl bg-[#4E3624] shadow-lg sm:min-h-[410px] lg:min-h-[430px]">
            <Image
              src="/images/hero-coffee.jpg"
              alt="Cà phê kem muối và bánh ngọt trên bàn"
              fill
              priority
              sizes="(max-width: 1023px) 95vw, 45vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#261A13]/85 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white sm:p-7">
              <span className="rounded-full bg-[#E9B386] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#4A2A17]">
                Barista Spotlight
              </span>
              <p className="mt-2 font-serif text-xl font-bold sm:text-2xl">
                Cà Phê Muối & Salted Sweet Cloud
              </p>
              <p className="mt-1 text-sm text-[#F5E6DC]">Một chút ấm áp mỗi ngày.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
