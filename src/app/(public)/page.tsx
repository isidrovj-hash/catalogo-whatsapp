import { getBusinessSettings } from '@/lib/data/business-settings';
import { getCategoryTree } from '@/lib/data/categories';
import { getFeaturedProducts } from '@/lib/data/products';
import { prisma } from '@/lib/prisma';
import { getWhatsAppService } from '@/lib/whatsapp/WhatsAppService';
import { buildLocalBusinessJsonLd } from '@/lib/schema';
import { Hero } from '@/components/catalog/Hero';
import { CategoryChips } from '@/components/catalog/CategoryChips';
import { BannerStrip } from '@/components/catalog/BannerStrip';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import Link from 'next/link';

export const revalidate = 300; // ISR: la home se regenera cada 5 minutos como máximo

export default async function HomePage() {
  const [business, categories, featuredProducts, banners, whatsapp] = await Promise.all([
    getBusinessSettings(),
    getCategoryTree(),
    getFeaturedProducts(8),
    prisma.banner.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    getWhatsAppService(),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const localBusinessJsonLd = buildLocalBusinessJsonLd(business, siteUrl);

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }} />

      <Hero whatsappLink={whatsapp.getGeneralInquiryLink()} heroImageUrl={business.heroImageUrl} />
      <BannerStrip banners={banners} />
      <CategoryChips categories={categories} />

      <section className="container-app py-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl text-ink">Productos destacados</h2>
          <Link href="/productos" className="text-sm font-semibold text-brand hover:underline">
            Ver todo el catálogo
          </Link>
        </div>
        <ProductGrid products={featuredProducts} />
      </section>

      {business.freeShippingAmount && (
        <section className="container-app pb-8">
          <div className="rounded-lg border border-accent/30 bg-accent-soft px-5 py-4 text-center text-sm font-medium text-ink">
            Envío gratis en compras mayores a {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(business.freeShippingAmount))}
          </div>
        </section>
      )}
    </>
  );
}
