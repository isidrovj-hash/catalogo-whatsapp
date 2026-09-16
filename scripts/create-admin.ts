/**
 * Promueve un usuario ya registrado en Supabase Auth a administrador del
 * panel /admin, creando (o actualizando) su fila correspondiente en la
 * tabla `users` de nuestra base de datos con role = 'ADMIN'.
 *
 * Uso:
 *   1. Crea el usuario primero en Supabase Dashboard → Authentication →
 *      Users → Add user (o dejar que se registre él mismo si tu proyecto
 *      tiene signup habilitado).
 *   2. Corre: npx tsx scripts/create-admin.ts correo@ejemplo.com "Nombre Apellido"
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

async function main() {
  const [, , email, name] = process.argv;

  if (!email) {
    console.error('Uso: npx tsx scripts/create-admin.ts correo@ejemplo.com "Nombre Apellido"');
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en tu .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  // Busca el usuario en Supabase Auth por correo (recorre páginas si hace falta).
  let authUser = null;
  let page = 1;
  while (!authUser) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    authUser = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
    if (data.users.length < 200) break;
    page += 1;
  }

  if (!authUser) {
    console.error(`No se encontró ningún usuario de Supabase Auth con el correo ${email}. Créalo primero desde el Dashboard.`);
    process.exit(1);
  }

  const user = await prisma.user.upsert({
    where: { supabaseId: authUser.id },
    update: { role: 'ADMIN', active: true },
    create: {
      supabaseId: authUser.id,
      email: authUser.email!,
      name: name || authUser.email!.split('@')[0],
      role: 'ADMIN',
      active: true,
    },
  });

  console.log(`✅ ${user.email} ahora es ADMIN del panel (users.id = ${user.id}).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
