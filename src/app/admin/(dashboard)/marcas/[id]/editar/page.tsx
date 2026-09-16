import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { BrandForm } from '@/components/admin/BrandForm';
import { updateBrand } from '@/actions/admin/brands';

export default async function EditBrandPage({ params }: { params: { id: string } }) {
  const brand = await prisma.brand.findUnique({ where: { id: params.id } });
  if (!brand) notFound();

  const updateWithId = updateBrand.bind(null, brand.id);

  return (
    <div>
      <h1 className="mb-6 text-2xl text-ink">Editar: {brand.name}</h1>
      <BrandForm
        action={updateWithId}
        submitLabel="Guardar cambios"
        defaults={{
          name: brand.name,
          slug: brand.slug,
          logoUrl: brand.logoUrl,
          active: brand.active,
        }}
      />
    </div>
  );
}
