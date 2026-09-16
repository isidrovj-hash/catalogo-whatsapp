import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Cliente de Supabase para Server Components / Server Actions, atado a las
// cookies de la request para mantener la sesión del usuario admin. Se usa
// SIEMPRE la anon key aquí: la autenticación real la resuelve la sesión del
// usuario, no una clave privilegiada.
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Se ignora si se llama desde un Server Component sin permiso de
            // escritura de cookies; el middleware se encarga de refrescar la sesión.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Ver nota anterior.
          }
        },
      },
    }
  );
}

// Cliente con la service role key: SOLO para operaciones administrativas de
// servidor que deben saltarse Row Level Security (ej. importación masiva,
// tareas internas). Nunca importar este archivo desde un Client Component.
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
