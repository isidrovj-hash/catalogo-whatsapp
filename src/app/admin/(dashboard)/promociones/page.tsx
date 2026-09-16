import Link from 'next/link';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { ActiveToggle } from '@/components/admin/ActiveToggle';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { toggleActivePromotion, deletePromotion } from '@/actions/admin/promotions';

export default async function AdminPromotionsPage() {
  const promotions = await prisma.promotion.findMany({
    orderBy: { startDate: 'desc' },
    include: { product: { select: { name: true } }, category: { select: { name: true } } },
  });

  const dateFormatter = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl text-ink">Promociones</h1>
        <Link href="/admin/promociones/nueva" className="btn-primary">
          <Plus className="h-4 w-4" /> Nueva promoción
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-surface-border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-surface-border bg-surface-sunken text-left text-xs font-semibold uppercase text-ink-soft">
            <tr>
              <th className="px-4 py-3">Promoción</th>
              <th className="px-4 py-3">Aplica a</th>
              <th className="px-4 py-3">Vigencia</th>
              <th className="px-4 py-3">Activa</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((promo) => (
              <tr key={promo.id} className="border-b border-surface-border last:border-b-0">
                <td className="px-4 py-3 font-medium text-ink">{promo.name}</td>
                <td className="px-4 py-3 text-ink-soft">{promo.product?.name ?? promo.category?.name ?? '—'}</td>
                <td className="px-4 py-3 text-ink-soft">
                  {dateFormatter.format(promo.startDate)} – {dateFormatter.format(promo.endDate)}
                </td>
                <td className="px-4 py-3">
                  <ActiveToggle id={promo.id} active={promo.active} action={toggleActivePromotion} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/admin/promociones/${promo.id}/editar`} className="text-xs font-medium text-brand hover:underline">
                      Editar
                    </Link>
                    <DeleteButton id={promo.id} action={deletePromotion} confirmMessage={`¿Eliminar "${promo.name}"?`} />
                  </div>
                </td>
              </tr>
            ))}
            {promotions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-soft">
                  No hay promociones registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
