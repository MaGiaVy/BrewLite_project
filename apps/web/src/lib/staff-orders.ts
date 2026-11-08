export type OrderStatus = 'PAID' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface RecipeBreakdownItem {
  ingredientCode: string;
  ingredientName: string;
  unit: string;
  amountPerUnit: number;
  totalAmount: number;
}

export interface ToppingBreakdownItem {
  toppingName: string;
  ingredientName: string;
  unit: string;
  totalAmount: number;
}

export interface StaffOrderItem {
  id: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitPrice: number;
  size?: string | null;
  toppings?: string[] | string | null;
  notes?: string | null;
  recipeBreakdown?: RecipeBreakdownItem[];
  toppingBreakdown?: ToppingBreakdownItem[];
  product?: {
    id: number;
    name: string;
    imageUrl?: string;
  };
}

export interface StaffOrder {
  id: number;
  status: OrderStatus;
  createdAt: string;
  items: StaffOrderItem[];
  user?: {
    id: number;
    email: string;
    fullName: string | null;
    phone?: string | null;
  } | null;
  totalAmount?: number;
}

export function groupByStatus(orders: StaffOrder[]): Record<'PAID' | 'PREPARING' | 'READY' | 'COMPLETED', StaffOrder[]> {
  const result: Record<'PAID' | 'PREPARING' | 'READY' | 'COMPLETED', StaffOrder[]> = {
    PAID: [],
    PREPARING: [],
    READY: [],
    COMPLETED: [],
  };

  for (const order of orders) {
    if (order.status === 'PAID') result.PAID.push(order);
    else if (order.status === 'PREPARING') result.PREPARING.push(order);
    else if (order.status === 'READY') result.READY.push(order);
    else if (order.status === 'COMPLETED') result.COMPLETED.push(order);
  }

  return result;
}

export function sortOldestFirst(orders: StaffOrder[]): StaffOrder[] {
  return [...orders].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function waitMinutes(createdAt: string, now: Date = new Date()): number {
  const created = new Date(createdAt).getTime();
  const diffMs = Math.max(0, now.getTime() - created);
  return Math.floor(diffMs / (1000 * 60));
}

export function isLate(minutes: number): boolean {
  return minutes >= 10;
}

export function nextAction(
  status: OrderStatus,
): { next: 'PREPARING' | 'READY' | 'COMPLETED'; label: string; needsConfirm: boolean } | null {
  switch (status) {
    case 'PAID':
      return { next: 'PREPARING', label: 'Bắt đầu pha', needsConfirm: false };
    case 'PREPARING':
      return { next: 'READY', label: 'Báo đã xong', needsConfirm: false };
    case 'READY':
      return { next: 'COMPLETED', label: 'Giao khách', needsConfirm: true };
    default:
      return null;
  }
}

export function parseToppings(value: string[] | string | null | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((s) => String(s).trim()).filter(Boolean);
        }
      } catch {
        // Fallback to comma separation
      }
    }
    return trimmed
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export function parseNotesChips(notes: string | null | undefined): string[] {
  if (!notes) return [];
  return notes
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const lower = s.toLowerCase();
      if (lower.includes('đá') || lower.includes('ice')) return `🧊 ${s}`;
      if (lower.includes('đường') || lower.includes('ngọt') || lower.includes('sugar')) return `🍬 ${s}`;
      if (lower.includes('sả') || lower.includes('chanh') || lower.includes('đào')) return `🌿 ${s}`;
      if (lower.includes('trứng') || lower.includes('kem') || lower.includes('foam')) return `🥚 ${s}`;
      return `📝 ${s}`;
    });
}
