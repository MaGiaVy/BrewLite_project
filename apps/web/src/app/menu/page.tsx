'use client';
import { useEffect, useState } from 'react';
export type ProductSummary = { id: number; name: string; price: number; imageUrl: string; stock: number };
export type MenuState = 'loading' | 'empty' | 'error' | 'ready';
export function MenuContent({ products, state, retry }: { products: ProductSummary[]; state: MenuState; retry: () => void }) {
 if (state === 'loading') return <section aria-label="Đang tải" role="status"><p>Đang tải menu...</p><div className="skeleton"/><div className="skeleton"/></section>;
 if (state === 'error') return <div role="alert"><p>Không tải được menu</p><button onClick={retry}>Thử lại</button></div>;
 if (state === 'empty') return <p>Chưa có món</p>;
 return <div className="grid">{products.map(p => <article key={p.id} className="item">
  <h2>{p.name}</h2><p>{p.price.toLocaleString('vi-VN')} ₫</p>
  {p.stock === 0 && <strong className="soldout">Hết hàng</strong>}
  {p.stock > 0 && <a href={`/products/${p.id}`}>Chi tiết</a>}
 </article>)}</div>;
}
export default function Menu() {
 const [products, setProducts] = useState<ProductSummary[]>([]);
 const [state, setState] = useState<MenuState>('loading');
 const [attempt, setAttempt] = useState(0);
 useEffect(() => {
  const abort = new AbortController();
  setState('loading');
  fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/products`, {signal:abort.signal})
   .then(async res => { if (!res.ok) throw new Error('API lỗi'); return res.json(); })
   .then((response: {data: ProductSummary[]}) => {
    if (!Array.isArray(response.data)) throw new Error('Sai dữ liệu');
    setProducts(response.data); setState(response.data.length ? 'ready' : 'empty');
   }).catch(e => { if (e.name !== 'AbortError') setState('error'); });
  return () => abort.abort();
 },[attempt]);
 return <main><h1>Menu BrewLite</h1><MenuContent state={state} products={products} retry={() => setAttempt(n => n + 1)}/>
 <style jsx>{`main{max-width:1050px;margin:auto;padding:20px}.grid{display:grid;grid-template-columns:1fr;gap:16px}.item{border-radius:12px;padding:20px;background:white;border:1px solid #ddd}.soldout{display:block;color:#b91c1c}.skeleton{height:100px;background:#e2e8f0;border-radius:12px;margin:10px 0;animation:pulse 1.2s infinite}@keyframes pulse{50%{opacity:.4}}@media(min-width:640px){.grid{grid-template-columns:repeat(2,1fr)}}@media(min-width:960px){.grid{grid-template-columns:repeat(3,1fr)}}`}</style>
 </main>;
}
