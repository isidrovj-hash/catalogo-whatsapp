import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesState {
  productIds: string[];
  toggle: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
}

// Favoritos guardados localmente (sección 46). Cuando exista cuenta de
// cliente en el CRM futuro, esta misma estructura (un arreglo de ids) es
// trivial de sincronizar contra una tabla `favorites` en base de datos.
export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      productIds: [],
      toggle: (productId) =>
        set((state) => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds.filter((id) => id !== productId)
            : [...state.productIds, productId],
        })),
      isFavorite: (productId) => get().productIds.includes(productId),
    }),
    { name: 'catalogo-whatsapp-favorites' }
  )
);
