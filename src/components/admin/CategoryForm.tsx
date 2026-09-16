'use client';

import { useState, useTransition } from 'react';
import { NameSlugFields } from '@/components/admin/NameSlugFields';
import { ImageUploadField } from '@/components/admin/ImageUploadField';

export interface CategoryFormDefaults {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string;
  imageUrl?: string | null;
  sortOrder?: number;
  active?: boolean;
}

interface CategoryFormProps {
  defaults?: CategoryFormDefaults;
  parentOptions: { id: string; name: string }[];
  action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  submitLabel?: string;
}

export function CategoryForm({ defaults = {}, parentOptions, action, submitLabel = 'Guardar categoría' }: CategoryFormProps) {
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
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <section className="space-y-4 rounded-lg border border-surface-border bg-white p-5">
        <NameSlugFields defaultName={defaults.name} defaultSlug={defaults.slug} />

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-ink">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={defaults.description}
            className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="parentId" className="mb-1 block text-sm font-medium text-ink">
              Categoría padre (opcional)
            </label>
            <select
              id="parentId"
              name="parentId"
              defaultValue={defaults.parentId ?? ''}
              className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            >
              <option value="">Ninguna (categoría principal)</option>
              {parentOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
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
              className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>
        </div>

        <ImageUploadField name="imageUrl" label="Imagen de la categoría" defaultValue={defaults.imageUrl} />

        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" name="active" value="1" defaultChecked={defaults.active ?? true} className="h-4 w-4 rounded border-surface-border text-brand focus:ring-brand" />
          Activa (visible en el catálogo)
        </label>
      </section>

      {error && <p className="rounded border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</p>}
      {success && <p className="rounded border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">Categoría guardada correctamente.</p>}

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? 'Guardando...' : submitLabel}
      </button>
    </form>
  );
}
