import { describe, expect, it } from 'vitest';
import {
  groupByStatus,
  isLate,
  nextAction,
  parseNotesChips,
  parseToppings,
  sortOldestFirst,
  waitMinutes,
  type StaffOrder,
} from './staff-orders';

const mk = (id: number, status: StaffOrder['status'], createdAt: string): StaffOrder => ({
  id,
  status,
  createdAt,
  items: [],
});

describe('T5.1f staff helpers', () => {
  it('WEB-T17 groups orders by status', () => {
    const g = groupByStatus([
      mk(1, 'PAID', '2026-11-07T10:00:00Z'),
      mk(2, 'PREPARING', '2026-11-07T10:01:00Z'),
      mk(3, 'READY', '2026-11-07T10:02:00Z'),
      mk(4, 'COMPLETED', '2026-11-07T10:03:00Z'),
      mk(5, 'CANCELLED', '2026-11-07T10:04:00Z'),
    ]);
    expect(g.PAID.map((o) => o.id)).toEqual([1]);
    expect(g.PREPARING.map((o) => o.id)).toEqual([2]);
    expect(g.READY.map((o) => o.id)).toEqual([3]);
    expect(g.COMPLETED.map((o) => o.id)).toEqual([4]);
  });

  it('WEB-T17 sorts longest wait first', () => {
    const sorted = sortOldestFirst([
      mk(1, 'PAID', '2026-11-07T10:05:00Z'),
      mk(2, 'PAID', '2026-11-07T10:00:00Z'),
    ]);
    expect(sorted.map((o) => o.id)).toEqual([2, 1]);
  });

  it('WEB-T17 isLate is true at 10 minutes and false at 9', () => {
    expect(isLate(9)).toBe(false);
    expect(isLate(10)).toBe(true);
    expect(waitMinutes('2026-11-07T10:00:00Z', new Date('2026-11-07T10:12:30Z'))).toBe(12);
  });

  it('WEB-T17 nextAction maps PAID/PREPARING/READY and returns null for COMPLETED/CANCELLED', () => {
    expect(nextAction('PAID')).toEqual({ next: 'PREPARING', label: 'Bắt đầu pha', needsConfirm: false });
    expect(nextAction('PREPARING')).toEqual({ next: 'READY', label: 'Báo đã xong', needsConfirm: false });
    expect(nextAction('READY')).toEqual({ next: 'COMPLETED', label: 'Giao khách', needsConfirm: true });
    expect(nextAction('COMPLETED')).toBeNull();
    expect(nextAction('CANCELLED')).toBeNull();
  });

  it('WEB-T17 parseToppings handles array, JSON string, comma string and null', () => {
    expect(parseToppings(['Trân châu', ' Kem cheese '])).toEqual(['Trân châu', 'Kem cheese']);
    expect(parseToppings('["Trân châu","Thạch"]')).toEqual(['Trân châu', 'Thạch']);
    expect(parseToppings('Trân châu, Thạch')).toEqual(['Trân châu', 'Thạch']);
    expect(parseToppings(null)).toEqual([]);
    expect(parseToppings(undefined)).toEqual([]);
    expect(parseToppings('')).toEqual([]);
  });

  it('WEB-T17 parseNotesChips categorizes ice, sugar, tea aroma and custom notes', () => {
    const chips = parseNotesChips('50% đá, 50% ngọt, nhiều sả, ít sữa');
    expect(chips).toContain('🧊 50% đá');
    expect(chips).toContain('🍬 50% ngọt');
    expect(chips).toContain('🌿 nhiều sả');
    expect(chips).toContain('📝 ít sữa');
  });
});
