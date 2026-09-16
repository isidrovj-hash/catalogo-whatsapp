import type { Metadata } from 'next';
import Link from 'next/link';
import { getCategoryTree } from '@/lib/data/categories';

export const metadata: Metadata = {
  title: 'Categorías',
  description: 'Explora nuestras categorías de productos.',
};

export const revalidate = 3600;

export default async function CategoriesPage() {
  const categories = await getCategoryTree();

  return (
    <div className="container-app py-8">
      <h1 className="mb-6 text-3xl text-ink">Categorías</h1>

      {categories.length === 0 ? (
        <p className="text-sm text-ink-soft">Todavía no hay categorías activas.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div key={category.id} className="rounded-lg border border-surface-border bg-white p-5">
              <Link href={`/categorias/${category.slug}`} className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-base font-bold text-brand">
                  {category.name.charAt(0)}
                </span>
                <h2 className="font-display text-lg text-ink hover:text-brand">{category.name}</h2>
              </Link>

              {category.children.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {category.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/categorias/${child.slug}`}
                        className="rounded-full border border-surface-border px-3 py-1 text-xs text-ink-soft hover:border-brand hover:text-brand"
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
