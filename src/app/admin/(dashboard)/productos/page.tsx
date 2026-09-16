import Link from 'next/link';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/format';
import { ActiveToggle } from '@/components/admin/ActiveToggle';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { toggleProductActive, deleteProduct } from '@/actions/admin/products';

export default async function AdminProductsPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim();

  const products = await prisma.product.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { sku: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined,
    include: { category: { select: { name: true } }, inventory: { select: { stock: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl text-ink">Productos</h1>
        <Link href="/admin/productos/nuevo" className="btn-primary">
          <Plus className="h-4 w-4" /> Nuevo producto
        </Link>
      </div>

      <form method="GET" className="mb-4">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre o SKU..."
          className="w-full max-w-sm rounded border border-surface-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
      </form>

      <div className="overflow-x-auto rounded-lg border border-surface-border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-surface-border bg-surface-sunken text-left text-xs font-semibold uppercase text-ink-soft">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Activo</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-surface-border last:border-b-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{product.name}</p>
                  <p className="text-xs text-ink-soft">{product.sku}</p>
                </td>
                <td className="px-4 py-3 text-ink-soft">{product.category.name}</td>
                <td className="px-4 py-3 text-ink-soft">{formatCurrency(product.price)}</td>
                <td className="px-4 py-3 text-ink-soft">{product.inventory?.stock ?? '—'}</td>
                <td className="px-4 py-3">
                  <ActiveToggle id={product.id} active={product.active} action={toggleProductActive} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/admin/productos/${product.id}/editar`} className="text-xs font-medium text-brand hover:underline">
                      Editar
                    </Link>
                    <DeleteButton id={product.id} action={deleteProduct} confirmMessage={`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`} />
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-soft">
                  No se encontraron productos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
