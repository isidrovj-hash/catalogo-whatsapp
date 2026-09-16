import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CategoryForm } from '@/components/admin/CategoryForm';
import { updateCategory } from '@/actions/admin/categories';

export default async function EditCategoryPage({ params }: { params: { id: string } }) {
  const [category, parentOptions] = await Promise.all([
    prisma.category.findUnique({ where: { id: params.id } }),
    prisma.category.findMany({ where: { parentId: null, id: { not: params.id } }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  if (!category) notFound();

  const updateWithId = updateCategory.bind(null, category.id);

  return (
    <div>
      <h1 className="mb-6 text-2xl text-ink">Editar: {category.name}</h1>
      <CategoryForm
        parentOptions={parentOptions}
        action={updateWithId}
        submitLabel="Guardar cambios"
        defaults={{
          name: category.name,
          slug: category.slug,
          description: category.description ?? undefined,
          parentId: category.parentId ?? undefined,
          imageUrl: category.imageUrl,
          sortOrder: category.sortOrder,
          active: category.active,
        }}
      />
    </div>
  );
}
