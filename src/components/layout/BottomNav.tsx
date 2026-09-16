import Link from 'next/link';
import { Grid3x3, Home, MessageCircle, Search, ShoppingCart } from 'lucide-react';
import { getWhatsAppService } from '@/lib/whatsapp/WhatsAppService';
import { CartBadge } from './CartBadge';
import { TrackedLink } from '@/components/analytics/TrackedLink';

// Navegación inferior mobile-first (sección 32). Se oculta en pantallas
// grandes porque en desktop la navegación principal ya vive en el Header.
// Se deja `pb-16` en el layout raíz en móvil para que esta barra nunca tape
// contenido ni botones de acción (requisito explícito de la sección 32).
export async function BottomNav() {
  const whatsapp = await getWhatsAppService();
  const waLink = whatsapp.getGeneralInquiryLink();

  const items = [
    { label: 'Inicio', href: '/', icon: Home },
    { label: 'Categorías', href: '/categorias', icon: Grid3x3 },
    { label: 'Buscar', href: '/productos', icon: Search },
    { label: 'Pedido', href: '/carrito', icon: ShoppingCart, badge: true },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-border bg-white lg:hidden">
      <div className="grid grid-cols-5">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex flex-col items-center gap-0.5 py-2 text-ink-soft transition-colors hover:text-brand"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
            {item.badge && <CartBadge />}
          </Link>
        ))}
        {waLink ? (
          <TrackedLink
            event="whatsapp"
            context="bottom_nav"
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-0.5 py-2 text-success"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-[10px] font-medium">WhatsApp</span>
          </TrackedLink>
        ) : (
          <span className="flex flex-col items-center gap-0.5 py-2 text-ink-soft/40">
            <MessageCircle className="h-5 w-5" />
            <span className="text-[10px] font-medium">WhatsApp</span>
          </span>
        )}
      </div>
    </nav>
  );
}
