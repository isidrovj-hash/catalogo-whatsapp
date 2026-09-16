'use client';

import { useState, useTransition } from 'react';
import { NameSlugFields } from '@/components/admin/NameSlugFields';
import { ImageUploadField } from '@/components/admin/ImageUploadField';

export interface ProductFormDefaults {
  sku?: string;
  name?: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  categoryId?: string;
  brandId?: string;
  price?: number;
  promoPrice?: number | null;
  cost?: number | null;
  priceMode?: 'MOSTRAR_PRECIO' | 'SOLICITAR_PRECIO';
  unit?: string;
  presentation?: string;
  mainImageUrl?: string | null;
  galleryUrls?: string;
  tags?: string;
  featured?: boolean;
  onPromotion?: boolean;
  active?: boolean;
  stock?: number;
  lowStockThreshold?: number;
  availability?: 'DISPONIBLE' | 'POCAS_PIEZAS' | 'AGOTADO' | 'SOBRE_PEDIDO';
  showExactStock?: boolean;
}

interface ProductFormProps {
  defaults?: ProductFormDefaults;
  categories: { id: string; name: string; parentId: string | null }[];
  brands: { id: string; name: string }[];
  action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  submitLabel?: string;
}

export function ProductForm({ defaults = {}, categories, brands, action, submitLabel = 'Guardar producto' }: ProductFormProps) {
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
      if (!result.ok) {
        setError(result.error ?? 'Ocurrió un error.');
      } else {
        setSuccess(true);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <section className="space-y-4 rounded-lg border border-surface-border bg-white p-5">
        <h2 className="font-display text-lg text-ink">Información general</h2>

        <NameSlugFields defaultName={defaults.name} defaultSlug={defaults.slug} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sku" className="mb-1 block text-sm font-medium text-ink">
              SKU / Código *
            </label>
            <input
              id="sku"
              name="sku"
              required
              defaultValue={defaults.sku}
              className="w-full rounded border border-surface-border px-3 py-2.5 font-mono text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="categoryId" className="mb-1 block text-sm font-medium text-ink">
              Categoría *
            </label>
            <select
              id="categoryId"
              name="categoryId"
              required
              defaultValue={defaults.categoryId}
              className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parentId ? `— ${c.name}` : c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="brandId" className="mb-1 block text-sm font-medium text-ink">
              Marca
            </label>
            <select
              id="brandId"
              name="brandId"
              defaultValue={defaults.brandId ?? ''}
              className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            >
              <option value="">Sin marca</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="unit" className="mb-1 block text-sm font-medium text-ink">
              Unidad *
            </label>
            <input
              id="unit"
              name="unit"
              required
              placeholder="pieza, kg, litro..."
              defaultValue={defaults.unit}
              className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="presentation" className="mb-1 block text-sm font-medium text-ink">
              Presentación *
            </label>
            <input
              id="presentation"
              name="presentation"
              required
              placeholder="Saco 25 kg, Cubeta 19 L..."
              defaultValue={defaults.presentation}
              className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="shortDescription" className="mb-1 block text-sm font-medium text-ink">
            Descripción corta
          </label>
          <input
            id="shortDescription"
            name="shortDescription"
            defaultValue={defaults.shortDescription}
            className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-ink">
            Descripción completa
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={defaults.description}
            className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="tags" className="mb-1 block text-sm font-medium text-ink">
            Etiquetas (separadas por coma)
          </label>
          <input
            id="tags"
            name="tags"
            placeholder="cemento, construccion, concreto"
            defaultValue={defaults.tags}
            className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-surface-border bg-white p-5">
        <h2 className="font-display text-lg text-ink">Imágenes</h2>
        <ImageUploadField name="mainImageUrl" label="Imagen principal" defaultValue={defaults.mainImageUrl} />
        <div>
          <label htmlFor="galleryUrls" className="mb-1 block text-sm font-medium text-ink">
            Galería adicional (una URL por línea)
          </label>
          <textarea
            id="galleryUrls"
            name="galleryUrls"
            rows={3}
            defaultValue={defaults.galleryUrls}
            placeholder={'https://.../foto2.jpg\nhttps://.../foto3.jpg'}
            className="w-full rounded border border-surface-border px-3 py-2.5 font-mono text-xs focus:border-brand focus:outline-none"
          />
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-surface-border bg-white p-5">
        <h2 className="font-display text-lg text-ink">Precio</h2>

        <div>
          <label htmlFor="priceMode" className="mb-1 block text-sm font-medium text-ink">
            Modalidad de precio
          </label>
          <select
            id="priceMode"
            name="priceMode"
            defaultValue={defaults.priceMode ?? 'MOSTRAR_PRECIO'}
            className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none sm:w-64"
          >
            <option value="MOSTRAR_PRECIO">Mostrar precio</option>
            <option value="SOLICITAR_PRECIO">Solicitar precio</option>
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="price" className="mb-1 block text-sm font-medium text-ink">
              Precio normal *
            </label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={defaults.price}
              className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="promoPrice" className="mb-1 block text-sm font-medium text-ink">
              Precio promoción
            </label>
            <input
              id="promoPrice"
              name="promoPrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={defaults.promoPrice ?? undefined}
              className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="cost" className="mb-1 block text-sm font-medium text-ink">
              Costo (interno)
            </label>
            <input
              id="cost"
              name="cost"
              type="number"
              step="0.01"
              min="0"
              defaultValue={defaults.cost ?? undefined}
              className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 pt-2">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input type="checkbox" name="onPromotion" value="1" defaultChecked={defaults.onPromotion} className="h-4 w-4 rounded border-surface-border text-brand focus:ring-brand" />
            En promoción
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input type="checkbox" name="featured" value="1" defaultChecked={defaults.featured} className="h-4 w-4 rounded border-surface-border text-brand focus:ring-brand" />
            Producto destacado
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input type="checkbox" name="active" value="1" defaultChecked={defaults.active ?? true} className="h-4 w-4 rounded border-surface-border text-brand focus:ring-brand" />
            Activo (visible en el catálogo)
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-surface-border bg-white p-5">
        <h2 className="font-display text-lg text-ink">Inventario</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="stock" className="mb-1 block text-sm font-medium text-ink">
              Stock *
            </label>
            <input
              id="stock"
              name="stock"
              type="number"
              min="0"
              required
              defaultValue={defaults.stock ?? 0}
              className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="lowStockThreshold" className="mb-1 block text-sm font-medium text-ink">
              Umbral &quot;pocas piezas&quot;
            </label>
            <input
              id="lowStockThreshold"
              name="lowStockThreshold"
              type="number"
              min="0"
              defaultValue={defaults.lowStockThreshold ?? 5}
              className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="availability" className="mb-1 block text-sm font-medium text-ink">
              Disponibilidad
            </label>
            <select
              id="availability"
              name="availability"
              defaultValue={defaults.availability ?? 'DISPONIBLE'}
              className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            >
              <option value="DISPONIBLE">Disponible</option>
              <option value="POCAS_PIEZAS">Pocas piezas</option>
              <option value="AGOTADO">Agotado</option>
              <option value="SOBRE_PEDIDO">Sobre pedido</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            name="showExactStock"
            value="1"
            defaultChecked={defaults.showExactStock}
            className="h-4 w-4 rounded border-surface-border text-brand focus:ring-brand"
          />
          Mostrar cantidad exacta al cliente (en vez de solo &quot;Disponible&quot;/&quot;Pocas piezas&quot;)
        </label>
      </section>

      {error && <p className="rounded border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</p>}
      {success && (
        <p className="rounded border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
          Producto guardado correctamente.
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? 'Guardando...' : submitLabel}
      </button>
    </form>
  );
}
