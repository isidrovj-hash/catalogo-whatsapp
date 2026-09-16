import Link from 'next/link';
import { Facebook, Instagram, MapPin, Phone } from 'lucide-react';
import type { BusinessSettings } from '@/lib/data/business-settings';

export function Footer({ business }: { business: BusinessSettings }) {
  return (
    <footer className="mt-16 border-t border-surface-border bg-surface-sunken pb-20 pt-10 lg:pb-10">
      <div className="container-app grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="font-display text-lg text-ink">{business.businessName}</h3>
          {business.schedule && <p className="mt-2 text-sm text-ink-soft">{business.schedule}</p>}
          <div className="mt-3 flex gap-3">
            {business.facebookUrl && (
              <a href={business.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-ink-soft hover:text-brand">
                <Facebook className="h-5 w-5" />
              </a>
            )}
            {business.instagramUrl && (
              <a href={business.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-ink-soft hover:text-brand">
                <Instagram className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Navegación</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/productos" className="text-ink-soft hover:text-brand">Productos</Link></li>
            <li><Link href="/categorias" className="text-ink-soft hover:text-brand">Categorías</Link></li>
            <li><Link href="/ofertas" className="text-ink-soft hover:text-brand">Ofertas</Link></li>
            <li><Link href="/contacto" className="text-ink-soft hover:text-brand">Contacto</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Contacto</h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            {business.phone && (
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" /> {business.phone}
              </li>
            )}
            {business.address && (
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  {business.address}
                  {business.city ? `, ${business.city}` : ''}
                  {business.state ? `, ${business.state}` : ''}
                </span>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Aviso</h4>
          <p className="mt-3 text-xs leading-relaxed text-ink-soft">
            {business.legalText ?? 'Precios sujetos a cambio sin previo aviso. Consulta disponibilidad.'}
          </p>
        </div>
      </div>

      <div className="container-app mt-8 border-t border-surface-border pt-4 text-xs text-ink-soft">
        © {new Date().getFullYear()} {business.businessName}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
