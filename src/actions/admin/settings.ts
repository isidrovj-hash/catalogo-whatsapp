'use server';

import { revalidateTag, revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdminUser } from '@/lib/auth';

function numberOrNull(value: FormDataEntryValue | null): number | null {
  if (!value || value === '') return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export async function updateBusinessSettings(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireAdminUser();

  const whatsappNumber = String(formData.get('whatsappNumber') ?? '').replace(/\D/g, '');
  const businessName = String(formData.get('businessName') ?? '').trim();

  if (!businessName) return { ok: false, error: 'El nombre del negocio es obligatorio.' };
  if (!whatsappNumber) return { ok: false, error: 'El número de WhatsApp es obligatorio (solo dígitos, formato E.164 sin "+").' };

  const data = {
    businessName,
    logoUrl: (formData.get('logoUrl') as string) || null,
    heroImageUrl: (formData.get('heroImageUrl') as string) || null,
    whatsappNumber,
    whatsappProvider: (formData.get('whatsappProvider') as 'LINK' | 'CLOUD_API') ?? 'LINK',
    phone: (formData.get('phone') as string) || null,
    email: (formData.get('email') as string) || null,
    address: (formData.get('address') as string) || null,
    city: (formData.get('city') as string) || null,
    state: (formData.get('state') as string) || null,
    schedule: (formData.get('schedule') as string) || null,
    facebookUrl: (formData.get('facebookUrl') as string) || null,
    instagramUrl: (formData.get('instagramUrl') as string) || null,
    tiktokUrl: (formData.get('tiktokUrl') as string) || null,
    googleMapsUrl: (formData.get('googleMapsUrl') as string) || null,
    currency: (formData.get('currency') as string) || 'MXN',
    taxRate: numberOrNull(formData.get('taxRate')) ?? 0,
    minPurchaseAmount: numberOrNull(formData.get('minPurchaseAmount')),
    freeShippingAmount: numberOrNull(formData.get('freeShippingAmount')),
    legalText: (formData.get('legalText') as string) || null,
    whatsappMessageBase: (formData.get('whatsappMessageBase') as string) || null,
  };

  try {
    const existing = await prisma.businessSettings.findFirst({ select: { id: true } });

    if (existing) {
      await prisma.businessSettings.update({ where: { id: existing.id }, data });
    } else {
      await prisma.businessSettings.create({ data });
    }

    // `getBusinessSettings()` (FASE 4) cachea con este tag exacto — sin este
    // revalidate, el número de WhatsApp nuevo tardaría hasta 1 hora en
    // reflejarse en el sitio público (el tiempo de `revalidate` configurado).
    revalidateTag('business-settings');
    revalidatePath('/', 'layout');

    return { ok: true };
  } catch (error) {
    console.error('[admin] Error al actualizar configuración:', error);
    return { ok: false, error: 'Ocurrió un error al guardar la configuración.' };
  }
}
