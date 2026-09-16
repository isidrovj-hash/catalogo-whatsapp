import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { toNumber } from '@/lib/format';
import { ProductForm } from '@/components/admin/ProductForm';
import { updateProduct } from '@/actions/admin/products';

interface EditProductPageProps {
  params: { id: string };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const [product, categories, brands] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      include: { images: { orderBy: { sortOrder: 'asc' } }, inventory: true },
    }),
    prisma.category.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, parentId: true } }),
    prisma.brand.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  if (!product) notFound();

  const updateWithId = updateProduct.bind(null, product.id);

  return (
    <div>
      <h1 className="mb-6 text-2xl text-ink">Editar: {product.name}</h1>
      <ProductForm
        categories={categories}
        brands={brands}
        action={updateWithId}
        submitLabel="Guardar cambios"
        defaults={{
          sku: product.sku,
          name: product.name,
          slug: product.slug,
          shortDescription: product.shortDescription ?? undefined,
          description: product.description ?? undefined,
          categoryId: product.categoryId,
          brandId: product.brandId ?? undefined,
          price: toNumber(product.price),
          promoPrice: product.promoPrice ? toNumber(product.promoPrice) : null,
          cost: product.cost ? toNumber(product.cost) : null,
          priceMode: product.priceMode,
          unit: product.unit,
          presentation: product.presentation,
          mainImageUrl: product.mainImageUrl,
          galleryUrls: product.images.map((img) => img.url).join('\n'),
          tags: product.tags.join(', '),
          featured: product.featured,
          onPromotion: product.onPromotion,
          active: product.active,
          stock: product.inventory?.stock ?? 0,
          lowStockThreshold: product.inventory?.lowStockThreshold ?? 5,
          availability: product.inventory?.availability ?? 'DISPONIBLE',
          showExactStock: product.inventory?.showExactStock ?? false,
        }}
      />
    </div>
  );
}
