import { client } from '@/api/client';
import type { ApiResponse, Product } from '@/types/product';

// Client của nhóm có thể cấu hình URL kèm /api/v1 hoặc không.
// Dùng origin để tránh gọi trùng /api/v1/api/v1/products.
export async function fetchProducts(): Promise<Product[]> {
  const configured = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const apiOrigin = new URL(configured).origin;
  const response = await client.get<ApiResponse<Product[]>>(`${apiOrigin}/api/v1/products`);
  const payload = response.data;
  if (!payload || !Array.isArray(payload.data)) {
    throw new Error('API /products trả về dữ liệu không hợp lệ (thiếu mảng data)');
  }
  for (const product of payload.data) {
    if (!product || typeof product.id !== 'string' || typeof product.name !== 'string'
      || !Number.isFinite(product.price) || product.price < 0
      || !Number.isFinite(product.stock) || product.stock < 0) {
      throw new Error('Sản phẩm từ API thiếu id, name, price hoặc stock hợp lệ');
    }
  }
  return payload.data;
}
