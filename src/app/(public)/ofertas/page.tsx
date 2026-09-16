import type { Metadata } from 'next';
import { getProducts, type SortOption } from '@/lib/data/products';
import { getCategoriesFlat } from '@/lib/data/categories';
import { getActiveBrands } from '@/lib/data/brands';
import { Filters } from '@/components/catalog/Filters';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { Pagination } from '@/components/catalog/Pagination';

export const metadata: Metadata = {
  title: 'Ofertas',
  description: 'Productos en promoción por tiempo limitado.',
};

interface OffersPageProps {
  searchParams: {
    categorySlug?: string;
    brandSlug?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
  };
}

export default async function OffersPage({ searchParams }: OffersPageProps) {
  const filters = {
    categorySlug: searchParams.categorySlug,
    brandSlug: searchParams.brandSlug,
    onPromotion: true as const,
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

  return (
    <div className="container-app py-8">
      <h1 className="mb-1 text-3xl text-ink">Ofertas</h1>
      <p className="mb-6 text-sm text-ink-soft">{total} producto{total === 1 ? '' : 's'} en promoción</p>

      <div className="mb-6">
        <Filters actionPath="/ofertas" categories={categories} brands={brands} current={filters} hidePromotionToggle />
      </div>

      <ProductGrid products={products} />

      <Pagination
        basePath="/ofertas"
        currentParams={{
          categorySlug: filters.categorySlug,
          brandSlug: filters.brandSlug,
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
