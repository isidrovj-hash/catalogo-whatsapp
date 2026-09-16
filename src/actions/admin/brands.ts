'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdminUser } from '@/lib/auth';

function extractFields(formData: FormData) {
  return {
    name: String(formData.get('name') ?? ''),
    slug: String(formData.get('slug') ?? ''),
    logoUrl: (formData.get('logoUrl') as string) || null,
    active: formData.get('active') === '1',
  };
}

function revalidatePublic() {
  revalidatePath('/productos');
}

export async function createBrand(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireAdminUser();
  const data = extractFields(formData);

  if (!data.name || !data.slug) return { ok: false, error: 'Nombre y slug son obligatorios.' };

  try {
    await prisma.brand.create({ data });
    revalidatePublic();
  } catch (error: any) {
    if (error?.code === 'P2002') return { ok: false, error: 'Ya existe una marca con ese nombre o slug.' };
    console.error('[admin] Error al crear marca:', error);
    return { ok: false, error: 'Ocurrió un error al crear la marca.' };
  }

  // `redirect()` funciona lanzando una señal especial que Next.js intercepta
  // para navegar — por eso va FUERA del try/catch: si estuviera adentro, el
  // catch de arriba la atraparía como si fuera un error real (bug corregido
  // en esta misma pasada en products.ts, categories.ts, promotions.ts y
  // banners.ts, que tenían el mismo patrón).
  redirect('/admin/marcas?created=1');
}

export async function updateBrand(id: string, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireAdminUser();
  const data = extractFields(formData);

  if (!data.name || !data.slug) return { ok: false, error: 'Nombre y slug son obligatorios.' };

  try {
    await prisma.brand.update({ where: { id }, data });
    revalidatePublic();
    return { ok: true };
  } catch (error: any) {
    if (error?.code === 'P2002') return { ok: false, error: 'Ya existe otra marca con ese nombre o slug.' };
    console.error('[admin] Error al actualizar marca:', error);
    return { ok: false, error: 'Ocurrió un error al actualizar la marca.' };
  }
}

export async function toggleBrandActive(id: string, nextActive: boolean): Promise<void> {
  await requireAdminUser();
  await prisma.brand.update({ where: { id }, data: { active: nextActive } });
  revalidatePublic();
}

export async function deleteBrand(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdminUser();
  try {
    await prisma.brand.delete({ where: { id } });
    revalidatePublic();
    return { ok: true };
  } catch (error: any) {
    if (error?.code === 'P2003' || error?.code === 'P2014') {
      return { ok: false, error: 'No se puede eliminar: hay productos usando esta marca. Desactívala en su lugar.' };
    }
    console.error('[admin] Error al eliminar marca:', error);
    return { ok: false, error: 'Ocurrió un error al eliminar la marca.' };
  }
}
