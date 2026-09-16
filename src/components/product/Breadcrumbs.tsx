import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbsProps {
  categoryName: string;
  categorySlug: string;
  productName: string;
}

export function Breadcrumbs({ categoryName, categorySlug, productName }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-xs text-ink-soft">
      <Link href="/" className="hover:text-brand">
        Inicio
      </Link>
      <ChevronRight className="h-3 w-3" />
      <Link href="/productos" className="hover:text-brand">
        Productos
      </Link>
      <ChevronRight className="h-3 w-3" />
      <Link href={`/categorias/${categorySlug}`} className="hover:text-brand">
        {categoryName}
      </Link>
      <ChevronRight className="h-3 w-3" />
      <span className="text-ink">{productName}</span>
    </nav>
  );
}
