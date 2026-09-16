'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatCurrency } from '@/lib/format';
import type { MiniProduct } from '@/actions/products';
import { FavoriteButton } from './FavoriteButton';

interface MiniProductCardProps {
  product: MiniProduct;
  showFavorite?: boolean;
}

// Versión ligera de ProductCard para contextos 100% cliente (venta cruzada
// dentro del carrito, lista de favoritos), donde no tenemos forma de
// ejecutar la consulta async de WhatsApp por item sin convertir toda la
// sección en Server Component. El botón de WhatsApp por producto no aplica
// aquí; "Agregar" y el enlace a la ficha sí cubren el objetivo de conversión.
export function MiniProductCard({ product, showFavorite = true }: MiniProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const isSoldOut = product.availability === 'AGOTADO';

  return (
    <div className="relative flex flex-col overflow-hidden rounded-lg border border-surface-border bg-white">
      {showFavorite && (
        <div className="absolute right-2 top-2 z-10">
          <FavoriteButton productId={product.id} />
        </div>
      )}
      <Link href={`/productos/${product.slug}`} className="block aspect-square bg-surface-sunken">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-ink-soft/50">Sin imagen</div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link href={`/productos/${product.slug}`}>
          <h3 className="line-clamp-2 text-xs font-semibold text-ink hover:text-brand">{product.name}</h3>
        </Link>
        <p className="text-sm font-bold text-ink">{formatCurrency(product.promoPrice ?? product.price)}</p>
        <button
          type="button"
          disabled={isSoldOut}
          onClick={() =>
            addItem(
              {
                productId: product.id,
                name: product.name,
                slug: product.slug,
                sku: product.sku,
                price: product.price,
                promoPrice: product.promoPrice,
                unit: product.unit,
                presentation: product.presentation,
                imageUrl: product.imageUrl,
              },
              1
            )
          }
          className="btn-secondary mt-1 w-full py-1.5 text-xs"
        >
          <Plus className="h-3 w-3" /> {isSoldOut ? 'Agotado' : 'Agregar'}
        </button>
      </div>
    </div>
  );
}
