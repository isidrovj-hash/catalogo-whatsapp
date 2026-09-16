import { requireAdminUser } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { LogoutButton } from '@/components/admin/LogoutButton';

export const metadata = {
  robots: { index: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminUser();

  return (
    <div className="flex min-h-screen bg-surface-sunken">
      <aside className="hidden w-60 shrink-0 border-r border-surface-border bg-white lg:block">
        <div className="border-b border-surface-border p-4">
          <p className="font-display text-lg text-ink">Panel admin</p>
        </div>
        <AdminSidebar />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-surface-border bg-white px-4 py-3 lg:px-6">
          {/* En móvil, la navegación del panel admin se resuelve navegando directo por URL;
              el admin es una herramienta interna, no la experiencia mobile-first del catálogo público. */}
          <p className="font-display text-base text-ink lg:hidden">Panel admin</p>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-ink-soft">{user.name} · {user.role}</span>
            <LogoutButton />
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
