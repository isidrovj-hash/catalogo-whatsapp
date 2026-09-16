import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/format';

export default async function AdminQuoteDetailPage({ params }: { params: { id: string } }) {
  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      items: { include: { product: { select: { name: true, sku: true, slug: true } } } },
      lead: true,
    },
  });

  if (!quote) notFound();

  const dateFormatter = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeStyle: 'short' });

  return (
    <div className="max-w-3xl">
      <Link href="/admin/cotizaciones" className="mb-4 inline-block text-sm text-brand hover:underline">
        ← Volver a cotizaciones
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-mono text-2xl text-ink">{quote.folio}</h1>
        <span className="text-sm text-ink-soft">{dateFormatter.format(quote.createdAt)}</span>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-surface-border bg-white p-4">
          <h2 className="mb-2 text-xs font-semibold uppercase text-ink-soft">Cliente</h2>
          <Link href={`/admin/clientes/${quote.customerId}`} className="font-medium text-brand hover:underline">
            {quote.customer.name}
          </Link>
          <p className="text-sm text-ink-soft">{quote.customer.phone}</p>
          {quote.customer.email && <p className="text-sm text-ink-soft">{quote.customer.email}</p>}
          {quote.customer.company && <p className="text-sm text-ink-soft">{quote.customer.company}</p>}
          <p className="mt-1 text-xs text-ink-soft">
            {quote.customer.city}
            {quote.customer.neighborhood ? `, ${quote.customer.neighborhood}` : ''}
          </p>
          <span className="mt-2 inline-block rounded bg-surface-sunken px-2 py-0.5 text-xs text-ink-soft">{quote.customer.type}</span>
        </div>

        {quote.lead && (
          <div className="rounded-lg border border-surface-border bg-white p-4">
            <h2 className="mb-2 text-xs font-semibold uppercase text-ink-soft">Estado del prospecto</h2>
            <p className="font-medium text-ink">{quote.lead.status}</p>
            <p className="text-xs text-ink-soft">Origen: {quote.lead.origin}</p>
            <Link href="/admin/prospectos" className="mt-2 inline-block text-xs text-brand hover:underline">
              Gestionar en Prospectos →
            </Link>
          </div>
        )}
      </div>

      {quote.comments && (
        <div className="mb-6 rounded-lg border border-surface-border bg-white p-4">
          <h2 className="mb-1 text-xs font-semibold uppercase text-ink-soft">Comentarios del cliente</h2>
          <p className="text-sm text-ink">{quote.comments}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-surface-border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-surface-border bg-surface-sunken text-left text-xs font-semibold uppercase text-ink-soft">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Cantidad</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item) => (
              <tr key={item.id} className="border-b border-surface-border last:border-b-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{item.product.name}</p>
                  <p className="text-xs text-ink-soft">{item.product.sku}</p>
                </td>
                <td className="px-4 py-3 text-ink-soft">{item.quantity}</td>
                <td className="px-4 py-3 text-ink-soft">{formatCurrency(item.unitPrice)}</td>
                <td className="px-4 py-3 font-semibold text-ink">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="px-4 py-3 text-right font-semibold text-ink">
                Subtotal
              </td>
              <td className="px-4 py-3 font-bold text-ink">{formatCurrency(quote.subtotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
