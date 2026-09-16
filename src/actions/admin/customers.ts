'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdminUser } from '@/lib/auth';
import type { CustomerType } from '@prisma/client';

const VALID_TYPES: CustomerType[] = ['PARTICULAR', 'CONTRATISTA', 'EMPRESA', 'CONSTRUCTOR', 'MAYORISTA', 'OTRO'];

export async function updateCustomer(id: string, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireAdminUser();

  const name = String(formData.get('name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const type = String(formData.get('type') ?? 'PARTICULAR');

  if (!name || !phone) return { ok: false, error: 'Nombre y teléfono son obligatorios.' };
  if (!VALID_TYPES.includes(type as CustomerType)) return { ok: false, error: 'Tipo de cliente inválido.' };

  try {
    await prisma.customer.update({
      where: { id },
      data: {
        name,
        phone,
        company: (formData.get('company') as string) || null,
        email: (formData.get('email') as string) || null,
        city: (formData.get('city') as string) || null,
        neighborhood: (formData.get('neighborhood') as string) || null,
        type: type as CustomerType,
      },
    });
    revalidatePath(`/admin/clientes/${id}`);
    return { ok: true };
  } catch (error) {
    console.error('[admin] Error al actualizar cliente:', error);
    return { ok: false, error: 'Ocurrió un error al actualizar el cliente.' };
  }
}

export async function addCustomerNote(customerId: string, content: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireAdminUser();

  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: 'La nota no puede estar vacía.' };

  try {
    await prisma.customerNote.create({
      data: { customerId, authorId: user.id, content: trimmed },
    });
    revalidatePath(`/admin/clientes/${customerId}`);
    return { ok: true };
  } catch (error) {
    console.error('[admin] Error al agregar nota:', error);
    return { ok: false, error: 'Ocurrió un error al guardar la nota.' };
  }
}

export async function deleteCustomerNote(noteId: string, customerId: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdminUser();
  try {
    await prisma.customerNote.delete({ where: { id: noteId } });
    revalidatePath(`/admin/clientes/${customerId}`);
    return { ok: true };
  } catch (error) {
    console.error('[admin] Error al eliminar nota:', error);
    return { ok: false, error: 'Ocurrió un error al eliminar la nota.' };
  }
}
