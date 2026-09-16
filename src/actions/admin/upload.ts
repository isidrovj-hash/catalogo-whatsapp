'use server';

import { createSupabaseAdminClient } from '@/lib/supabase/server';

const BUCKET = 'catalog';
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export type UploadImageResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Sube una imagen al bucket público `catalog` de Supabase Storage
 * (sección 34: "validación de imágenes"). Se usa la service role key porque
 * la subida ocurre siempre desde una Server Action ya protegida por
 * `requireAdminUser()` en la página que la invoca — nunca se expone esta
 * llave al navegador.
 *
 * Crea el bucket en tu proyecto de Supabase antes de usar esto:
 * Storage → New bucket → nombre "catalog" → Public bucket: ON.
 */
export async function uploadImage(formData: FormData): Promise<UploadImageResult> {
  const file = formData.get('file');

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'No se recibió ningún archivo.' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: 'Formato no permitido. Usa JPG, PNG, WEBP o AVIF.' };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return { ok: false, error: 'La imagen supera el límite de 5 MB.' };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const extension = file.name.split('.').pop() || 'jpg';
    const path = `${crypto.randomUUID()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      console.error('[upload] Error de Supabase Storage:', error);
      return { ok: false, error: 'No se pudo subir la imagen. Intenta de nuevo.' };
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return { ok: true, url: data.publicUrl };
  } catch (error) {
    console.error('[upload] Error inesperado:', error);
    return { ok: false, error: 'Ocurrió un error al subir la imagen.' };
  }
}
