import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function AdminCustomersPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim();

  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined,
    include: { _count: { select: { quotes: true, leads: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl text-ink">Clientes</h1>

      <form method="GET" className="mb-4">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre, teléfono o correo..."
          className="w-full max-w-sm rounded border border-surface-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
      </form>

      <div className="overflow-x-auto rounded-lg border border-surface-border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-surface-border bg-surface-sunken text-left text-xs font-semibold uppercase text-ink-soft">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Ciudad</th>
              <th className="px-4 py-3">Cotizaciones</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-surface-border last:border-b-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{customer.name}</p>
                  <p className="text-xs text-ink-soft">{customer.phone}</p>
                </td>
                <td className="px-4 py-3 text-ink-soft">{customer.type}</td>
                <td className="px-4 py-3 text-ink-soft">{customer.city ?? '—'}</td>
                <td className="px-4 py-3 text-ink-soft">{customer._count.quotes}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/clientes/${customer.id}`} className="text-xs font-medium text-brand hover:underline">
                    Ver perfil
                  </Link>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-soft">
                  No se encontraron clientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
