'use client';

import { useTransition } from 'react';
import { updateLeadStatus } from '@/actions/admin/leads';

const STATUS_OPTIONS = [
  { value: 'NUEVO', label: 'Nuevo' },
  { value: 'CONTACTADO', label: 'Contactado' },
  { value: 'COTIZADO', label: 'Cotizado' },
  { value: 'SEGUIMIENTO', label: 'Seguimiento' },
  { value: 'GANADO', label: 'Ganado' },
  { value: 'PERDIDO', label: 'Perdido' },
];

const STATUS_COLORS: Record<string, string> = {
  NUEVO: 'text-brand',
  CONTACTADO: 'text-ink',
  COTIZADO: 'text-ink',
  SEGUIMIENTO: 'text-accent',
  GANADO: 'text-success',
  PERDIDO: 'text-danger',
};

export function LeadStatusSelect({ leadId, status }: { leadId: string; status: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={isPending}
      onChange={(e) => startTransition(() => updateLeadStatus(leadId, e.target.value))}
      className={`rounded border border-surface-border px-2 py-1.5 text-xs font-semibold focus:border-brand focus:outline-none ${STATUS_COLORS[status] ?? 'text-ink'}`}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
