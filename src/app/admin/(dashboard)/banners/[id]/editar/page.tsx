import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { BannerForm } from '@/components/admin/BannerForm';
import { updateBanner } from '@/actions/admin/banners';

export default async function EditBannerPage({ params }: { params: { id: string } }) {
  const banner = await prisma.banner.findUnique({ where: { id: params.id } });
  if (!banner) notFound();

  const updateWithId = updateBanner.bind(null, banner.id);

  return (
    <div>
      <h1 className="mb-6 text-2xl text-ink">Editar banner</h1>
      <BannerForm
        action={updateWithId}
        submitLabel="Guardar cambios"
        defaults={{
          title: banner.title,
          subtitle: banner.subtitle ?? undefined,
          imageUrl: banner.imageUrl,
          linkUrl: banner.linkUrl ?? undefined,
          sortOrder: banner.sortOrder,
          active: banner.active,
        }}
      />
    </div>
  );
}
