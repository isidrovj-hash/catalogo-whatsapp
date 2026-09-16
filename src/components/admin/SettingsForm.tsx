'use client';

import { useState, useTransition } from 'react';
import type { BusinessSettings } from '@/lib/data/business-settings';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { updateBusinessSettings } from '@/actions/admin/settings';

export function SettingsForm({ settings }: { settings: BusinessSettings }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateBusinessSettings(formData);
      if (!result.ok) setError(result.error ?? 'Ocurrió un error.');
      else setSuccess(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <section className="space-y-4 rounded-lg border border-surface-border bg-white p-5">
        <h2 className="font-display text-lg text-ink">Negocio</h2>

        <div>
          <label htmlFor="businessName" className="mb-1 block text-sm font-medium text-ink">
            Nombre del negocio *
          </label>
          <input
            id="businessName"
            name="businessName"
            required
            defaultValue={settings.businessName}
            className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        <ImageUploadField name="logoUrl" label="Logo" defaultValue={settings.logoUrl} />

        <ImageUploadField name="heroImageUrl" label="Imagen de portada (Hero, página de inicio)" defaultValue={settings.heroImageUrl} />
      </section>

      <section className="space-y-4 rounded-lg border border-brand/30 bg-brand-soft/40 p-5">
        <h2 className="font-display text-lg text-ink">WhatsApp</h2>
        <p className="text-xs text-ink-soft">
          Este es el único lugar donde se configura el número de WhatsApp de todo el sitio (sección 13) — nunca está escrito
          en el código.
        </p>

        <div>
          <label htmlFor="whatsappNumber" className="mb-1 block text-sm font-medium text-ink">
            Número de WhatsApp (formato E.164, solo dígitos) *
          </label>
          <input
            id="whatsappNumber"
            name="whatsappNumber"
            required
            placeholder="528112345678"
            defaultValue={settings.whatsappNumber}
            className="w-full max-w-xs rounded border border-surface-border px-3 py-2.5 font-mono text-sm focus:border-brand focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="whatsappProvider" className="mb-1 block text-sm font-medium text-ink">
            Proveedor de envío
          </label>
          <select
            id="whatsappProvider"
            name="whatsappProvider"
            defaultValue={settings.whatsappProvider}
            className="w-full max-w-xs rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          >
            <option value="LINK">Enlaces wa.me (por defecto)</option>
            <option value="CLOUD_API">WhatsApp Business Cloud API</option>
          </select>
          <p className="mt-1 text-xs text-ink-soft">
            &quot;Cloud API&quot; requiere haber configurado las variables de entorno correspondientes (ver FASE 8). Si faltan, el
            sistema usa enlaces wa.me automáticamente.
          </p>
        </div>

        <div>
          <label htmlFor="whatsappMessageBase" className="mb-1 block text-sm font-medium text-ink">
            Mensaje genérico (botón flotante / header)
          </label>
          <input
            id="whatsappMessageBase"
            name="whatsappMessageBase"
            defaultValue={settings.whatsappMessageBase ?? undefined}
            className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-surface-border bg-white p-5">
        <h2 className="font-display text-lg text-ink">Contacto</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-ink">Teléfono</label>
            <input id="phone" name="phone" defaultValue={settings.phone ?? undefined} className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink">Correo</label>
            <input id="email" name="email" type="email" defaultValue={settings.email ?? undefined} className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="address" className="mb-1 block text-sm font-medium text-ink">Dirección</label>
            <input id="address" name="address" defaultValue={settings.address ?? undefined} className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
          </div>
          <div>
            <label htmlFor="city" className="mb-1 block text-sm font-medium text-ink">Ciudad</label>
            <input id="city" name="city" defaultValue={settings.city ?? undefined} className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
          </div>
          <div>
            <label htmlFor="state" className="mb-1 block text-sm font-medium text-ink">Estado</label>
            <input id="state" name="state" defaultValue={settings.state ?? undefined} className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="schedule" className="mb-1 block text-sm font-medium text-ink">Horario</label>
            <input id="schedule" name="schedule" defaultValue={settings.schedule ?? undefined} className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="googleMapsUrl" className="mb-1 block text-sm font-medium text-ink">Enlace de Google Maps</label>
            <input id="googleMapsUrl" name="googleMapsUrl" defaultValue={settings.googleMapsUrl ?? undefined} className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-surface-border bg-white p-5">
        <h2 className="font-display text-lg text-ink">Redes sociales</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="facebookUrl" className="mb-1 block text-sm font-medium text-ink">Facebook</label>
            <input id="facebookUrl" name="facebookUrl" defaultValue={settings.facebookUrl ?? undefined} className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
          </div>
          <div>
            <label htmlFor="instagramUrl" className="mb-1 block text-sm font-medium text-ink">Instagram</label>
            <input id="instagramUrl" name="instagramUrl" defaultValue={settings.instagramUrl ?? undefined} className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
          </div>
          <div>
            <label htmlFor="tiktokUrl" className="mb-1 block text-sm font-medium text-ink">TikTok</label>
            <input id="tiktokUrl" name="tiktokUrl" defaultValue={settings.tiktokUrl ?? undefined} className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-surface-border bg-white p-5">
        <h2 className="font-display text-lg text-ink">Reglas comerciales</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="currency" className="mb-1 block text-sm font-medium text-ink">Moneda</label>
            <input id="currency" name="currency" defaultValue={settings.currency} className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
          </div>
          <div>
            <label htmlFor="taxRate" className="mb-1 block text-sm font-medium text-ink">IVA (%)</label>
            <input id="taxRate" name="taxRate" type="number" step="0.01" defaultValue={Number(settings.taxRate)} className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
          </div>
          <div>
            <label htmlFor="minPurchaseAmount" className="mb-1 block text-sm font-medium text-ink">Compra mínima</label>
            <input id="minPurchaseAmount" name="minPurchaseAmount" type="number" step="0.01" defaultValue={settings.minPurchaseAmount ? Number(settings.minPurchaseAmount) : undefined} className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
          </div>
          <div>
            <label htmlFor="freeShippingAmount" className="mb-1 block text-sm font-medium text-ink">Envío gratis desde</label>
            <input id="freeShippingAmount" name="freeShippingAmount" type="number" step="0.01" defaultValue={settings.freeShippingAmount ? Number(settings.freeShippingAmount) : undefined} className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
          </div>
        </div>
        <div>
          <label htmlFor="legalText" className="mb-1 block text-sm font-medium text-ink">Texto legal (pie de página)</label>
          <textarea id="legalText" name="legalText" rows={2} defaultValue={settings.legalText ?? undefined} className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none" />
        </div>
      </section>

      {error && <p className="rounded border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</p>}
      {success && <p className="rounded border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">Configuración guardada correctamente.</p>}

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? 'Guardando...' : 'Guardar configuración'}
      </button>
    </form>
  );
}
