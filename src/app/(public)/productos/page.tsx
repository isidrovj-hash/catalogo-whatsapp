import type { Metadata } from 'next';
import { getProducts, type SortOption } from '@/lib/data/products';
import { getCategoriesFlat } from '@/lib/data/categories';
import { getActiveBrands } from '@/lib/data/brands';
import { logAnalyticsEvent } from '@/actions/analytics';
import { Filters } from '@/components/catalog/Filters';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { Pagination } from '@/components/catalog/Pagination';
import { TrackOnMount } from '@/components/analytics/TrackOnMount';

export const metadata: Metadata = {
  title: 'Productos',
  description: 'Explora nuestro catálogo completo de productos.',
};

interface ProductsPageProps {
  searchParams: {
    q?: string;
    categorySlug?: string;
    brandSlug?: string;
    onPromotion?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const filters = {
    q: searchParams.q,
    categorySlug: searchParams.categorySlug,
    brandSlug: searchParams.brandSlug,
    onPromotion: searchParams.onPromotion === '1',
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    sort: (searchParams.sort as SortOption | undefined) ?? undefined,
    page: searchParams.page ? Number(searchParams.page) : 1,
  };

  const [{ products, total, page, totalPages }, categories, brands] = await Promise.all([
    getProducts(filters),
    getCategoriesFlat(),
    getActiveBrands(),
  ]);

  if (filters.q) {
    await logAnalyticsEvent('SEARCH', undefined, { term: filters.q, results: total });
  }

  return (
    <div className="container-app py-8">
      {filters.q && <TrackOnMount event="search" params={{ search_term: filters.q }} />}
      <h1 className="mb-1 text-3xl text-ink">{filters.q ? `Resultados para "${filters.q}"` : 'Todos los productos'}</h1>
      <p className="mb-6 text-sm text-ink-soft">{total} producto{total === 1 ? '' : 's'} encontrado{total === 1 ? '' : 's'}</p>

      <div className="mb-6">
        <Filters actionPath="/productos" categories={categories} brands={brands} current={filters} />
      </div>

      <ProductGrid products={products} />

      <Pagination
        basePath="/productos"
        currentParams={{
          q: filters.q,
          categorySlug: filters.categorySlug,
          brandSlug: filters.brandSlug,
          onPromotion: filters.onPromotion ? '1' : undefined,
          minPrice: searchParams.minPrice,
          maxPrice: searchParams.maxPrice,
          sort: filters.sort,
        }}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
