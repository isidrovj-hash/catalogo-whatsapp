import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

/**
 * Devuelve las categorías de nivel superior activas, cada una con sus
 * subcategorías activas anidadas. El admin puede crear categorías
 * ilimitadas desde la base de datos (sección 7 del brief); nada de esto
 * está hardcodeado en el frontend.
 */
export const getCategoryTree = unstable_cache(
  async () => {
    const categories = await prisma.category.findMany({
      where: { active: true, parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: { active: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    return categories;
  },
  ['category-tree'],
  { tags: ['categories'], revalidate: 3600 }
);

export type CategoryTree = Awaited<ReturnType<typeof getCategoryTree>>;
export type CategoryTreeItem = CategoryTree[number];

/**
 * Lista plana de categorías activas (para selects de filtro, donde no
 * importa la jerarquía padre/hijo, solo el nombre y el slug).
 */
export const getCategoriesFlat = unstable_cache(
  async () => {
    return prisma.category.findMany({
      where: { active: true },
      orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
      select: { id: true, name: true, slug: true, parentId: true },
    });
  },
  ['categories-flat'],
  { tags: ['categories'], revalidate: 3600 }
);

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findFirst({
    where: { slug, active: true },
    include: {
      children: { where: { active: true }, orderBy: { sortOrder: 'asc' } },
      parent: true,
    },
  });
}
