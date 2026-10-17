import type { SVGProps } from 'react';

type IconName = 'search' | 'bag' | 'user' | 'arrow' | 'spark' | 'clock' | 'check'
  | 'refresh' | 'menu' | 'close' | 'pin' | 'copy' | 'leaf' | 'shield' | 'filter' | 'lock';

interface MenuIconProps extends SVGProps<SVGSVGElement> { name: IconName; size?: number; }

export default function MenuIcon({ name, size = 20, ...props }: MenuIconProps) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...common} {...props}>
      {name === 'search' && <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></>}
      {name === 'bag' && <><path d="M5 8h14l1 12H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></>}
      {name === 'user' && <><circle cx="12" cy="8" r="4"/><path d="M4.7 21a7.3 7.3 0 0 1 14.6 0"/></>}
      {name === 'arrow' && <><path d="M4 12h16M14 6l6 6-6 6"/></>}
      {name === 'spark' && <><path d="m12 2-2.2 7.8L2 12l7.8 2.2L12 22l2.2-7.8L22 12l-7.8-2.2L12 2Z"/></>}
      {name === 'clock' && <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></>}
      {name === 'check' && <path d="m4 12 5 5L20 6"/>}
      {name === 'refresh' && <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.5 9A7 7 0 0 1 18 7l2 5M4 12l2 5a7 7 0 0 0 12.5-2"/></>}
      {name === 'menu' && <><path d="M4 7h16M4 12h16M4 17h16"/></>}
      {name === 'close' && <><path d="M5 5 19 19M19 5 5 19"/></>}
      {name === 'pin' && <><path d="M19 10c0 6-7 12-7 12S5 16 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.2"/></>}
      {name === 'copy' && <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></>}
      {name === 'leaf' && <><path d="M20 4C8 4 4 9 4 16a4 4 0 0 0 4 4c7 0 12-4 12-16Z"/><path d="M5 19c2-4 6-7 11-10"/></>}
      {name === 'shield' && <><path d="M12 2 20 6v6c0 5-3 8-8 10-5-2-8-5-8-10V6l8-4Z"/><path d="m9 12 2 2 4-4"/></>}
      {name === 'filter' && <><path d="M4 7h16M7 12h10M10 17h4"/></>}
      {name === 'lock' && <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>}
    </svg>
  );
}
