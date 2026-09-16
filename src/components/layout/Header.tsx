import Link from 'next/link';
import { Heart, Menu, MessageCircle, Search, ShoppingCart } from 'lucide-react';
import type { BusinessSettings } from '@/lib/data/business-settings';
import type { CategoryTree } from '@/lib/data/categories';
import { getWhatsAppService } from '@/lib/whatsapp/WhatsAppService';
import { CartBadge } from './CartBadge';
import { FavoritesBadge } from './FavoritesBadge';
import { TrackedLink } from '@/components/analytics/TrackedLink';

const NAV_LINKS = [
  { label: 'Inicio', href: '/' },
  { label: 'Productos', href: '/productos' },
  { label: 'Categorías', href: '/categorias' },
  { label: 'Ofertas', href: '/ofertas' },
  { label: 'Cotizar', href: '/cotizar' },
  { label: 'Contacto', href: '/contacto' },
];

interface HeaderProps {
  business: BusinessSettings;
  categories: CategoryTree;
}

// Server Component: la búsqueda usa un <form> GET nativo (sin JavaScript) y
// el menú móvil usa <details>/<summary>, un disclosure widget accesible que
// tampoco requiere JavaScript. Solo el contador del carrito (CartBadge) es
// un Client Component, porque depende de localStorage.
export async function Header({ business, categories }: HeaderProps) {
  const whatsapp = await getWhatsAppService();
  const generalWhatsAppLink = whatsapp.getGeneralInquiryLink();

  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-white/95 backdrop-blur">
      <div className="container-app flex h-16 items-center gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          {business.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.logoUrl} alt={business.businessName} className="h-9 w-9 rounded object-cover" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded bg-brand text-sm font-bold text-white">
              {business.businessName.charAt(0)}
            </span>
          )}
          <span className="hidden font-display text-lg font-semibold text-ink sm:inline">{business.businessName}</span>
        </Link>

        <form action="/productos" method="GET" className="hidden flex-1 md:block">
          <label htmlFor="header-search" className="sr-only">
            Buscar productos
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              id="header-search"
              type="search"
              name="q"
              placeholder="Busca por nombre, código o marca..."
              className="w-full rounded border border-surface-border bg-surface-sunken py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-soft focus:border-brand focus:bg-white focus:outline-none"
            />
          </div>
        </form>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          {generalWhatsAppLink && (
            <TrackedLink
              event="whatsapp"
              context="header"
              href={generalWhatsAppLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded bg-success/10 px-3 py-2 text-sm font-semibold text-success transition-colors hover:bg-success/20 sm:flex"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </TrackedLink>
          )}

          <Link href="/favoritos" className="relative hidden h-10 w-10 items-center justify-center rounded hover:bg-surface-sunken sm:flex" aria-label="Ver favoritos">
            <Heart className="h-5 w-5 text-ink" />
            <FavoritesBadge />
          </Link>

          <Link href="/carrito" className="relative flex h-10 w-10 items-center justify-center rounded hover:bg-surface-sunken" aria-label="Ver carrito">
            <ShoppingCart className="h-5 w-5 text-ink" />
            <CartBadge />
          </Link>

          <details className="relative lg:hidden">
            <summary className="flex h-10 w-10 list-none items-center justify-center rounded hover:bg-surface-sunken [&::-webkit-details-marker]:hidden">
              <Menu className="h-5 w-5 text-ink" />
            </summary>
            <div className="absolute right-0 top-12 w-64 rounded border border-surface-border bg-white p-2 shadow-lg">
              <form action="/productos" method="GET" className="mb-2 px-1">
                <input
                  type="search"
                  name="q"
                  placeholder="Buscar productos..."
                  className="w-full rounded border border-surface-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
                />
              </form>
              <nav className="flex flex-col">
                {NAV_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} className="rounded px-3 py-2 text-sm font-medium text-ink hover:bg-surface-sunken">
                    {link.label}
                  </Link>
                ))}
                <Link href="/favoritos" className="rounded px-3 py-2 text-sm font-medium text-ink hover:bg-surface-sunken sm:hidden">
                  Favoritos
                </Link>
              </nav>
              {categories.length > 0 && (
                <>
                  <div className="my-2 border-t border-surface-border" />
                  <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">Categorías</p>
                  {categories.slice(0, 6).map((category) => (
                    <Link
                      key={category.id}
                      href={`/categorias/${category.slug}`}
                      className="rounded px-3 py-2 text-sm text-ink-soft hover:bg-surface-sunken hover:text-ink"
                    >
                      {category.name}
                    </Link>
                  ))}
                </>
              )}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
