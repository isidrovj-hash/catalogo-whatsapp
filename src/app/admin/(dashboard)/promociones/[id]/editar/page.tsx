import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PromotionForm } from '@/components/admin/PromotionForm';
import { updatePromotion } from '@/actions/admin/promotions';

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function EditPromotionPage({ params }: { params: { id: string } }) {
  const [promotion, products, categories] = await Promise.all([
    prisma.promotion.findUnique({ where: { id: params.id } }),
    prisma.product.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.category.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  if (!promotion) notFound();

  const updateWithId = updatePromotion.bind(null, promotion.id);

  return (
    <div>
      <h1 className="mb-6 text-2xl text-ink">Editar: {promotion.name}</h1>
      <PromotionForm
        products={products}
        categories={categories}
        action={updateWithId}
        submitLabel="Guardar cambios"
        defaults={{
          name: promotion.name,
          description: promotion.description ?? undefined,
          startDate: toDateInputValue(promotion.startDate),
          endDate: toDateInputValue(promotion.endDate),
          productId: promotion.productId ?? undefined,
          categoryId: promotion.categoryId ?? undefined,
          promoPrice: promotion.promoPrice ? Number(promotion.promoPrice) : null,
          imageUrl: promotion.imageUrl,
          active: promotion.active,
        }}
      />
    </div>
  );
}
