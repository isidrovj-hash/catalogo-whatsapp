import type { AvailabilityStatus } from '@prisma/client';
import { toNumber } from '@/lib/format';

interface ProductForSchema {
  name: string;
  description: string | null;
  shortDescription: string | null;
  sku: string;
  price: number | string | { toNumber: () => number };
  promoPrice: number | string | { toNumber: () => number } | null;
  images: { url: string }[];
  mainImageUrl: string | null;
  brand: { name: string } | null;
  category: { name: string };
  inventory: { availability: AvailabilityStatus } | null;
}

function mapAvailability(status: AvailabilityStatus | undefined): string {
  switch (status) {
    case 'DISPONIBLE':
      return 'https://schema.org/InStock';
    case 'POCAS_PIEZAS':
      return 'https://schema.org/LimitedAvailability';
    case 'AGOTADO':
      return 'https://schema.org/OutOfStock';
    case 'SOBRE_PEDIDO':
      return 'https://schema.org/PreOrder';
    default:
      return 'https://schema.org/InStock';
  }
}

/**
 * Arma el JSON-LD de tipo Product (sección 26 y 27). Cada producto debe
 * poder posicionarse individualmente en Google, y este bloque es lo que le
 * permite a Google mostrar precio/disponibilidad directamente en resultados
 * de búsqueda (rich snippets).
 */
export function buildProductJsonLd(product: ProductForSchema, productUrl: string) {
  const price = toNumber(product.promoPrice) || toNumber(product.price);
  const image = product.images[0]?.url ?? product.mainImageUrl ?? undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription ?? product.description ?? undefined,
    sku: product.sku,
    image: image ? [image] : undefined,
    brand: product.brand ? { '@type': 'Brand', name: product.brand.name } : undefined,
    category: product.category.name,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'MXN',
      price: price.toFixed(2),
      availability: mapAvailability(product.inventory?.availability),
    },
  };
}

interface LocalBusinessData {
  businessName: string;
  logoUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  schedule: string | null;
}

/**
 * JSON-LD de tipo LocalBusiness (sección 26). Se coloca en la home y en
 * Contacto: le dice a Google que este es un negocio físico con dirección y
 * teléfono reales, lo que ayuda a aparecer en resultados de búsqueda local
 * y en Google Maps.
 */
export function buildLocalBusinessJsonLd(business: LocalBusinessData, siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.businessName,
    url: siteUrl,
    image: business.logoUrl ?? undefined,
    telephone: business.phone ?? undefined,
    address: business.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: business.address,
          addressLocality: business.city ?? undefined,
          addressRegion: business.state ?? undefined,
          addressCountry: 'MX',
        }
      : undefined,
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/** JSON-LD de tipo BreadcrumbList — usado en fichas de producto y páginas de categoría. */
export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
