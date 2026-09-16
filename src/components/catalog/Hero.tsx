import Link from 'next/link';
import { MessageCircle, ShieldCheck, Truck, Zap } from 'lucide-react';

interface HeroProps {
  whatsappLink: string;
  heroImageUrl?: string | null;
}

const BENEFITS = [
  { icon: ShieldCheck, label: 'Precios confiables' },
  { icon: Truck, label: 'Entrega en sucursal o a domicilio' },
  { icon: Zap, label: 'Cotización en minutos' },
];

export function Hero({ whatsappLink, heroImageUrl }: HeroProps) {
  return (
    <section className="border-b border-surface-border bg-surface-sunken">
      <div className="container-app grid gap-8 py-12 lg:grid-cols-2 lg:items-center lg:py-20">
        <div>
          <h1 className="text-4xl leading-tight text-ink sm:text-5xl">
            Todo lo que necesitas <span className="text-brand">en un solo lugar</span>
          </h1>
          <p className="mt-4 max-w-md text-base text-ink-soft sm:text-lg">
            Consulta nuestro catálogo, selecciona tus productos y solicita tu cotización directamente por WhatsApp.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/productos" className="btn-primary">
              Ver productos
            </Link>
            {whatsappLink && (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                <MessageCircle className="h-4 w-4" />
                Cotizar por WhatsApp
              </a>
            )}
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {BENEFITS.map((benefit) => (
              <li key={benefit.label} className="flex items-center gap-2 text-sm font-medium text-ink-soft">
                <benefit.icon className="h-4 w-4 text-brand" />
                {benefit.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative hidden aspect-[4/3] overflow-hidden rounded-lg bg-ink/5 lg:block">
          {heroImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroImageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-soft/40">
              <span className="font-display text-2xl">Imagen del catálogo</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
