'use server';

import { prisma } from '@/lib/prisma';
import { Prisma, type AnalyticsEventType } from '@prisma/client';

/**
 * Registra un evento de analítica comercial (sección 25). Se llama tanto
 * desde Server Components (ej. al renderizar resultados de búsqueda) como
 * desde Client Components vía Server Action (ej. al hacer click en
 * "Agregar"). Nunca debe romper la experiencia del usuario si falla: los
 * errores se registran en consola del servidor y se ignoran silenciosamente
 * de cara al cliente.
 */
export async function logAnalyticsEvent(
  type: AnalyticsEventType,
  productId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      // El campo `metadata` es tipo Json en Prisma, que espera específicamente
      // `Prisma.InputJsonValue`, no un `Record<string, unknown>` genérico —
      // el cast es seguro porque siempre le pasamos objetos planos serializables.
      data: { type, productId, metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined },
    });
  } catch (error) {
    console.error('[analytics] No se pudo registrar el evento:', type, error);
  }
}
