import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  lineId: string;
  id?: string;
  productId: string | number;
  name: string;
  size: 'S' | 'M' | 'L';
  toppingIds: string[];
  toppingNames?: string[];
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
  temperature?: 'iced' | 'hot' | 'COLD' | 'HOT';
  servingStyle?: string;
  iceLevel?: string;
  sugarLevel?: string;
  notes?: string;
  isBakery?: boolean;
}

export interface AddItemInput {
  productId: string | number;
  name: string;
  size: 'S' | 'M' | 'L';
  toppingIds?: string[];
  toppingNames?: string[];
  quantity?: number;
  unitPrice: number;
  imageUrl?: string;
  temperature?: 'iced' | 'hot' | 'COLD' | 'HOT';
  servingStyle?: string;
  iceLevel?: string;
  sugarLevel?: string;
  notes?: string;
  isBakery?: boolean;
}

export interface CartStore {
  items: CartItem[];
  appliedPromo: string | null;
  setAppliedPromo: (code: string | null) => void;
  addItem: (item: AddItemInput) => void;
  updateQty: (lineId: string, quantity: number) => void;
  updateCartItem: (lineId: string, updatedData: Partial<CartItem>) => void;
  removeItem: (lineId: string) => void;
  clear: () => void;
  selectTotal: () => number;
  getTotalCount: () => number;

  // Aliases tương thích Assignment 1 cũ
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      appliedPromo: null,
      setAppliedPromo: (code) => set({ appliedPromo: code }),

      addItem: (input) => {
        const toppingIds = [...(input.toppingIds ?? [])].sort();
        const lineId = `${input.productId}-${input.size}-${toppingIds.join(',')}`;
        const inputQty = input.quantity ?? 1;

        set((state) => {
          const existingIndex = state.items.findIndex((item) => item.lineId === lineId);

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            const currentItem = updatedItems[existingIndex];
            const newQty = Math.min(20, Math.max(1, currentItem.quantity + inputQty));
            updatedItems[existingIndex] = {
              ...currentItem,
              quantity: newQty,
            };
            return { items: updatedItems };
          }

          const safeQty = Math.min(20, Math.max(1, inputQty));
          const newItem: CartItem = {
            lineId,
            id: lineId,
            productId: input.productId,
            name: input.name,
            size: input.size,
            toppingIds,
            toppingNames: input.toppingNames ?? [],
            quantity: safeQty,
            unitPrice: input.unitPrice,
            imageUrl: input.imageUrl,
            temperature: input.temperature,
            servingStyle: input.servingStyle,
            iceLevel: input.iceLevel,
            sugarLevel: input.sugarLevel,
            notes: input.notes,
            isBakery: input.isBakery,
          };

          return { items: [...state.items, newItem] };
        });
      },

      updateQty: (lineId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((item) => item.lineId !== lineId) };
          }
          const safeQty = Math.min(20, quantity);
          return {
            items: state.items.map((item) =>
              item.lineId === lineId ? { ...item, quantity: safeQty } : item,
            ),
          };
        });
      },

      updateCartItem: (lineId, updatedData) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.lineId === lineId ? { ...item, ...updatedData } : item,
          ),
        }));
      },

      removeItem: (lineId) => {
        set((state) => ({
          items: state.items.filter((item) => item.lineId !== lineId),
        }));
      },

      clear: () => {
        set({ items: [], appliedPromo: null });
      },

      selectTotal: () => {
        return get().items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      },

      getTotalCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      // Aliases
      updateQuantity: (id, quantity) => get().updateQty(id, quantity),
      clearCart: () => get().clear(),
      getSubtotal: () => get().selectTotal(),
    }),
    {
      name: 'brewlite-cart-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
    },
  ),
);

export const cartStore = useCartStore;
