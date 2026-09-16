import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

/**
 * `business_settings` es una tabla de fila única (ver FASE 2). Se cachea con
 * el tag "business-settings" para que, cuando el admin actualice el número
 * de WhatsApp o cualquier otro dato desde /admin/configuracion (FASE 9),
 * podamos invalidar esta caché puntualmente con `revalidateTag` en vez de
 * esperar a que expire por tiempo.
 */
export const getBusinessSettings = unstable_cache(
  async () => {
    const settings = await prisma.businessSettings.findFirst();

    // Fallback defensivo: si alguien borra la fila de configuración por error,
    // el sitio no debe caerse — debe seguir siendo navegable con valores
    // genéricos hasta que el admin la recree.
    if (!settings) {
      return {
        id: 'fallback',
        businessName: 'Catálogo Digital',
        logoUrl: null,
        heroImageUrl: null,
        whatsappNumber: '',
        whatsappProvider: 'LINK' as const,
        phone: null,
        email: null,
        address: null,
        city: null,
        state: null,
        schedule: null,
        facebookUrl: null,
        instagramUrl: null,
        tiktokUrl: null,
        googleMapsUrl: null,
        currency: 'MXN',
        taxRate: 0,
        minPurchaseAmount: null,
        freeShippingAmount: null,
        legalText: null,
        whatsappMessageBase: 'Hola, me interesa solicitar una cotización.',
        updatedAt: new Date(),
      };
    }

    return settings;
  },
  ['business-settings'],
  { tags: ['business-settings'], revalidate: 3600 }
);

export type BusinessSettings = Awaited<ReturnType<typeof getBusinessSettings>>;
