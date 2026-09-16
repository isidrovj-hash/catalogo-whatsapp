'use server';

import { revalidateTag, revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdminUser } from '@/lib/auth';

function extractFields(formData: FormData) {
  return {
    name: String(formData.get('name') ?? ''),
    slug: String(formData.get('slug') ?? ''),
    description: (formData.get('description') as string) || null,
    parentId: (formData.get('parentId') as string) || null,
    imageUrl: (formData.get('imageUrl') as string) || null,
    sortOrder: Number(formData.get('sortOrder') ?? 0),
    active: formData.get('active') === '1',
  };
}

function revalidateCategories() {
  revalidateTag('categories');
  revalidatePath('/categorias');
  revalidatePath('/productos');
  revalidatePath('/');
}

export async function createCategory(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireAdminUser();
  const data = extractFields(formData);

  if (!data.name || !data.slug) return { ok: false, error: 'Nombre y slug son obligatorios.' };

  let categoryId: string;
  try {
    const category = await prisma.category.create({ data });
    revalidateCategories();
    categoryId = category.id;
  } catch (error: any) {
    if (error?.code === 'P2002') return { ok: false, error: 'Ya existe una categoría con ese slug.' };
    console.error('[admin] Error al crear categoría:', error);
    return { ok: false, error: 'Ocurrió un error al crear la categoría.' };
  }

  redirect(`/admin/categorias/${categoryId}/editar?created=1`);
}

export async function updateCategory(id: string, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireAdminUser();
  const data = extractFields(formData);

  if (!data.name || !data.slug) return { ok: false, error: 'Nombre y slug son obligatorios.' };
  if (data.parentId === id) return { ok: false, error: 'Una categoría no puede ser su propia subcategoría.' };

  try {
    await prisma.category.update({ where: { id }, data });
    revalidateCategories();
    return { ok: true };
  } catch (error: any) {
    if (error?.code === 'P2002') return { ok: false, error: 'Ya existe otra categoría con ese slug.' };
    console.error('[admin] Error al actualizar categoría:', error);
    return { ok: false, error: 'Ocurrió un error al actualizar la categoría.' };
  }
}

export async function toggleCategoryActive(id: string, nextActive: boolean): Promise<void> {
  await requireAdminUser();
  await prisma.category.update({ where: { id }, data: { active: nextActive } });
  revalidateCategories();
}

export async function deleteCategory(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdminUser();
  try {
    await prisma.category.delete({ where: { id } });
    revalidateCategories();
    return { ok: true };
  } catch (error: any) {
    if (error?.code === 'P2003' || error?.code === 'P2014') {
      return { ok: false, error: 'No se puede eliminar: tiene productos o subcategorías asociadas. Desactívala en su lugar.' };
    }
    console.error('[admin] Error al eliminar categoría:', error);
    return { ok: false, error: 'Ocurrió un error al eliminar la categoría.' };
  }
}
