import { prisma } from '@/lib/prisma';
import { CategoryForm } from '@/components/admin/CategoryForm';
import { createCategory } from '@/actions/admin/categories';

export default async function NewCategoryPage() {
  const parentOptions = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl text-ink">Nueva categoría</h1>
      <CategoryForm parentOptions={parentOptions} action={createCategory} submitLabel="Crear categoría" />
    </div>
  );
}
