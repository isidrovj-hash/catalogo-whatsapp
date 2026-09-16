import type { ProductCardData } from '@/lib/data/products';
import { ProductCard } from '@/components/catalog/ProductCard';

export function RelatedProducts({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-4 text-2xl text-ink">También puedes necesitar</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
