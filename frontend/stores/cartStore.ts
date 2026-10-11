'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartTopping {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string; // Composite unique key: `${productId}-${size}-${ice}-${sugar}-${toppingIds}`
  productId: string;
  name: string;
  basePrice: number;
  size: 'S' | 'M' | 'L';
  ice?: string;
  sugar?: string;
  toppings: CartTopping[];
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  imageUrl: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: {
    productId: string;
    name: string;
    basePrice: number;
    size: 'S' | 'M' | 'L';
    ice?: string;
    sugar?: string;
    toppings?: CartTopping[];
    quantity: number;
    imageUrl: string;
  }) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

const getSizeUpcharge = (size: 'S' | 'M' | 'L') => {
  if (size === 'M') return 5000;
  if (size === 'L') return 10000;
  return 0;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        const toppings = newItem.toppings || [];
        const sortedToppingIds = [...toppings].map((t) => t.id).sort().join(',');
        const compositeId = `${newItem.productId}-${newItem.size}-${newItem.ice || 'default'}-${newItem.sugar || 'default'}-${sortedToppingIds}`;

        const sizeUpcharge = getSizeUpcharge(newItem.size);
        const toppingsTotal = toppings.reduce((sum, t) => sum + t.price, 0);
        const unitPrice = newItem.basePrice + sizeUpcharge + toppingsTotal;

        set((state) => {
          const existingIndex = state.items.findIndex((item) => item.id === compositeId);

          if (existingIndex > -1) {
            // Đã có item trùng hoàn toàn -> cộng dồn số lượng (tối đa 20)
            const updatedItems = [...state.items];
            const currentItem = updatedItems[existingIndex];
            const newQty = Math.min(20, currentItem.quantity + newItem.quantity);
            updatedItems[existingIndex] = {
              ...currentItem,
              quantity: newQty,
              lineTotal: currentItem.unitPrice * newQty,
            };
            return { items: updatedItems };
          }

          // Item mới
          const safeQuantity = Math.min(20, Math.max(1, newItem.quantity));
          const createdItem: CartItem = {
            id: compositeId,
            productId: newItem.productId,
            name: newItem.name,
            basePrice: newItem.basePrice,
            size: newItem.size,
            ice: newItem.ice,
            sugar: newItem.sugar,
            toppings,
            quantity: safeQuantity,
            unitPrice,
            lineTotal: unitPrice * safeQuantity,
            imageUrl: newItem.imageUrl,
          };

          return { items: [...state.items, createdItem] };
        });
      },

      updateQuantity: (id, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((item) => item.id !== id) };
          }
          const safeQty = Math.min(20, quantity);
          return {
            items: state.items.map((item) =>
              item.id === id
                ? { ...item, quantity: safeQty, lineTotal: item.unitPrice * safeQty }
                : item
            ),
          };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.lineTotal, 0);
      },
    }),
    {
      name: 'brewlite-cart-storage',
    }
  )
);
