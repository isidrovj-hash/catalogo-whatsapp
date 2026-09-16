import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Endpoint mínimo de salud para monitoreo (UptimeRobot, Vercel, etc.).
 * Verifica que la aplicación responde Y que la conexión a la base de datos
 * funciona — un healthcheck que no toca la base de datos puede reportar
 * "todo bien" mientras la app está completamente rota para los usuarios
 * reales, que sí dependen de esa conexión en cada página.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[health] Error de conexión a la base de datos:', error);
    return NextResponse.json(
      { status: 'error', database: 'disconnected', timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
