import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export type SortOption = 'relevancia' | 'precio_asc' | 'precio_desc' | 'nombre' | 'nuevos';

export interface ProductFilters {
  q?: string;
  categorySlug?: string;
  brandSlug?: string;
  onPromotion?: boolean;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}

// Include reutilizado por todas las consultas de listado, para que la tarjeta
// de producto (sección 6) siempre tenga foto, precio, promoción, marca,
// categoría y disponibilidad sin necesidad de una consulta extra por producto.
const productCardInclude = {
  category: { select: { name: true, slug: true } },
  brand: { select: { name: true, slug: true } },
  inventory: { select: { stock: true, availability: true, showExactStock: true } },
  images: { orderBy: { sortOrder: 'asc' as const }, take: 1 },
} satisfies Prisma.ProductInclude;

export type ProductCardData = Prisma.ProductGetPayload<{ include: typeof productCardInclude }>;

export interface ProductListResult {
  products: ProductCardData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const DEFAULT_PAGE_SIZE = 12;

/**
 * Listado de productos combinando búsqueda de texto completo (usando el
 * `search_vector` generado por trigger en Postgres, ver FASE 2), filtros
 * relacionales y orden — todo en una sola consulta SQL para no traer miles
 * de filas a memoria y filtrar en JavaScript.
 */
export async function getProducts(filters: ProductFilters): Promise<ProductListResult> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * pageSize;

  const conditions: Prisma.Sql[] = [Prisma.sql`p.active = true`];

  if (filters.q && filters.q.trim().length > 0) {
    conditions.push(
      Prisma.sql`p.search_vector @@ plainto_tsquery('spanish', unaccent(${filters.q.trim()}))`
    );
  }

  if (filters.categorySlug) {
    const category = await prisma.category.findFirst({
      where: { slug: filters.categorySlug, active: true },
      select: { id: true },
    });
    if (!category) {
      return { products: [], total: 0, page, pageSize, totalPages: 0 };
    }
    // Incluye productos de la categoría Y de sus subcategorías directas,
    // para que "Materiales para construcción" muestre también lo de "Cementos".
    conditions.push(
      Prisma.sql`p.category_id IN (SELECT id FROM categories WHERE id = ${category.id} OR parent_id = ${category.id})`
    );
  }

  if (filters.brandSlug) {
    const brand = await prisma.brand.findFirst({ where: { slug: filters.brandSlug }, select: { id: true } });
    if (!brand) {
      return { products: [], total: 0, page, pageSize, totalPages: 0 };
    }
    conditions.push(Prisma.sql`p.brand_id = ${brand.id}`);
  }

  if (filters.onPromotion) conditions.push(Prisma.sql`p.on_promotion = true`);
  if (filters.featured) conditions.push(Prisma.sql`p.featured = true`);
  if (typeof filters.minPrice === 'number') conditions.push(Prisma.sql`p.price >= ${filters.minPrice}`);
  if (typeof filters.maxPrice === 'number') conditions.push(Prisma.sql`p.price <= ${filters.maxPrice}`);

  const whereSql = Prisma.join(conditions, ' AND ');

  const orderSql = getOrderSql(filters.sort, filters.q);

  const [rows, countRows] = await Promise.all([
    prisma.$queryRaw<{ id: string }[]>(
      Prisma.sql`SELECT p.id FROM products p WHERE ${whereSql} ORDER BY ${orderSql} LIMIT ${pageSize} OFFSET ${skip}`
    ),
    prisma.$queryRaw<{ count: bigint }[]>(
      Prisma.sql`SELECT COUNT(*)::bigint AS count FROM products p WHERE ${whereSql}`
    ),
  ]);

  const total = Number(countRows[0]?.count ?? 0);
  const ids = rows.map((r) => r.id);

  if (ids.length === 0) {
    return { products: [], total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    include: productCardInclude,
  });

  // `findMany` con `id IN (...)` no garantiza el orden de los ids: se
  // reordena en memoria para respetar el ranking de búsqueda / orden pedido.
  const byId = new Map(products.map((p) => [p.id, p]));
  const ordered = ids.map((id) => byId.get(id)).filter((p): p is ProductCardData => Boolean(p));

  return { products: ordered, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

function getOrderSql(sort: SortOption | undefined, q: string | undefined): Prisma.Sql {
  if (q && q.trim().length > 0 && (!sort || sort === 'relevancia')) {
    return Prisma.sql`ts_rank(p.search_vector, plainto_tsquery('spanish', unaccent(${q.trim()}))) DESC`;
  }
  switch (sort) {
    case 'precio_asc':
      return Prisma.sql`COALESCE(p.promo_price, p.price) ASC`;
    case 'precio_desc':
      return Prisma.sql`COALESCE(p.promo_price, p.price) DESC`;
    case 'nombre':
      return Prisma.sql`p.name ASC`;
    case 'nuevos':
      return Prisma.sql`p.created_at DESC`;
    default:
      return Prisma.sql`p.featured DESC, p.created_at DESC`;
  }
}

export async function getFeaturedProducts(limit = 8) {
  return prisma.product.findMany({
    where: { active: true, featured: true },
    include: productCardInclude,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, active: true },
    include: {
      category: true,
      brand: true,
      inventory: true,
      images: { orderBy: { sortOrder: 'asc' } },
      relatedFrom: {
        include: {
          relatedProduct: { include: productCardInclude },
        },
      },
    },
  });
}