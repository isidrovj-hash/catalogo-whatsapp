import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Corre en cada request. Dos responsabilidades:
 * 1. Refrescar el token de sesión de Supabase (si está por expirar) antes de
 *    que llegue a un Server Component, que no puede escribir cookies.
 * 2. Redirigir a /admin/login si no hay sesión y se intenta entrar a /admin.
 *
 * La verificación de ROL (¿es admin de este negocio?) NO ocurre aquí — vive
 * en `requireAdminUser()` (`lib/auth.ts`), que sí puede consultar Prisma.
 * Este middleware corre en Edge Runtime, donde Prisma con conexión directa
 * a Postgres no es viable; por eso se mantiene deliberadamente ligero.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isLoginRoute = request.nextUrl.pathname === '/admin/login';

  if (isAdminRoute && !isLoginRoute && !user) {
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
