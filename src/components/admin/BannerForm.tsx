'use client';

import { useState, useTransition } from 'react';
import { ImageUploadField } from '@/components/admin/ImageUploadField';

export interface BannerFormDefaults {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  linkUrl?: string;
  sortOrder?: number;
  active?: boolean;
}

interface BannerFormProps {
  defaults?: BannerFormDefaults;
  action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  submitLabel?: string;
}

export function BannerForm({ defaults = {}, action, submitLabel = 'Guardar banner' }: BannerFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await action(formData);
      if (!result.ok) setError(result.error ?? 'Ocurrió un error.');
      else setSuccess(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <section className="space-y-4 rounded-lg border border-surface-border bg-white p-5">
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-ink">
            Título *
          </label>
          <input
            id="title"
            name="title"
            required
            placeholder="OFERTA DE LA SEMANA"
            defaultValue={defaults.title}
            className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="subtitle" className="mb-1 block text-sm font-medium text-ink">
            Subtítulo
          </label>
          <input
            id="subtitle"
            name="subtitle"
            defaultValue={defaults.subtitle}
            className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        <ImageUploadField name="imageUrl" label="Imagen del banner *" defaultValue={defaults.imageUrl} />

        <div>
          <label htmlFor="linkUrl" className="mb-1 block text-sm font-medium text-ink">
            Enlace al hacer click (opcional)
          </label>
          <input
            id="linkUrl"
            name="linkUrl"
            placeholder="/ofertas"
            defaultValue={defaults.linkUrl}
            className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="sortOrder" className="mb-1 block text-sm font-medium text-ink">
            Orden
          </label>
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={defaults.sortOrder ?? 0}
            className="w-full max-w-[120px] rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" name="active" value="1" defaultChecked={defaults.active ?? true} className="h-4 w-4 rounded border-surface-border text-brand focus:ring-brand" />
          Activo
        </label>
      </section>

      {error && <p className="rounded border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</p>}
      {success && <p className="rounded border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">Banner guardado correctamente.</p>}

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? 'Guardando...' : submitLabel}
      </button>
    </form>
  );
}
