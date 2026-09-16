import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug, getProducts, type ProductCardData } from '@/lib/data/products';
import { getWhatsAppService } from '@/lib/whatsapp/WhatsAppService';
import { formatCurrency, toNumber } from '@/lib/format';
import { getAvailabilityLabel } from '@/lib/availability';
import { buildProductJsonLd, buildBreadcrumbJsonLd } from '@/lib/schema';
import { logAnalyticsEvent } from '@/actions/analytics';
import { Gallery } from '@/components/product/Gallery';
import { ProductActions } from '@/components/product/ProductActions';
import { Breadcrumbs } from '@/components/product/Breadcrumbs';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { TrackOnMount } from '@/components/analytics/TrackOnMount';

interface ProductPageProps {
  params: { slug: string };
}

function getProductUrl(slug: string) {
  return `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/productos/${slug}`;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return {};

  const productUrl = getProductUrl(params.slug);
  const image = product.images[0]?.url ?? product.mainImageUrl ?? undefined;
  const description = product.metaDescription ?? product.shortDescription ?? product.description ?? undefined;

  return {
    title: product.metaTitle ?? product.name,
    description,
    alternates: { canonical: productUrl },
    openGraph: {
      type: 'website',
      title: product.name,
      description,
      url: productUrl,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const productUrl = getProductUrl(params.slug);
  const whatsapp = await getWhatsAppService();

  await logAnalyticsEvent('PRODUCT_VIEW', product.id, { slug: params.slug });

  const price = toNumber(product.price);
  const promoPrice = product.promoPrice ? toNumber(product.promoPrice) : null;
  const hasPromo = promoPrice !== null && promoPrice < price;
  const availability = getAvailabilityLabel(
    product.inventory?.availability,
    product.inventory?.stock,
    product.inventory?.showExactStock
  );
  const isSoldOut = product.inventory?.availability === 'AGOTADO';
  const requiresQuoteOnly = product.priceMode === 'SOLICITAR_PRECIO';

  const whatsappInquiryLink = whatsapp.getProductInquiryLink(product as unknown as ProductCardData, productUrl);

  // Productos relacionados: primero los definidos manualmente por el admin
  // (sección 47); si no hay ninguno, se sugieren automáticamente productos
  // de la misma categoría.
  let relatedProducts = product.relatedFrom.map((relation) => relation.relatedProduct);
  if (relatedProducts.length === 0) {
    const { products: sameCategory } = await getProducts({ categorySlug: product.category.slug, pageSize: 5 });
    relatedProducts = sameCategory.filter((p) => p.id !== product.id).slice(0, 4);
  }

  const jsonLd = buildProductJsonLd(product, productUrl);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Inicio', url: siteUrl },
    { name: 'Productos', url: `${siteUrl}/productos` },
    { name: product.category.name, url: `${siteUrl}/categorias/${product.category.slug}` },
    { name: product.name, url: productUrl },
  ]);

  return (
    <div className="container-app py-8">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <Breadcrumbs categoryName={product.category.name} categorySlug={product.category.slug} productName={product.name} />

      <TrackOnMount event="view_item" params={{ item_id: product.sku, item_name: product.name, price: hasPromo ? promoPrice : price }} />

      <div className="grid gap-8 lg:grid-cols-2">
                <Gallery
          images={
            product.images.length > 0
              ? product.images
              : product.mainImageUrl
                ? [{ url: product.mainImageUrl, altText: product.name }]
                : []
          }
          productName={product.name}
        />

        <div>
          <div className="mb-1 flex items-center gap-2 text-xs text-ink-soft">
            <span>{product.category.name}</span>
            {product.brand && <span className="font-medium">· {product.brand.name}</span>}
          </div>

          <h1 className="text-3xl text-ink">{product.name}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Código: {product.sku} · {product.presentation}
          </p>

          <div className="mt-4 flex items-baseline gap-3">
            {requiresQuoteOnly ? (
              <span className="text-2xl font-bold text-ink">Solicitar precio</span>
            ) : hasPromo ? (
              <>
                <span className="text-3xl font-bold text-brand">{formatCurrency(promoPrice)}</span>
                <span className="text-lg text-ink-soft line-through">{formatCurrency(price)}</span>
              </>
            ) : (
              <span className="text-3xl font-bold text-ink">{formatCurrency(price)}</span>
            )}
          </div>

          <span className={`mt-2 inline-block w-fit rounded px-2 py-0.5 text-xs font-semibold ${availability.className}`}>
            {availability.text}
          </span>

          {product.shortDescription && <p className="mt-4 text-sm text-ink-soft">{product.shortDescription}</p>}

          <div className="mt-6">
            <ProductActions
              product={{
                productId: product.id,
                name: product.name,
                slug: product.slug,
                sku: product.sku,
                price,
                promoPrice,
                unit: product.unit,
                presentation: product.presentation,
                imageUrl: product.images[0]?.url ?? product.mainImageUrl ?? null,
              }}
              whatsappInquiryLink={whatsappInquiryLink}
              isSoldOut={isSoldOut}
              requiresQuoteOnly={requiresQuoteOnly}
              productUrl={productUrl}
              productName={product.name}
            />
          </div>

          {product.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-surface-sunken px-3 py-1 text-xs text-ink-soft">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {product.description && (
            <div className="mt-8 border-t border-surface-border pt-6">
              <h2 className="mb-2 font-display text-lg text-ink">Descripción</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">{product.description}</p>
            </div>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-surface-border pt-6 text-sm">
            <div>
              <dt className="text-ink-soft">Presentación</dt>
              <dd className="font-medium text-ink">{product.presentation}</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Unidad</dt>
              <dd className="font-medium text-ink">{product.unit}</dd>
            </div>
          </dl>
        </div>
      </div>

      <RelatedProducts products={relatedProducts} />
    </div>
  );
}
