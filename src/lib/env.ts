import { z } from 'zod';

// Centraliza y valida todas las variables de entorno del proyecto. Importar
// desde aquí en vez de usar `process.env.X` directamente evita errores
// silenciosos (variable mal escrita, undefined en producción) y documenta
// en un solo lugar qué necesita el sistema para funcionar.
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(), // conexión directa de Supabase, usada solo por Prisma Migrate
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),

  // Solo necesarias si business_settings.whatsapp_provider = 'CLOUD_API'
  // (ver FASE 8). En modo 'LINK' (el default) estas variables no se usan.
  WHATSAPP_CLOUD_API_TOKEN: z.string().optional(),
  WHATSAPP_CLOUD_API_PHONE_ID: z.string().optional(),
  WHATSAPP_CLOUD_API_VERIFY_TOKEN: z.string().optional(),

  // Analítica externa opcional (FASE 11)
  NEXT_PUBLIC_GA4_ID: z.string().optional(),
  NEXT_PUBLIC_META_PIXEL_ID: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Falla en tiempo de build/arranque con un mensaje legible, en vez de
  // errores crípticos más adelante cuando algo intente usar una variable
  // faltante (por ejemplo, el número de WhatsApp o la conexión a la DB).
  console.error('❌ Variables de entorno inválidas o faltantes:', parsed.error.flatten().fieldErrors);
  throw new Error('Configuración de entorno inválida. Revisa tu archivo .env contra .env.example.');
}

export const env = parsed.data;
