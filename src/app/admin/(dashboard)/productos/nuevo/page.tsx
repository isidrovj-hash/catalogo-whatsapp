import { prisma } from '@/lib/prisma';
import { ProductForm } from '@/components/admin/ProductForm';
import { createProduct } from '@/actions/admin/products';

export default async function NewProductPage() {
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, parentId: true } }),
    prisma.brand.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl text-ink">Nuevo producto</h1>
      <ProductForm categories={categories} brands={brands} action={createProduct} submitLabel="Crear producto" />
    </div>
  );
}
