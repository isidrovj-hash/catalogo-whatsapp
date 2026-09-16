import Link from 'next/link';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { ActiveToggle } from '@/components/admin/ActiveToggle';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { toggleCategoryActive, deleteCategory } from '@/actions/admin/categories';

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
    include: { parent: { select: { name: true } }, _count: { select: { products: true } } },
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl text-ink">Categorías</h1>
        <Link href="/admin/categorias/nueva" className="btn-primary">
          <Plus className="h-4 w-4" /> Nueva categoría
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-surface-border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-surface-border bg-surface-sunken text-left text-xs font-semibold uppercase text-ink-soft">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Categoría padre</th>
              <th className="px-4 py-3">Productos</th>
              <th className="px-4 py-3">Activa</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-b border-surface-border last:border-b-0">
                <td className="px-4 py-3 font-medium text-ink">{category.name}</td>
                <td className="px-4 py-3 text-ink-soft">{category.parent?.name ?? '—'}</td>
                <td className="px-4 py-3 text-ink-soft">{category._count.products}</td>
                <td className="px-4 py-3">
                  <ActiveToggle id={category.id} active={category.active} action={toggleCategoryActive} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/admin/categorias/${category.id}/editar`} className="text-xs font-medium text-brand hover:underline">
                      Editar
                    </Link>
                    <DeleteButton id={category.id} action={deleteCategory} confirmMessage={`¿Eliminar "${category.name}"?`} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
