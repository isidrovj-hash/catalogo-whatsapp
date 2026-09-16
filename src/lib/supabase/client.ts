import { createBrowserClient } from '@supabase/ssr';

// Cliente de Supabase para usar en Client Components ("use client").
// Solo expone la anon key (segura para el navegador); nunca la service role.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
