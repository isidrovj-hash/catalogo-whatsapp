import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  basePath: string;
  currentParams: Record<string, string | undefined>;
  page: number;
  totalPages: number;
}

function buildHref(basePath: string, params: Record<string, string | undefined>, page: number) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  search.set('page', String(page));
  return `${basePath}?${search.toString()}`;
}

export function Pagination({ basePath, currentParams, page, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Paginación de resultados">
      <Link
        href={buildHref(basePath, currentParams, Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={`flex h-9 w-9 items-center justify-center rounded border border-surface-border ${page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-surface-sunken'}`}
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>

      <span className="px-3 text-sm text-ink-soft">
        Página {page} de {totalPages}
      </span>

      <Link
        href={buildHref(basePath, currentParams, Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={`flex h-9 w-9 items-center justify-center rounded border border-surface-border ${page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-surface-sunken'}`}
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
