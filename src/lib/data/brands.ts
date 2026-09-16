import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

export const getActiveBrands = unstable_cache(
  async () => {
    return prisma.brand.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    });
  },
  ['brands-active'],
  { tags: ['brands'], revalidate: 3600 }
);
