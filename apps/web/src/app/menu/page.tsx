import { formatVnd } from '../../lib/format';

interface Product {
  id: number;
  name: string;
  basePrice: number;
  stock: number;
}

export const dynamic = 'force-dynamic';

async function getProducts(): Promise<Product[]> {
  const base = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const res = await fetch(`${base}/products`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load products: ${res.status}`);
  return res.json();
}

export default async function MenuPage() {
  const products = await getProducts();
  return (
    <main>
      <h1>Menu</h1>
      <ul>
        {products.map((p) => (
          <li key={p.id} data-testid="product-card">
            {p.name} — {formatVnd(p.basePrice)} {p.stock === 0 ? '(hết hàng)' : ''}
          </li>
        ))}
      </ul>
    </main>
  );
}
