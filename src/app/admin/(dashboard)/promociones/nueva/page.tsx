import { prisma } from '@/lib/prisma';
import { PromotionForm } from '@/components/admin/PromotionForm';
import { createPromotion } from '@/actions/admin/promotions';

export default async function NewPromotionPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.category.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl text-ink">Nueva promoción</h1>
      <PromotionForm products={products} categories={categories} action={createPromotion} submitLabel="Crear promoción" />
    </div>
  );
}
