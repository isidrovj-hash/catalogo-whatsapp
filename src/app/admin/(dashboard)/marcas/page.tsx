import Link from 'next/link';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { ActiveToggle } from '@/components/admin/ActiveToggle';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { toggleBrandActive, deleteBrand } from '@/actions/admin/brands';

export default async function AdminBrandsPage() {
  const brands = await prisma.brand.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl text-ink">Marcas</h1>
        <Link href="/admin/marcas/nueva" className="btn-primary">
          <Plus className="h-4 w-4" /> Nueva marca
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-surface-border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-surface-border bg-surface-sunken text-left text-xs font-semibold uppercase text-ink-soft">
            <tr>
              <th className="px-4 py-3">Marca</th>
              <th className="px-4 py-3">Productos</th>
              <th className="px-4 py-3">Activa</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {brands.map((brand) => (
              <tr key={brand.id} className="border-b border-surface-border last:border-b-0">
                <td className="px-4 py-3 font-medium text-ink">{brand.name}</td>
                <td className="px-4 py-3 text-ink-soft">{brand._count.products}</td>
                <td className="px-4 py-3">
                  <ActiveToggle id={brand.id} active={brand.active} action={toggleBrandActive} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/admin/marcas/${brand.id}/editar`} className="text-xs font-medium text-brand hover:underline">
                      Editar
                    </Link>
                    <DeleteButton id={brand.id} action={deleteBrand} confirmMessage={`¿Eliminar la marca "${brand.name}"?`} />
                  </div>
                </td>
              </tr>
            ))}
            {brands.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink-soft">
                  No hay marcas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
