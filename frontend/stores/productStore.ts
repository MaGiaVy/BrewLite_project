import { create } from 'zustand';
import { fetchProducts as fetchProductsFromApi } from '@/api/products';
import { MOCK_PRODUCTS } from '@/mocks/products';
import type { Product } from '@/types/product';

interface ProductState {
  products: Product[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  loadProducts: (refresh?: boolean) => Promise<void>;
}

let pendingRequest: Promise<void> | null = null;

// Tránh gửi hai request giống nhau khi React render lại trong chế độ dev.
export const useProductStore = create<ProductState>((set, get) => ({
  products: [], isLoading: true, isLoaded: false, error: null,
  loadProducts: async (refresh = false) => {
    if (pendingRequest) return pendingRequest;
    if (get().isLoaded && !refresh) return;

    set({ isLoading: true, error: null });
    const currentRequest = (async () => {
      try {
        let products: Product[];
        if (process.env.NEXT_PUBLIC_USE_MOCK_PRODUCTS === 'true') {
          await new Promise((resolve) => setTimeout(resolve, 420));
          products = MOCK_PRODUCTS;
        } else {
          products = await fetchProductsFromApi();
        }
        set({ products, isLoaded: true, error: null });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Không thể kết nối tới máy chủ.';
        set({ products: [], isLoaded: false, error: message });
      } finally {
        set({ isLoading: false });
      }
    })();

    pendingRequest = currentRequest;
    try { await currentRequest; } finally { pendingRequest = null; }
  },
}));
