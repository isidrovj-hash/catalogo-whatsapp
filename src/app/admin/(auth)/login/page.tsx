import type { Metadata } from 'next';
import { LoginForm } from '@/components/admin/LoginForm';

export const metadata: Metadata = {
  title: 'Acceso administrador',
  robots: { index: false },
};

export default function AdminLoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-sunken px-4">
      <h1 className="mb-6 font-display text-2xl text-ink">Panel administrativo</h1>
      {searchParams.error === 'sin_acceso' && (
        <p className="mb-4 max-w-sm rounded border border-danger/30 bg-danger/5 px-4 py-2 text-center text-sm text-danger">
          Tu cuenta no tiene acceso al panel. Contacta al administrador del sistema.
        </p>
      )}
      <LoginForm />
    </div>
  );
}
