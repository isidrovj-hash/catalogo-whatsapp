'use client';

import { useState, useTransition } from 'react';
import { ImageUploadField } from '@/components/admin/ImageUploadField';

export interface PromotionFormDefaults {
  name?: string;
  description?: string;
  startDate?: string; // yyyy-mm-dd
  endDate?: string;
  productId?: string;
  categoryId?: string;
  promoPrice?: number | null;
  imageUrl?: string | null;
  active?: boolean;
}

interface PromotionFormProps {
  defaults?: PromotionFormDefaults;
  products: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  submitLabel?: string;
}

export function PromotionForm({ defaults = {}, products, categories, action, submitLabel = 'Guardar promoción' }: PromotionFormProps) {
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
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-ink">
            Nombre de la promoción *
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={defaults.name}
            className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-ink">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            defaultValue={defaults.description}
            className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="startDate" className="mb-1 block text-sm font-medium text-ink">
              Fecha inicio *
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              required
              defaultValue={defaults.startDate}
              className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="mb-1 block text-sm font-medium text-ink">
              Fecha final *
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              required
              defaultValue={defaults.endDate}
              className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="productId" className="mb-1 block text-sm font-medium text-ink">
              Producto específico
            </label>
            <select
              id="productId"
              name="productId"
              defaultValue={defaults.productId ?? ''}
              className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            >
              <option value="">Ninguno</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="categoryId" className="mb-1 block text-sm font-medium text-ink">
              O categoría completa
            </label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={defaults.categoryId ?? ''}
              className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            >
              <option value="">Ninguna</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="promoPrice" className="mb-1 block text-sm font-medium text-ink">
            Precio de promoción
          </label>
          <input
            id="promoPrice"
            name="promoPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaults.promoPrice ?? undefined}
            className="w-full max-w-xs rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        <ImageUploadField name="imageUrl" label="Imagen de la promoción" defaultValue={defaults.imageUrl} />

        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" name="active" value="1" defaultChecked={defaults.active ?? true} className="h-4 w-4 rounded border-surface-border text-brand focus:ring-brand" />
          Activa
        </label>
      </section>

      {error && <p className="rounded border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</p>}
      {success && <p className="rounded border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">Promoción guardada correctamente.</p>}

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? 'Guardando...' : submitLabel}
      </button>
    </form>
  );
}
