import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  maxStock: number;
  categoryName: string | null;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => boolean;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  syncItemStock: (productId: number, maxStock: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) => {
        let added = false;
        set((state) => {
          const existing = state.items.find((cartItem) => cartItem.productId === item.productId);
          const qty = item.quantity ?? 1;

          if (existing) {
            if (existing.quantity >= item.maxStock) return state;
            const newQty = Math.min(existing.quantity + qty, item.maxStock);
            added = true;
            return {
              items: state.items.map((i) =>
                i.productId === item.productId ? { ...i, quantity: newQty, maxStock: item.maxStock } : i,
              ),
            };
          }

          added = true;
          return {
            items: [
              ...state.items,
              {
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: Math.min(qty, item.maxStock),
                maxStock: item.maxStock,
                categoryName: item.categoryName,
              },
            ],
          };
        });
        return added;
      },

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((cartItem) => cartItem.productId !== productId),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => i.productId !== productId) };
          }
          return {
            items: state.items.map((cartItem) =>
              cartItem.productId === productId
                ? { ...cartItem, quantity: Math.min(quantity, cartItem.maxStock) }
                : cartItem,
            ),
          };
        }),

      syncItemStock: (productId, maxStock) =>
        set((state) => ({
          items: state.items
            .map((cartItem) =>
              cartItem.productId === productId
                ? {
                    ...cartItem,
                    maxStock,
                    quantity: Math.min(cartItem.quantity, Math.max(0, maxStock)),
                  }
                : cartItem,
            )
            .filter((cartItem) => cartItem.quantity > 0),
        })),

      clearCart: () => set({ items: [] }),
    }),
    { name: "cachelab-cart" },
  ),
);

export function totalItems(items: CartItem[]) {
  return items.reduce((sum, cartItem) => sum + cartItem.quantity, 0);
}

export function subtotal(items: CartItem[]) {
  return items.reduce((sum, cartItem) => sum + cartItem.price * cartItem.quantity, 0);
}
