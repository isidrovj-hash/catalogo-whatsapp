'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdminUser } from '@/lib/auth';

function extractFields(formData: FormData) {
  return {
    title: String(formData.get('title') ?? ''),
    subtitle: (formData.get('subtitle') as string) || null,
    imageUrl: String(formData.get('imageUrl') ?? ''),
    linkUrl: (formData.get('linkUrl') as string) || null,
    sortOrder: Number(formData.get('sortOrder') ?? 0),
    active: formData.get('active') === '1',
  };
}

function revalidatePublic() {
  revalidatePath('/');
}

export async function createBanner(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireAdminUser();
  const data = extractFields(formData);
  if (!data.title || !data.imageUrl) return { ok: false, error: 'Título e imagen son obligatorios.' };

  try {
    await prisma.banner.create({ data });
    revalidatePublic();
  } catch (error) {
    console.error('[admin] Error al crear banner:', error);
    return { ok: false, error: 'Ocurrió un error al crear el banner.' };
  }

  redirect('/admin/banners?created=1');
}

export async function updateBanner(id: string, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireAdminUser();
  const data = extractFields(formData);
  if (!data.title || !data.imageUrl) return { ok: false, error: 'Título e imagen son obligatorios.' };

  try {
    await prisma.banner.update({ where: { id }, data });
    revalidatePublic();
    return { ok: true };
  } catch (error) {
    console.error('[admin] Error al actualizar banner:', error);
    return { ok: false, error: 'Ocurrió un error al actualizar el banner.' };
  }
}

export async function toggleActiveBanner(id: string, nextActive: boolean): Promise<void> {
  await requireAdminUser();
  await prisma.banner.update({ where: { id }, data: { active: nextActive } });
  revalidatePublic();
}

export async function deleteBanner(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdminUser();
  try {
    await prisma.banner.delete({ where: { id } });
    revalidatePublic();
    return { ok: true };
  } catch (error) {
    console.error('[admin] Error al eliminar banner:', error);
    return { ok: false, error: 'Ocurrió un error al eliminar el banner.' };
  }
}
