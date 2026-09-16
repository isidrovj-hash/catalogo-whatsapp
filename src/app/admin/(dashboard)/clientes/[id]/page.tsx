import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/format';
import { CustomerEditForm } from '@/components/admin/CustomerEditForm';
import { CustomerNotes } from '@/components/admin/CustomerNotes';

export default async function CustomerProfilePage({ params }: { params: { id: string } }) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      quotes: { orderBy: { createdAt: 'desc' }, include: { items: { select: { id: true } } } },
      leads: { orderBy: { createdAt: 'desc' } },
      notes: { orderBy: { createdAt: 'desc' }, include: { author: { select: { name: true } } } },
    },
  });

  if (!customer) notFound();

  const dateFormatter = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' });

  return (
    <div>
      <Link href="/admin/clientes" className="mb-4 inline-block text-sm text-brand hover:underline">
        ← Volver a clientes
      </Link>

      <h1 className="mb-6 text-2xl text-ink">{customer.name}</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-surface-border bg-white p-5">
            <h2 className="mb-3 font-display text-lg text-ink">Historial de cotizaciones</h2>
            {customer.quotes.length === 0 ? (
              <p className="text-sm text-ink-soft">Este cliente todavía no tiene cotizaciones.</p>
            ) : (
              <ul className="divide-y divide-surface-border">
                {customer.quotes.map((quote) => (
                  <li key={quote.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <Link href={`/admin/cotizaciones/${quote.id}`} className="font-mono font-semibold text-brand hover:underline">
                        {quote.folio}
                      </Link>
                      <p className="text-xs text-ink-soft">
                        {dateFormatter.format(quote.createdAt)} · {quote.items.length} producto(s)
                      </p>
                    </div>
                    <span className="font-semibold text-ink">{formatCurrency(quote.subtotal)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-surface-border bg-white p-5">
            <h2 className="mb-3 font-display text-lg text-ink">Prospectos asociados</h2>
            {customer.leads.length === 0 ? (
              <p className="text-sm text-ink-soft">Sin prospectos registrados.</p>
            ) : (
              <ul className="divide-y divide-surface-border">
                {customer.leads.map((lead) => (
                  <li key={lead.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="text-ink">{dateFormatter.format(lead.createdAt)}</p>
                      <p className="text-xs text-ink-soft">Origen: {lead.origin}</p>
                    </div>
                    <span className="rounded bg-surface-sunken px-2 py-1 text-xs font-semibold text-ink">{lead.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* "Productos consultados" (sección 41) no se muestra aquí: los eventos de
              analítica (FASE 4/5) se registran por sesión anónima, no por cliente
              identificado, ya que el visitante navega el catálogo antes de dejar sus
              datos. Vincular sesión → cliente requeriría cuentas de cliente con login,
              fuera del alcance de este catálogo sin autenticación de clientes. */}

          <CustomerNotes
            customerId={customer.id}
            notes={customer.notes.map((note) => ({
              id: note.id,
              content: note.content,
              createdAt: note.createdAt.toISOString(),
              authorName: note.author?.name ?? null,
            }))}
          />
        </div>

        <div>
          <CustomerEditForm
            customerId={customer.id}
            defaults={{
              name: customer.name,
              company: customer.company,
              phone: customer.phone,
              email: customer.email,
              city: customer.city,
              neighborhood: customer.neighborhood,
              type: customer.type,
            }}
          />
        </div>
      </div>
    </div>
  );
}
