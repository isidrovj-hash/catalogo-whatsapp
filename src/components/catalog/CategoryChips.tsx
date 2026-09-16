import Link from 'next/link';
import type { CategoryTree } from '@/lib/data/categories';

export function CategoryChips({ categories }: { categories: CategoryTree }) {
  if (categories.length === 0) return null;

  return (
    <section className="container-app py-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl text-ink">Categorías</h2>
        <Link href="/categorias" className="text-sm font-semibold text-brand hover:underline">
          Ver todas
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categorias/${category.slug}`}
            className="flex shrink-0 flex-col items-center gap-2 rounded-lg border border-surface-border bg-white px-5 py-4 text-center transition-colors hover:border-brand"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
              {category.name.charAt(0)}
            </span>
            <span className="text-xs font-medium text-ink">{category.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
