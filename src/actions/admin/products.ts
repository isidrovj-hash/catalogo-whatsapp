'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdminUser } from '@/lib/auth';
import { productFormSchema } from '@/lib/validations/product';

function parseNumberOrUndefined(value: FormDataEntryValue | null): number | undefined {
  if (value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

function extractProductFields(formData: FormData) {
  return {
    sku: formData.get('sku'),
    name: formData.get('name'),
    slug: formData.get('slug'),
    shortDescription: formData.get('shortDescription') || undefined,
    description: formData.get('description') || undefined,
    categoryId: formData.get('categoryId'),
    brandId: formData.get('brandId') || undefined,
    price: formData.get('price'),
    promoPrice: formData.get('promoPrice') || '',
    cost: formData.get('cost') || '',
    priceMode: formData.get('priceMode'),
    unit: formData.get('unit'),
    presentation: formData.get('presentation'),
    mainImageUrl: formData.get('mainImageUrl') || undefined,
    galleryUrls: formData.get('galleryUrls') || undefined,
    tags: formData.get('tags') || undefined,
    featured: formData.get('featured'),
    onPromotion: formData.get('onPromotion'),
    active: formData.get('active'),
    stock: formData.get('stock'),
    lowStockThreshold: formData.get('lowStockThreshold') || undefined,
    availability: formData.get('availability'),
    showExactStock: formData.get('showExactStock'),
  };
}

function revalidatePublicCatalog() {
  // El catálogo público cachea listados con `unstable_cache` (FASE 4) y
  // páginas con ISR (`revalidate`); tocar cualquier producto debe reflejarse
  // ahí sin esperar a que expire el tiempo de caché por sí solo.
  revalidateTag('categories');
  revalidatePath('/productos');
  revalidatePath('/');
}

export async function createProduct(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireAdminUser();

  const parsed = productFormSchema.safeParse(extractProductFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
  }
  const data = parsed.data;

  const galleryUrls = (data.galleryUrls ?? '')
    .split('\n')
    .map((url) => url.trim())
    .filter(Boolean);
  const tags = (data.tags ?? '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  let productId: string;
  try {
    const product = await prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        slug: data.slug,
        shortDescription: data.shortDescription || null,
        description: data.description || null,
        categoryId: data.categoryId,
        brandId: data.brandId || null,
        price: data.price,
        promoPrice: parseNumberOrUndefined(data.promoPrice as unknown as string) ?? null,
        cost: parseNumberOrUndefined(data.cost as unknown as string) ?? null,
        priceMode: data.priceMode,
        unit: data.unit,
        presentation: data.presentation,
        mainImageUrl: data.mainImageUrl || null,
        tags,
        featured: Boolean(data.featured),
        onPromotion: Boolean(data.onPromotion),
        active: data.active === undefined ? true : Boolean(data.active),
        images: { create: galleryUrls.map((url, index) => ({ url, sortOrder: index })) },
        inventory: {
          create: {
            stock: data.stock,
            lowStockThreshold: data.lowStockThreshold ?? 5,
            availability: data.availability,
            showExactStock: Boolean(data.showExactStock),
          },
        },
      },
    });

    revalidatePublicCatalog();
    productId = product.id;
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return { ok: false, error: 'Ya existe un producto con ese SKU o slug.' };
    }
    console.error('[admin] Error al crear producto:', error);
    return { ok: false, error: 'Ocurrió un error al crear el producto.' };
  }

  redirect(`/admin/productos/${productId}/editar?created=1`);
}

export async function updateProduct(id: string, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireAdminUser();

  const parsed = productFormSchema.safeParse(extractProductFields(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
  }
  const data = parsed.data;

  const galleryUrls = (data.galleryUrls ?? '')
    .split('\n')
    .map((url) => url.trim())
    .filter(Boolean);
  const tags = (data.tags ?? '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          sku: data.sku,
          name: data.name,
          slug: data.slug,
          shortDescription: data.shortDescription || null,
          description: data.description || null,
          categoryId: data.categoryId,
          brandId: data.brandId || null,
          price: data.price,
          promoPrice: parseNumberOrUndefined(data.promoPrice as unknown as string) ?? null,
          cost: parseNumberOrUndefined(data.cost as unknown as string) ?? null,
          priceMode: data.priceMode,
          unit: data.unit,
          presentation: data.presentation,
          mainImageUrl: data.mainImageUrl || null,
          tags,
          featured: Boolean(data.featured),
          onPromotion: Boolean(data.onPromotion),
          active: Boolean(data.active),
        },
      });

      await tx.productImage.deleteMany({ where: { productId: id } });
      if (galleryUrls.length > 0) {
        await tx.productImage.createMany({
          data: galleryUrls.map((url, index) => ({ productId: id, url, sortOrder: index })),
        });
      }

      await tx.inventory.upsert({
        where: { productId: id },
        create: {
          productId: id,
          stock: data.stock,
          lowStockThreshold: data.lowStockThreshold ?? 5,
          availability: data.availability,
          showExactStock: Boolean(data.showExactStock),
        },
        update: {
          stock: data.stock,
          lowStockThreshold: data.lowStockThreshold ?? 5,
          availability: data.availability,
          showExactStock: Boolean(data.showExactStock),
        },
      });
    });

    revalidatePublicCatalog();
    revalidatePath(`/productos/${data.slug}`);
    return { ok: true };
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return { ok: false, error: 'Ya existe otro producto con ese SKU o slug.' };
    }
    console.error('[admin] Error al actualizar producto:', error);
    return { ok: false, error: 'Ocurrió un error al actualizar el producto.' };
  }
}

export async function toggleProductActive(id: string, nextActive: boolean): Promise<void> {
  await requireAdminUser();
  await prisma.product.update({ where: { id }, data: { active: nextActive } });
  revalidatePublicCatalog();
}

export async function deleteProduct(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdminUser();

  try {
    await prisma.product.delete({ where: { id } });
    revalidatePublicCatalog();
    return { ok: true };
  } catch (error: any) {
    // P2003: violación de llave foránea — el producto ya tiene cotizaciones
    // asociadas (`quote_items.product_id` usa RESTRICT a propósito, ver
    // FASE 2). En ese caso se le sugiere desactivar en vez de eliminar, para
    // no perder el historial de ventas.
    if (error?.code === 'P2003' || error?.code === 'P2014') {
      return {
        ok: false,
        error: 'No se puede eliminar: este producto ya tiene cotizaciones asociadas. Desactívalo en su lugar.',
      };
    }
    console.error('[admin] Error al eliminar producto:', error);
    return { ok: false, error: 'Ocurrió un error al eliminar el producto.' };
  }
}
