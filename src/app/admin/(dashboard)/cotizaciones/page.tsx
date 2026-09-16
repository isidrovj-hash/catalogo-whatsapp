import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/format';

export default async function AdminQuotesPage() {
  const quotes = await prisma.quote.findMany({
    orderBy: { createdAt: 'desc' },
    include: { customer: true, items: { select: { id: true } } },
    take: 200,
  });

  const dateFormatter = new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <div>
      <h1 className="mb-6 text-2xl text-ink">Cotizaciones</h1>

      <div className="overflow-x-auto rounded-lg border border-surface-border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-surface-border bg-surface-sunken text-left text-xs font-semibold uppercase text-ink-soft">
            <tr>
              <th className="px-4 py-3">Folio</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Productos</th>
              <th className="px-4 py-3">Subtotal</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote) => (
              <tr key={quote.id} className="border-b border-surface-border last:border-b-0">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-ink">{quote.folio}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/clientes/${quote.customerId}`} className="font-medium text-brand hover:underline">
                    {quote.customer.name}
                  </Link>
                  <p className="text-xs text-ink-soft">{quote.customer.phone}</p>
                </td>
                <td className="px-4 py-3 text-ink-soft">{quote.items.length}</td>
                <td className="px-4 py-3 font-semibold text-ink">{formatCurrency(quote.subtotal)}</td>
                <td className="px-4 py-3 text-ink-soft">{dateFormatter.format(quote.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/cotizaciones/${quote.id}`} className="text-xs font-medium text-brand hover:underline">
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
            {quotes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-soft">
                  Todavía no hay cotizaciones registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
