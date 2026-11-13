import type { ProductSummary } from '../components/ProductCard';

const CATEGORY_ALIASES: Record<string, string> = {
  salt_phin: 'vietnamese',
  vietnamese: 'vietnamese',
  tea_matcha: 'tea',
  tea: 'tea',
  cold_brew: 'coldbrew',
  coldbrew: 'coldbrew',
  espresso: 'espresso',
  bakery: 'bakery',
};

export function normalizeCategory(category?: string | null): string {
  const key = (category ?? '').trim().toLowerCase();
  return CATEGORY_ALIASES[key] ?? key;
}

export function matchesCategory(
  productCategory: string | null | undefined,
  selectedCategory: string,
): boolean {
  if (selectedCategory === 'all') return true;
  if (!productCategory) return false;
  return normalizeCategory(productCategory) === normalizeCategory(selectedCategory);
}

export function isProductOutOfStock(product: {
  isOutOfStock?: boolean;
  availableServings?: number;
  stock?: number;
}): boolean {
  return (
    product.isOutOfStock === true ||
    (product.availableServings !== undefined && product.availableServings <= 0) ||
    Number(product.stock ?? 0) <= 0
  );
}

export function normalizeProduct(raw: Record<string, unknown>): ProductSummary {
  const isOut = raw.isOutOfStock === true;
  const availableServings =
    raw.availableServings !== undefined && raw.availableServings !== null
      ? Number(raw.availableServings)
      : undefined;
  const rawStock =
    raw.stock !== undefined && raw.stock !== null
      ? Number(raw.stock)
      : availableServings;
  const stock = isOut ? 0 : Number(rawStock ?? 0);
  const price = Number(raw.price ?? raw.basePrice ?? 0);

  return {
    ...(raw as Partial<ProductSummary>),
    id: (raw.id as number | string) ?? '',
    name: String(raw.name ?? ''),
    price,
    basePrice:
      raw.basePrice !== undefined && raw.basePrice !== null
        ? Number(raw.basePrice)
        : price,
    imageUrl: (raw.imageUrl as string | null) ?? null,
    stock,
    ...(availableServings !== undefined ? { availableServings } : {}),
    ...(typeof raw.isOutOfStock === 'boolean'
      ? { isOutOfStock: raw.isOutOfStock }
      : {}),
    ...(Array.isArray(raw.outOfStockSizes)
      ? { outOfStockSizes: raw.outOfStockSizes.map((s) => String(s).toUpperCase()) }
      : {}),
    badge:
      (raw.badge as string | undefined) ??
      (raw.tag ? String(raw.tag) : undefined),
  };
}

export function unwrapProductList(json: unknown): ProductSummary[] {
  const list = Array.isArray(json)
    ? json
    : json &&
        typeof json === 'object' &&
        'data' in json &&
        Array.isArray((json as { data: unknown }).data)
      ? (json as { data: unknown[] }).data
      : null;

  if (!list) return [];
  return list
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map(normalizeProduct);
}
