import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  promoPrice: number | null;
  unit: string;
  presentation: string;
  imageUrl: string | null;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

// Carrito persistido en localStorage (sección 33): sobrevive a recargas de
// página sin exigir que el cliente cree una cuenta. `productId` es la clave
// de identidad de cada línea; si el producto ya está en el carrito, se suma
// la cantidad en vez de crear una fila duplicada.
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
        }),

      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
        })),

      clear: () => set({ items: [] }),
    }),
    { name: 'catalogo-whatsapp-cart' }
  )
);

// Selectores derivados como funciones puras (no como parte del store) para
// que cualquier componente pueda calcular totales sin duplicar lógica.
export function getCartTotalItems(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + (item.promoPrice ?? item.price) * item.quantity, 0);
}
