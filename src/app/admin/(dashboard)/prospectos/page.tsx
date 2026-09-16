import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/format';
import { LeadStatusSelect } from '@/components/admin/LeadStatusSelect';

export default async function AdminLeadsPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: 'desc' },
    include: { customer: true, quote: { select: { folio: true } } },
    take: 200,
  });

  const dateFormatter = new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' });

  return (
    <div>
      <h1 className="mb-6 text-2xl text-ink">Prospectos</h1>

      <div className="overflow-x-auto rounded-lg border border-surface-border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-surface-border bg-surface-sunken text-left text-xs font-semibold uppercase text-ink-soft">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Folio</th>
              <th className="px-4 py-3">Total estimado</th>
              <th className="px-4 py-3">Origen</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-surface-border last:border-b-0">
                <td className="px-4 py-3">
                  <Link href={`/admin/clientes/${lead.customerId}`} className="font-medium text-brand hover:underline">
                    {lead.customer.name}
                  </Link>
                  <p className="text-xs text-ink-soft">{lead.customer.phone}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-ink-soft">{lead.quote?.folio ?? '—'}</td>
                <td className="px-4 py-3 text-ink-soft">{lead.estimatedTotal ? formatCurrency(lead.estimatedTotal) : '—'}</td>
                <td className="px-4 py-3 text-ink-soft">{lead.origin}</td>
                <td className="px-4 py-3 text-ink-soft">{dateFormatter.format(lead.createdAt)}</td>
                <td className="px-4 py-3">
                  <LeadStatusSelect leadId={lead.id} status={lead.status} />
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-soft">
                  Todavía no hay prospectos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
