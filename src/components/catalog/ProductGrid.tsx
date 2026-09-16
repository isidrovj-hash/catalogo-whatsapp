import { PackageSearch } from 'lucide-react';
import type { ProductCardData } from '@/lib/data/products';
import { ProductCard } from './ProductCard';

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-surface-border py-16 text-center">
        <PackageSearch className="h-10 w-10 text-ink-soft/40" />
        <p className="text-sm font-medium text-ink">No encontramos productos con esos filtros.</p>
        <p className="text-xs text-ink-soft">Prueba con otra búsqueda o quita algunos filtros.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
