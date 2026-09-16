'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdminUser } from '@/lib/auth';
import type { LeadStatus } from '@prisma/client';

const VALID_STATUSES: LeadStatus[] = ['NUEVO', 'CONTACTADO', 'COTIZADO', 'SEGUIMIENTO', 'GANADO', 'PERDIDO'];

export async function updateLeadStatus(id: string, status: string): Promise<void> {
  await requireAdminUser();
  if (!VALID_STATUSES.includes(status as LeadStatus)) return;
  await prisma.lead.update({ where: { id }, data: { status: status as LeadStatus } });
  revalidatePath('/admin/prospectos');
}
