import styles from './ProductCard.module.css';

export type ProductSummary = {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  stock: number;
};

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <article className={`${styles.card} ${product.stock === 0 ? styles.unavailable : ''}`}>
      <img className={styles.picture} src={product.imageUrl} alt={product.name} loading="lazy" />
      <div className={styles.content}>
        <h2 className={styles.name}>{product.name}</h2>
        <p className={styles.price}>{product.price.toLocaleString('vi-VN')} ₫</p>
        {product.stock === 0 && <strong className={styles.soldOut}>Hết hàng</strong>}
      </div>
    </article>
  );
}
