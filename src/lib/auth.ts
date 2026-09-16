import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import type { User } from '@prisma/client';

/**
 * Verifica que haya una sesión de Supabase activa Y que ese usuario exista
 * en nuestra propia tabla `users` con una cuenta activa. Son dos capas
 * deliberadamente separadas (sección 34, "control de permisos"):
 * - Supabase Auth resuelve "¿quién eres?" (login, contraseñas, sesiones).
 * - Nuestra tabla `users` resuelve "¿tienes permiso de administrar este
 *   catálogo?" — alguien puede tener cuenta de Supabase sin ser admin del
 *   negocio, y este segundo chequeo es el que realmente importa.
 *
 * Se usa al inicio de `app/admin/layout.tsx`, así que protege todas las
 * páginas anidadas de /admin sin tener que repetir la validación en cada
 * una.
 */
export async function requireAdminUser(): Promise<User> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/admin/login');
  }

  const appUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });

  if (!appUser || !appUser.active) {
    // Sesión válida en Supabase pero sin cuenta (o cuenta desactivada) en
    // nuestra tabla `users`: se cierra la sesión y se manda a login con un
    // mensaje, en vez de dejarlo en un limbo de "autenticado pero sin acceso".
    await supabase.auth.signOut();
    redirect('/admin/login?error=sin_acceso');
  }

  return appUser;
}
