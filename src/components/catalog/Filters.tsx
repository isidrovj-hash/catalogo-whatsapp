import { SlidersHorizontal } from 'lucide-react';
import type { ProductFilters } from '@/lib/data/products';

interface FiltersProps {
  actionPath: string;
  categories: { slug: string; name: string; parentId: string | null }[];
  brands: { slug: string; name: string }[];
  current: ProductFilters;
  /** Cuando la categoría ya viene fija por la URL (ej. /categorias/cementos), se oculta el select de categoría. */
  lockCategory?: boolean;
  /** En /ofertas todos los resultados ya son promociones; el checkbox sería redundante y no funcional. */
  hidePromotionToggle?: boolean;
}

const SORT_OPTIONS: { value: NonNullable<ProductFilters['sort']>; label: string }[] = [
  { value: 'relevancia', label: 'Recomendados' },
  { value: 'precio_asc', label: 'Precio: menor a mayor' },
  { value: 'precio_desc', label: 'Precio: mayor a menor' },
  { value: 'nombre', label: 'Nombre A-Z' },
  { value: 'nuevos', label: 'Más nuevos' },
];

export function Filters({ actionPath, categories, brands, current, lockCategory, hidePromotionToggle }: FiltersProps) {
  return (
    <details className="rounded-lg border border-surface-border bg-white" open>
      <summary className="flex cursor-pointer list-none items-center gap-2 p-4 text-sm font-semibold text-ink lg:hidden [&::-webkit-details-marker]:hidden">
        <SlidersHorizontal className="h-4 w-4" /> Filtros y orden
      </summary>

      <form action={actionPath} method="GET" className="grid grid-cols-2 gap-3 p-4 pt-0 lg:grid-cols-6 lg:items-end lg:pt-4">
        {current.q && <input type="hidden" name="q" value={current.q} />}

        {!lockCategory && (
          <div className="col-span-2 lg:col-span-1">
            <label htmlFor="categorySlug" className="mb-1 block text-xs font-semibold text-ink-soft">
              Categoría
            </label>
            <select
              id="categorySlug"
              name="categorySlug"
              defaultValue={current.categorySlug ?? ''}
              className="w-full rounded border border-surface-border px-2 py-2 text-sm focus:border-brand focus:outline-none"
            >
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.parentId ? `— ${c.name}` : c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="brandSlug" className="mb-1 block text-xs font-semibold text-ink-soft">
            Marca
          </label>
          <select
            id="brandSlug"
            name="brandSlug"
            defaultValue={current.brandSlug ?? ''}
            className="w-full rounded border border-surface-border px-2 py-2 text-sm focus:border-brand focus:outline-none"
          >
            <option value="">Todas</option>
            {brands.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="minPrice" className="mb-1 block text-xs font-semibold text-ink-soft">
            Precio mín.
          </label>
          <input
            id="minPrice"
            type="number"
            name="minPrice"
            min={0}
            defaultValue={current.minPrice ?? ''}
            className="w-full rounded border border-surface-border px-2 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="maxPrice" className="mb-1 block text-xs font-semibold text-ink-soft">
            Precio máx.
          </label>
          <input
            id="maxPrice"
            type="number"
            name="maxPrice"
            min={0}
            defaultValue={current.maxPrice ?? ''}
            className="w-full rounded border border-surface-border px-2 py-2 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="sort" className="mb-1 block text-xs font-semibold text-ink-soft">
            Ordenar por
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={current.sort ?? 'relevancia'}
            className="w-full rounded border border-surface-border px-2 py-2 text-sm focus:border-brand focus:outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2 flex items-center justify-between gap-3 lg:col-span-1 lg:justify-start">
          {!hidePromotionToggle && (
            <label className="flex items-center gap-2 text-xs font-medium text-ink">
              <input type="checkbox" name="onPromotion" value="1" defaultChecked={current.onPromotion} className="h-4 w-4 rounded border-surface-border text-brand focus:ring-brand" />
              Solo ofertas
            </label>
          )}
        </div>

        <div className="col-span-2 lg:col-span-6">
          <button type="submit" className="btn-primary w-full lg:w-auto">
            Aplicar filtros
          </button>
        </div>
      </form>
    </details>
  );
}
