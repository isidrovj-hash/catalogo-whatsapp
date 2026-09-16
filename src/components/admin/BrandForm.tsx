'use client';

import { useState, useTransition } from 'react';
import { NameSlugFields } from '@/components/admin/NameSlugFields';
import { ImageUploadField } from '@/components/admin/ImageUploadField';

export interface BrandFormDefaults {
  name?: string;
  slug?: string;
  logoUrl?: string | null;
  active?: boolean;
}

interface BrandFormProps {
  defaults?: BrandFormDefaults;
  action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  submitLabel?: string;
}

export function BrandForm({ defaults = {}, action, submitLabel = 'Guardar marca' }: BrandFormProps) {
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
        <NameSlugFields defaultName={defaults.name} defaultSlug={defaults.slug} />

        <ImageUploadField name="logoUrl" label="Logo de la marca (opcional)" defaultValue={defaults.logoUrl} />

        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" name="active" value="1" defaultChecked={defaults.active ?? true} className="h-4 w-4 rounded border-surface-border text-brand focus:ring-brand" />
          Activa (disponible para asignar a productos)
        </label>
      </section>

      {error && <p className="rounded border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</p>}
      {success && <p className="rounded border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">Marca guardada correctamente.</p>}

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? 'Guardando...' : submitLabel}
      </button>
    </form>
  );
}
