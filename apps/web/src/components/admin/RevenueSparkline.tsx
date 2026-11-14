import React, { useId, useMemo } from 'react';

export interface RevenueSparklineOrder {
  id?: number;
  totalAmount: number;
  createdAt: string;
  status?: string;
}

export interface RevenueSparklineProps {
  orders?: RevenueSparklineOrder[];
  className?: string;
}

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function toLocalDateKey(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Builds a smooth cubic Bezier path through a series of points (x, y).
 */
function buildSmoothBezierPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // Catmull-Rom to Cubic Bezier conversion
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return path;
}

export function RevenueSparkline({ orders = [], className = '' }: RevenueSparklineProps) {
  const gradId = useId();

  const { points, dayNames, maxVal, minVal } = useMemo(() => {
    const now = new Date();
    const days: Array<{ label: string; dateStr: string; total: number }> = [];

    // Construct 7 daily buckets ending today
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = toLocalDateKey(d);
      const dayIndex = (d.getDay() + 6) % 7; // 0 = T2, 6 = CN
      const label = i === 0 ? `${DAY_LABELS[dayIndex]} (Nay)` : DAY_LABELS[dayIndex];
      days.push({ label, dateStr: dateKey, total: 0 });
    }

    // Accumulate valid non-cancelled orders
    orders.forEach((o) => {
      if (o.status === 'CANCELLED') return;
      const oDate = typeof o.createdAt === 'string' ? toLocalDateKey(o.createdAt) : '';
      const bucket = days.find((b) => b.dateStr === oDate);
      if (bucket) {
        bucket.total += Number(o.totalAmount || 0);
      }
    });

    const values = days.map((d) => d.total);
    const rawMax = Math.max(...values, 0);
    const rawMin = Math.min(...values, 0);

    // Provide a pleasant aesthetic baseline even if data is 0 or flat
    const safeMax = rawMax > 0 ? rawMax * 1.15 : 100000;
    const safeMin = 0;
    const range = safeMax - safeMin || 1;

    // SVG canvas viewBox is 0 0 320 60
    // X ranges from 12 to 308 (7 points evenly spaced)
    // Y ranges from 12 (top) to 48 (bottom)
    const pts = days.map((d, idx) => {
      const x = 12 + idx * ((308 - 12) / 6);
      // Normalized Y: higher revenue = smaller Y (near top)
      const ratio = Math.max(0, Math.min(1, (d.total - safeMin) / range));
      // Give a gentle curve wave if all totals are 0 for aesthetic showcase
      const fallbackY = 44 - Math.sin((idx / 6) * Math.PI) * 12;
      const y = rawMax > 0 ? 48 - ratio * (48 - 12) : fallbackY;
      return { x, y, total: d.total };
    });

    return {
      points: pts,
      dayNames: days.map((d) => d.label),
      maxVal: rawMax,
      minVal: rawMin,
    };
  }, [orders]);

  const linePath = useMemo(() => buildSmoothBezierPath(points), [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const first = points[0];
    const last = points[points.length - 1];
    return `${linePath} L ${last.x.toFixed(2)} 60 L ${first.x.toFixed(2)} 60 Z`;
  }, [linePath, points]);

  const todayPoint = points[points.length - 1];

  return (
    <div className={`mt-2.5 pt-1 ${className}`} data-testid="revenue-sparkline">
      <div className="relative w-full h-[52px]">
        <svg viewBox="0 0 320 60" fill="none" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C68B59" stopOpacity="0.32" />
              <stop offset="70%" stopColor="#C68B59" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#C68B59" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Subtle Grid Reference Lines */}
          <line x1="12" y1="20" x2="308" y2="20" stroke="#F0EAE1" strokeDasharray="3 3" />
          <line x1="12" y1="42" x2="308" y2="42" stroke="#F0EAE1" strokeDasharray="3 3" />

          {/* Gradient Area Fill */}
          {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}

          {/* Smooth Bezier Line Path */}
          {linePath && (
            <path
              d={linePath}
              stroke="#1C1917"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Regular Data Points */}
          {points.slice(0, -1).map((pt, i) => (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r="2.5"
              fill="#FAF6F0"
              stroke="#1C1917"
              strokeWidth="1.5"
            />
          ))}

          {/* Today's Pulse Glowing Dot */}
          {todayPoint && (
            <g>
              <circle
                cx={todayPoint.x}
                cy={todayPoint.y}
                r="7"
                fill="#D4AF37"
                style={{
                  transformOrigin: `${todayPoint.x}px ${todayPoint.y}px`,
                  animation: 'pulseRing 2s infinite ease-out',
                }}
              />
              <circle
                cx={todayPoint.x}
                cy={todayPoint.y}
                r="3.5"
                fill="#1C1917"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Weekday Axis Labels */}
      <div className="flex items-center justify-between text-[9px] font-semibold text-[#78716C] mt-1 px-1">
        {dayNames.map((name, idx) => (
          <span
            key={idx}
            className={idx === dayNames.length - 1 ? 'font-bold text-[#1C1917]' : ''}
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

export default RevenueSparkline;
