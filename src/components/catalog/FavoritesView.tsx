'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useFavoritesStore } from '@/store/favoritesStore';
import { getProductsByIds, type MiniProduct } from '@/actions/products';
import { MiniProductCard } from '@/components/catalog/MiniProductCard';

export function FavoritesView() {
  const productIds = useFavoritesStore((state) => state.productIds);
  const [products, setProducts] = useState<MiniProduct[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProductsByIds(productIds).then((result) => {
      if (!cancelled) setProducts(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productIds.join(',')]);

  if (products === null) {
    return <p className="text-sm text-ink-soft">Cargando tus favoritos...</p>;
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-surface-border py-16 text-center">
        <Heart className="h-10 w-10 text-ink-soft/40" />
        <p className="font-medium text-ink">Todavía no has guardado productos.</p>
        <p className="max-w-xs text-sm text-ink-soft">
          Toca el corazón ♡ en cualquier producto para guardarlo aquí y encontrarlo más rápido después.
        </p>
        <Link href="/productos" className="btn-primary">
          Ver productos
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <MiniProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
