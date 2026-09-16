'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tag,
  Award,
  Image as ImageIcon,
  FileText,
  Users,
  Contact,
  Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/productos', label: 'Productos', icon: Package },
  { href: '/admin/categorias', label: 'Categorías', icon: FolderTree },
  { href: '/admin/marcas', label: 'Marcas', icon: Award },
  { href: '/admin/promociones', label: 'Promociones', icon: Tag },
  { href: '/admin/banners', label: 'Banners', icon: ImageIcon },
  { href: '/admin/cotizaciones', label: 'Cotizaciones', icon: FileText },
  { href: '/admin/prospectos', label: 'Prospectos', icon: Users },
  { href: '/admin/clientes', label: 'Clientes', icon: Contact },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors ${
              isActive ? 'bg-brand-soft text-brand' : 'text-ink-soft hover:bg-surface-sunken hover:text-ink'
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
