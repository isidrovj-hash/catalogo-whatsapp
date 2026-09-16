const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

/**
 * Formatea un valor numérico o Decimal de Prisma como moneda mexicana.
 * Acepta Decimal de Prisma (que llega como objeto con toString/toNumber),
 * string o number, para no romper cuando el valor viene directo de la DB.
 */
export function formatCurrency(value: number | string | { toNumber: () => number } | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const numeric =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? parseFloat(value)
        : value.toNumber();
  if (Number.isNaN(numeric)) return '—';
  return currencyFormatter.format(numeric);
}

export function toNumber(value: number | string | { toNumber: () => number } | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  return value.toNumber();
}
