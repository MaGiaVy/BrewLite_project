import client from './client';

export interface ProductToppingApi {
  id: string;
  name: string;
  price: number;
}

export interface ProductApi {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
  description: string;
  version: number;
  availableToppings?: ProductToppingApi[];
}

export async function fetchProducts(category?: string, search?: string): Promise<ProductApi[]> {
  const params: Record<string, string> = {};
  if (category) params.category = category;
  if (search) params.search = search;

  const res = await client.get('/api/v1/products', { params });
  return res.data?.data || [];
}

export async function fetchProductById(id: string): Promise<ProductApi> {
  const res = await client.get(`/api/v1/products/${id}`);
  return res.data?.data;
}
