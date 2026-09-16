'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdminUser } from '@/lib/auth';

function extractFields(formData: FormData) {
  return {
    name: String(formData.get('name') ?? ''),
    description: (formData.get('description') as string) || null,
    startDate: new Date(String(formData.get('startDate'))),
    endDate: new Date(String(formData.get('endDate'))),
    productId: (formData.get('productId') as string) || null,
    categoryId: (formData.get('categoryId') as string) || null,
    promoPrice: formData.get('promoPrice') ? Number(formData.get('promoPrice')) : null,
    imageUrl: (formData.get('imageUrl') as string) || null,
    active: formData.get('active') === '1',
  };
}

function revalidatePublic() {
  revalidatePath('/ofertas');
  revalidatePath('/productos');
  revalidatePath('/');
}

export async function createPromotion(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireAdminUser();
  const data = extractFields(formData);

  if (!data.name) return { ok: false, error: 'El nombre es obligatorio.' };
  if (isNaN(data.startDate.getTime()) || isNaN(data.endDate.getTime())) {
    return { ok: false, error: 'Fechas inválidas.' };
  }
  if (data.endDate < data.startDate) return { ok: false, error: 'La fecha final debe ser posterior a la fecha de inicio.' };

  try {
    await prisma.promotion.create({ data });
    revalidatePublic();
  } catch (error) {
    console.error('[admin] Error al crear promoción:', error);
    return { ok: false, error: 'Ocurrió un error al crear la promoción.' };
  }

  redirect('/admin/promociones?created=1');
}

export async function updatePromotion(id: string, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireAdminUser();
  const data = extractFields(formData);

  if (!data.name) return { ok: false, error: 'El nombre es obligatorio.' };
  if (data.endDate < data.startDate) return { ok: false, error: 'La fecha final debe ser posterior a la fecha de inicio.' };

  try {
    await prisma.promotion.update({ where: { id }, data });
    revalidatePublic();
    return { ok: true };
  } catch (error) {
    console.error('[admin] Error al actualizar promoción:', error);
    return { ok: false, error: 'Ocurrió un error al actualizar la promoción.' };
  }
}

export async function toggleActivePromotion(id: string, nextActive: boolean): Promise<void> {
  await requireAdminUser();
  await prisma.promotion.update({ where: { id }, data: { active: nextActive } });
  revalidatePublic();
}

export async function deletePromotion(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdminUser();
  try {
    await prisma.promotion.delete({ where: { id } });
    revalidatePublic();
    return { ok: true };
  } catch (error) {
    console.error('[admin] Error al eliminar promoción:', error);
    return { ok: false, error: 'Ocurrió un error al eliminar la promoción.' };
  }
}
