import { Package, FolderTree, FileText, Users, Eye, ShoppingCart, TrendingUp } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { StatCard } from '@/components/admin/StatCard';

export default async function AdminDashboardPage() {
  const [
    activeProducts,
    categoriesCount,
    quotesCount,
    leadsCount,
    wonLeadsCount,
    mostViewed,
    mostAdded,
  ] = await Promise.all([
    prisma.product.count({ where: { active: true } }),
    prisma.category.count({ where: { active: true } }),
    prisma.quote.count(),
    prisma.lead.count(),
    prisma.lead.count({ where: { status: 'GANADO' } }),
    prisma.analyticsEvent.groupBy({
      by: ['productId'],
      where: { type: 'PRODUCT_VIEW', productId: { not: null } },
      _count: { productId: true },
      orderBy: { _count: { productId: 'desc' } },
      take: 5,
    }),
    prisma.analyticsEvent.groupBy({
      by: ['productId'],
      where: { type: 'ADD_TO_CART', productId: { not: null } },
      _count: { productId: true },
      orderBy: { _count: { productId: 'desc' } },
      take: 5,
    }),
  ]);

  const viewedIds = mostViewed.map((row) => row.productId).filter((id): id is string => Boolean(id));
  const addedIds = mostAdded.map((row) => row.productId).filter((id): id is string => Boolean(id));
  const allIds = Array.from(new Set([...viewedIds, ...addedIds]));

  const products = allIds.length > 0
    ? await prisma.product.findMany({ where: { id: { in: allIds } }, select: { id: true, name: true, sku: true } })
    : [];
  const productById = new Map(products.map((p) => [p.id, p]));

  return (
    <div>
      <h1 className="mb-6 text-2xl text-ink">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Productos activos" value={activeProducts} icon={Package} />
        <StatCard label="Categorías" value={categoriesCount} icon={FolderTree} />
        <StatCard label="Cotizaciones" value={quotesCount} icon={FileText} />
        <StatCard label="Prospectos" value={leadsCount} icon={Users} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <StatCard label="Pedidos ganados" value={wonLeadsCount} icon={ShoppingCart} />
        <StatCard
          label="Tasa de conversión de prospectos"
          value={leadsCount > 0 ? `${Math.round((wonLeadsCount / leadsCount) * 100)}%` : '—'}
          icon={TrendingUp}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-surface-border bg-white p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg text-ink">
            <Eye className="h-4 w-4" /> Productos más consultados
          </h2>
          {mostViewed.length === 0 ? (
            <p className="text-sm text-ink-soft">Todavía no hay suficientes datos.</p>
          ) : (
            <ul className="space-y-2">
              {mostViewed.map((row) => {
                const product = row.productId ? productById.get(row.productId) : undefined;
                return (
                  <li key={row.productId} className="flex justify-between text-sm">
                    <span className="text-ink">{product?.name ?? 'Producto eliminado'}</span>
                    <span className="font-semibold text-ink-soft">{row._count.productId} vistas</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-surface-border bg-white p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg text-ink">
            <ShoppingCart className="h-4 w-4" /> Productos más agregados al carrito
          </h2>
          {mostAdded.length === 0 ? (
            <p className="text-sm text-ink-soft">Todavía no hay suficientes datos.</p>
          ) : (
            <ul className="space-y-2">
              {mostAdded.map((row) => {
                const product = row.productId ? productById.get(row.productId) : undefined;
                return (
                  <li key={row.productId} className="flex justify-between text-sm">
                    <span className="text-ink">{product?.name ?? 'Producto eliminado'}</span>
                    <span className="font-semibold text-ink-soft">{row._count.productId} veces</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
