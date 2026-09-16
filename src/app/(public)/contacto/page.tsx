import type { Metadata } from 'next';
import { MapPin, Mail, Phone, MessageCircle } from 'lucide-react';
import { getBusinessSettings } from '@/lib/data/business-settings';
import { getWhatsAppService } from '@/lib/whatsapp/WhatsAppService';
import { TrackedLink } from '@/components/analytics/TrackedLink';

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Ponte en contacto con nosotros por teléfono, correo o WhatsApp.',
};

export default async function ContactPage() {
  const business = await getBusinessSettings();
  const whatsapp = await getWhatsAppService();
  const waLink = whatsapp.getGeneralInquiryLink();

  return (
    <div className="container-app py-10">
      <h1 className="mb-2 text-3xl text-ink">Contacto</h1>
      <p className="mb-8 max-w-lg text-sm text-ink-soft">
        ¿Tienes dudas sobre algún producto o quieres una cotización personalizada? Contáctanos por cualquiera de estos medios.
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {waLink && (
          <TrackedLink event="whatsapp" context="contact_page" href={waLink} target="_blank" rel="noopener noreferrer" className="flex flex-col gap-3 rounded-lg border border-success/30 bg-success/5 p-5 hover:bg-success/10">
            <MessageCircle className="h-6 w-6 text-success" />
            <div>
              <h2 className="font-semibold text-ink">WhatsApp</h2>
              <p className="text-sm text-ink-soft">Respuesta más rápida</p>
            </div>
          </TrackedLink>
        )}

        {business.phone && (
          <TrackedLink event="phone" context="contact_page" href={`tel:${business.phone}`} className="flex flex-col gap-3 rounded-lg border border-surface-border bg-white p-5 hover:bg-surface-sunken">
            <Phone className="h-6 w-6 text-brand" />
            <div>
              <h2 className="font-semibold text-ink">Teléfono</h2>
              <p className="text-sm text-ink-soft">{business.phone}</p>
            </div>
          </TrackedLink>
        )}

        {business.email && (
          <TrackedLink event="email" context="contact_page" href={`mailto:${business.email}`} className="flex flex-col gap-3 rounded-lg border border-surface-border bg-white p-5 hover:bg-surface-sunken">
            <Mail className="h-6 w-6 text-brand" />
            <div>
              <h2 className="font-semibold text-ink">Correo</h2>
              <p className="text-sm text-ink-soft">{business.email}</p>
            </div>
          </TrackedLink>
        )}
      </div>

      {(business.address || business.googleMapsUrl) && (
        <div className="mt-8 rounded-lg border border-surface-border bg-white p-5">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 shrink-0 text-brand" />
            <div>
              <h2 className="font-semibold text-ink">Ubicación</h2>
              <p className="text-sm text-ink-soft">
                {business.address}
                {business.city ? `, ${business.city}` : ''}
                {business.state ? `, ${business.state}` : ''}
              </p>
              {business.schedule && <p className="mt-1 text-sm text-ink-soft">Horario: {business.schedule}</p>}
              {business.googleMapsUrl && (
                <a href={business.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
                  Cómo llegar →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
