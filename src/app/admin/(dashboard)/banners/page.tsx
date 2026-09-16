import Link from 'next/link';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { ActiveToggle } from '@/components/admin/ActiveToggle';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { toggleActiveBanner, deleteBanner } from '@/actions/admin/banners';

export default async function AdminBannersPage() {
  const banners = await prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl text-ink">Banners</h1>
        <Link href="/admin/banners/nuevo" className="btn-primary">
          <Plus className="h-4 w-4" /> Nuevo banner
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {banners.map((banner) => (
          <div key={banner.id} className="overflow-hidden rounded-lg border border-surface-border bg-white">
            <div className="aspect-[2/1] bg-surface-sunken">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-cover" />
            </div>
            <div className="p-4">
              <p className="font-semibold text-ink">{banner.title}</p>
              {banner.subtitle && <p className="text-xs text-ink-soft">{banner.subtitle}</p>}
              <div className="mt-3 flex items-center justify-between">
                <ActiveToggle id={banner.id} active={banner.active} action={toggleActiveBanner} />
                <div className="flex items-center gap-3">
                  <Link href={`/admin/banners/${banner.id}/editar`} className="text-xs font-medium text-brand hover:underline">
                    Editar
                  </Link>
                  <DeleteButton id={banner.id} action={deleteBanner} confirmMessage={`¿Eliminar el banner "${banner.title}"?`} />
                </div>
              </div>
            </div>
          </div>
        ))}
        {banners.length === 0 && <p className="text-sm text-ink-soft">No hay banners registrados.</p>}
      </div>
    </div>
  );
}
