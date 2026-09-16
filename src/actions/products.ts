'use server';

import { prisma } from '@/lib/prisma';
import { toNumber } from '@/lib/format';
import type { AvailabilityStatus } from '@prisma/client';

export interface MiniProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  promoPrice: number | null;
  unit: string;
  presentation: string;
  imageUrl: string | null;
  availability: AvailabilityStatus | null;
}

// Forma mínima que necesitamos de un producto de Prisma para convertirlo a
// MiniProduct — evita depender de un tipo completo de Prisma en la firma,
// así cualquier `include` que ya traiga estos campos sirve.
interface ProductLike {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number | string | { toNumber: () => number };
  promoPrice: number | string | { toNumber: () => number } | null;
  unit: string;
  presentation: string;
  mainImageUrl: string | null;
  images: { url: string }[];
  inventory: { availability: AvailabilityStatus } | null;
}

function toMiniProduct(p: ProductLike): MiniProduct {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    price: toNumber(p.price),
    promoPrice: p.promoPrice ? toNumber(p.promoPrice) : null,
    unit: p.unit,
    presentation: p.presentation,
    imageUrl: p.images[0]?.url ?? p.mainImageUrl,
    availability: p.inventory?.availability ?? null,
  };
}

const miniInclude = {
  images: { orderBy: { sortOrder: 'asc' as const }, take: 1 },
  inventory: { select: { availability: true } },
};

/** Usado por la página de Favoritos: convierte ids guardados en localStorage a datos reales. */
export async function getProductsByIds(ids: string[]): Promise<MiniProduct[]> {
  if (ids.length === 0) return [];
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, active: true },
    include: miniInclude,
  });
  // Preserva el orden en que se guardaron los favoritos.
  const byId = new Map(products.map((p) => [p.id, p]));
  return ids.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => Boolean(p)).map(toMiniProduct);
}

/**
 * Venta cruzada discreta (sección 48): a partir de los productos que ya
 * están en el carrito, sugiere primero relaciones definidas manualmente por
 * el admin (`product_relations`) y, si no alcanzan 4 sugerencias, completa
 * con productos de la misma categoría del primer artículo del carrito.
 */
export async function getCrossSellSuggestions(cartProductIds: string[]): Promise<MiniProduct[]> {
  if (cartProductIds.length === 0) return [];

  const relations = await prisma.productRelation.findMany({
    where: { productId: { in: cartProductIds } },
    include: { relatedProduct: { include: miniInclude } },
  });

  const excluded = new Set(cartProductIds);
  const suggestions: MiniProduct[] = [];

  for (const relation of relations) {
    if (suggestions.length >= 4) break;
    if (excluded.has(relation.relatedProduct.id) || !relation.relatedProduct.active) continue;
    excluded.add(relation.relatedProduct.id);
    suggestions.push(toMiniProduct(relation.relatedProduct));
  }

  if (suggestions.length < 4) {
    const firstProduct = await prisma.product.findUnique({
      where: { id: cartProductIds[0] },
      select: { categoryId: true },
    });

    if (firstProduct) {
      const more = await prisma.product.findMany({
        where: {
          categoryId: firstProduct.categoryId,
          active: true,
          id: { notIn: Array.from(excluded) },
        },
        include: miniInclude,
        take: 4 - suggestions.length,
      });
      more.forEach((p) => suggestions.push(toMiniProduct(p)));
    }
  }

  return suggestions.slice(0, 4);
}
