import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCategoryBySlug, getCategoriesFlat } from '@/lib/data/categories';
import { getProducts, type SortOption } from '@/lib/data/products';
import { getActiveBrands } from '@/lib/data/brands';
import { logAnalyticsEvent } from '@/actions/analytics';
import { Filters } from '@/components/catalog/Filters';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { Pagination } from '@/components/catalog/Pagination';

interface CategoryPageProps {
  params: { slug: string };
  searchParams: {
    brandSlug?: string;
    onPromotion?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
  };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug);
  if (!category) return {};
  return {
    title: category.name,
    description: category.description ?? `Explora nuestros productos de ${category.name}.`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) notFound();

  const filters = {
    categorySlug: params.slug,
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

  await logAnalyticsEvent('CATEGORY_VIEW', undefined, { categorySlug: params.slug });

  return (
    <div className="container-app py-8">
      <nav className="mb-2 text-xs text-ink-soft">
        <Link href="/categorias" className="hover:text-brand">Categorías</Link>
        {category.parent && (
          <>
            {' / '}
            <Link href={`/categorias/${category.parent.slug}`} className="hover:text-brand">{category.parent.name}</Link>
          </>
        )}
        {' / '}
        <span className="text-ink">{category.name}</span>
      </nav>

      <h1 className="mb-1 text-3xl text-ink">{category.name}</h1>
      <p className="mb-6 text-sm text-ink-soft">{total} producto{total === 1 ? '' : 's'}</p>

      {category.children.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={`/categorias/${child.slug}`}
              className="rounded-full border border-surface-border px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-brand hover:text-brand"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mb-6">
        <Filters actionPath={`/categorias/${params.slug}`} categories={categories} brands={brands} current={filters} lockCategory />
      </div>

      <ProductGrid products={products} />

      <Pagination
        basePath={`/categorias/${params.slug}`}
        currentParams={{
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
