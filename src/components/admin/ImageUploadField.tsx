'use client';

import { useRef, useState, useTransition } from 'react';
import { ImageUp, Loader2, X } from 'lucide-react';
import { uploadImage } from '@/actions/admin/upload';

interface ImageUploadFieldProps {
  name: string;
  label: string;
  defaultValue?: string | null;
}

/**
 * Input de imagen que sube el archivo de inmediato a Supabase Storage y
 * guarda la URL resultante en un input oculto (`name`) — así el formulario
 * que lo contiene solo ve un string normal al enviarse, sin importar cómo
 * se obtuvo. También acepta pegar una URL manualmente como respaldo, por si
 * el bucket de Storage todavía no está configurado.
 */
export function ImageUploadField({ name, label, defaultValue }: ImageUploadFieldProps) {
  const [url, setUrl] = useState(defaultValue ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const formData = new FormData();
    formData.set('file', file);

    startTransition(async () => {
      const result = await uploadImage(formData);
      if (result.ok) {
        setUrl(result.url);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink">{label}</label>
      <input type="hidden" name={name} value={url} />

      <div className="flex items-start gap-3">
        {url ? (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded border border-surface-border bg-surface-sunken">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => setUrl('')}
              className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
              aria-label="Quitar imagen"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded border border-dashed border-surface-border text-ink-soft/40">
            <ImageUp className="h-6 w-6" />
          </div>
        )}

        <div className="flex-1 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleFileChange}
            className="block w-full text-xs text-ink-soft file:mr-3 file:rounded file:border-0 file:bg-surface-sunken file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink hover:file:bg-brand-soft"
          />
          {isPending && (
            <p className="flex items-center gap-1 text-xs text-ink-soft">
              <Loader2 className="h-3 w-3 animate-spin" /> Subiendo...
            </p>
          )}
          {error && <p className="text-xs text-danger">{error}</p>}
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="O pega una URL de imagen"
            className="w-full rounded border border-surface-border px-2 py-1.5 text-xs focus:border-brand focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
