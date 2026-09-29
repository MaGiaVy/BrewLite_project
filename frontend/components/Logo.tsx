import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
  className?: string;
}

export default function Logo({
  size = "md",
  showSubtitle = true,
  className = "",
}: LogoProps) {
  // Kích thước icon SVG theo từng size
  const iconSizes = {
    sm: { w: 32, h: 28 },
    md: { w: 42, h: 36 },
    lg: { w: 56, h: 48 },
  };

  // Kích thước chữ BrewLite
  const titleSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  // Kích thước phụ đề CASHLESS COFFEE
  const subtitleSizes = {
    sm: "text-[7.5px] tracking-[0.2em]",
    md: "text-[9.5px] tracking-[0.22em]",
    lg: "text-xs tracking-[0.25em]",
  };

  const currentIcon = iconSizes[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Icon tách cà phê kèm làn khói & đĩa lót chuẩn theo thiết kế */}
      <svg
        width={currentIcon.w}
        height={currentIcon.h}
        viewBox="0 0 54 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Làn khói 1 (trái) */}
        <path
          d="M15 14C12.5 9.5 18 6.5 16.5 2.5"
          stroke="#BA7B"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        {/* Làn khói 2 (phải) */}
        <path
          d="M24 14C21.5 9 27 5.5 25.5 1.5"
          stroke="#BA7B4A"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        {/* Thân ly cà phê (kéo dài thêm độ sâu) */}
        <path d="M4 16H36C36 41 7 41 5 18Z" fill="#2B1A12" />
        {/* Quai ly (kéo dài theo thân ly) */}
        <path
          d="M34 20H40C45.5 20 45.5 32 40 32H34"
          stroke="#2B1A12"
          strokeWidth="3.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Đĩa lót (dịch xuống phía dưới đáy ly) */}
        <rect x="1" y="40" width="38" height="4.5" rx="2.25" fill="#BA7B4A" />
      </svg>

      {/* Phần Text thương hiệu */}
      <div className="flex flex-col justify-center leading-none">
        <div
          className={`font-extrabold ${titleSizes[size]} tracking-tight font-sans`}
        >
          <span className="text-[#231F20]">Brew</span>
          <span className="text-[#BA7B4A]">Lite</span>
        </div>
        {showSubtitle && (
          <span
            className={`font-semibold uppercase text-[#5C4D44] mt-1 font-sans ${subtitleSizes[size]}`}
          >
            CASHLESS COFFEE
          </span>
        )}
      </div>
    </div>
  );
}
