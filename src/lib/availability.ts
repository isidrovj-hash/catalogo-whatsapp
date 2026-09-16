import type { AvailabilityStatus } from '@prisma/client';

export function getAvailabilityLabel(status: AvailabilityStatus | undefined, stock: number | undefined, showExact: boolean | undefined) {
  if (!status) return { text: 'Consultar disponibilidad', className: 'text-ink-soft bg-surface-sunken' };

  if (showExact && typeof stock === 'number' && status !== 'AGOTADO') {
    return { text: `${stock} disponibles`, className: 'text-success bg-success/10' };
  }

  switch (status) {
    case 'DISPONIBLE':
      return { text: 'Disponible', className: 'text-success bg-success/10' };
    case 'POCAS_PIEZAS':
      return { text: 'Pocas piezas', className: 'text-accent bg-accent/10' };
    case 'AGOTADO':
      return { text: 'Agotado', className: 'text-danger bg-danger/10' };
    case 'SOBRE_PEDIDO':
      return { text: 'Sobre pedido', className: 'text-ink-soft bg-surface-sunken' };
    default:
      return { text: 'Consultar disponibilidad', className: 'text-ink-soft bg-surface-sunken' };
  }
}
