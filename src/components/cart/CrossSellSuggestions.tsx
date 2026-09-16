'use client';

import { useEffect, useState } from 'react';
import { getCrossSellSuggestions, type MiniProduct } from '@/actions/products';
import { MiniProductCard } from '@/components/catalog/MiniProductCard';

/**
 * Se muestra como una sección discreta más abajo del resumen del carrito,
 * nunca como popup (requisito explícito de la sección 48). Si no hay
 * sugerencias razonables, la sección simplemente no se renderiza — es mejor
 * no mostrar nada que mostrar productos irrelevantes.
 */
export function CrossSellSuggestions({ cartProductIds }: { cartProductIds: string[] }) {
  const [suggestions, setSuggestions] = useState<MiniProduct[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (cartProductIds.length === 0) {
      setSuggestions([]);
      return;
    }
    getCrossSellSuggestions(cartProductIds).then((result) => {
      if (!cancelled) setSuggestions(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartProductIds.join(',')]);

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold text-ink">Completa tu compra</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {suggestions.map((product) => (
          <MiniProductCard key={product.id} product={product} showFavorite={false} />
        ))}
      </div>
    </section>
  );
}
