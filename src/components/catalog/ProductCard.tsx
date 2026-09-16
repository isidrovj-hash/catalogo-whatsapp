import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import type { ProductCardData } from '@/lib/data/products';
import { formatCurrency, toNumber } from '@/lib/format';
import { getAvailabilityLabel } from '@/lib/availability';
import { getWhatsAppService } from '@/lib/whatsapp/WhatsAppService';
import { AddToCartButton } from './AddToCartButton';
import { FavoriteButton } from './FavoriteButton';
import { TrackedLink } from '@/components/analytics/TrackedLink';

export async function ProductCard({ product }: { product: ProductCardData }) {
  const productUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/productos/${product.slug}`;
  const whatsapp = await getWhatsAppService();
  const inquiryLink = whatsapp.getProductInquiryLink(product, productUrl);

  const price = toNumber(product.price);
  const promoPrice = product.promoPrice ? toNumber(product.promoPrice) : null;
  const hasPromo = promoPrice !== null && promoPrice < price;
  const availability = getAvailabilityLabel(
    product.inventory?.availability,
    product.inventory?.stock,
    product.inventory?.showExactStock
  );
  const mainImage = product.images[0]?.url ?? product.mainImageUrl;

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-surface-border bg-white transition-shadow hover:shadow-md">
      <Link href={`/productos/${product.slug}`} className="relative block aspect-square bg-surface-sunken">
        {mainImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mainImage}
            alt={product.images[0]?.altText ?? product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-ink-soft/50">Sin imagen</div>
        )}
        {hasPromo && (
          <span className="absolute left-2 top-2 rounded bg-accent px-2 py-1 text-[11px] font-bold text-ink">OFERTA</span>
        )}
        <div className="absolute right-2 top-2">
          <FavoriteButton productId={product.id} />
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2 text-[11px] text-ink-soft">
          <span>{product.category.name}</span>
          {product.brand && <span className="font-medium">{product.brand.name}</span>}
        </div>

        <Link href={`/productos/${product.slug}`}>
          <h3 className="line-clamp-2 text-sm font-semibold text-ink hover:text-brand">{product.name}</h3>
        </Link>

        <p className="text-xs text-ink-soft">
          Código: {product.sku} · {product.presentation}
        </p>

        <div className="mt-1 flex items-baseline gap-2">
          {product.priceMode === 'SOLICITAR_PRECIO' ? (
            <span className="text-sm font-semibold text-ink">Solicitar precio</span>
          ) : hasPromo ? (
            <>
              <span className="text-lg font-bold text-brand">{formatCurrency(promoPrice)}</span>
              <span className="text-sm text-ink-soft line-through">{formatCurrency(price)}</span>
            </>
          ) : (
            <span className="text-lg font-bold text-ink">{formatCurrency(price)}</span>
          )}
        </div>

        <span className={`w-fit rounded px-2 py-0.5 text-[11px] font-semibold ${availability.className}`}>
          {availability.text}
        </span>

        <div className="mt-auto flex flex-col gap-2 pt-3">
          {product.priceMode === 'SOLICITAR_PRECIO' || product.inventory?.availability === 'AGOTADO' ? (
            inquiryLink && (
              <TrackedLink event="whatsapp" context="catalog_card" href={inquiryLink} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
                <MessageCircle className="h-4 w-4" /> Preguntar por WhatsApp
              </TrackedLink>
            )
          ) : (
            <>
              <AddToCartButton
                product={{
                  productId: product.id,
                  name: product.name,
                  slug: product.slug,
                  sku: product.sku,
                  price,
                  promoPrice,
                  unit: product.unit,
                  presentation: product.presentation,
                  imageUrl: mainImage ?? null,
                }}
              />
              {inquiryLink && (
                <TrackedLink
                  event="whatsapp"
                  context="catalog_card"
                  href={inquiryLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary w-full text-success"
                >
                  <MessageCircle className="h-4 w-4" /> Preguntar por WhatsApp
                </TrackedLink>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
