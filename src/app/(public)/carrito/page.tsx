import type { Metadata } from 'next';
import { getFeaturedProducts } from '@/lib/data/products';
import { toNumber } from '@/lib/format';
import type { MiniProduct } from '@/actions/products';
import { CartView } from '@/components/cart/CartView';

export const metadata: Metadata = {
  title: 'Carrito',
  robots: { index: false }, // el carrito es específico de cada sesión, no debe indexarse
};

export default async function CartPage() {
  const featured = await getFeaturedProducts(4);

  // Se convierte al mismo formato MiniProduct que usan las Server Actions,
  // para que CartView (Client Component) reciba siempre la misma forma de
  // datos sin importar si vienen de un fetch inicial (aquí) o de una
  // Server Action posterior (venta cruzada, favoritos).
  const featuredFallback: MiniProduct[] = featured.map((p) => ({
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
  }));

  return (
    <div className="container-app py-8">
      <h1 className="mb-6 text-3xl text-ink">Tu carrito</h1>
      <CartView featuredFallback={featuredFallback} />
    </div>
  );
}
