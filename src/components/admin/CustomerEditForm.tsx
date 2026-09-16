'use client';

import { useState, useTransition } from 'react';
import { updateCustomer } from '@/actions/admin/customers';

const CUSTOMER_TYPES = [
  { value: 'PARTICULAR', label: 'Particular' },
  { value: 'CONTRATISTA', label: 'Contratista' },
  { value: 'EMPRESA', label: 'Empresa' },
  { value: 'CONSTRUCTOR', label: 'Constructor' },
  { value: 'MAYORISTA', label: 'Mayorista' },
  { value: 'OTRO', label: 'Otro' },
];

export interface CustomerFormDefaults {
  name: string;
  company: string | null;
  phone: string;
  email: string | null;
  city: string | null;
  neighborhood: string | null;
  type: string;
}

export function CustomerEditForm({ customerId, defaults }: { customerId: string; defaults: CustomerFormDefaults }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateCustomer(customerId, formData);
      if (!result.ok) setError(result.error ?? 'Ocurrió un error.');
      else setSuccess(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-surface-border bg-white p-5">
      <h2 className="mb-1 font-display text-lg text-ink">Datos del cliente</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1 block text-xs font-medium text-ink-soft">Nombre *</label>
          <input id="name" name="name" required defaultValue={defaults.name} className="w-full rounded border border-surface-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1 block text-xs font-medium text-ink-soft">Teléfono *</label>
          <input id="phone" name="phone" required defaultValue={defaults.phone} className="w-full rounded border border-surface-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
        </div>
        <div>
          <label htmlFor="company" className="mb-1 block text-xs font-medium text-ink-soft">Empresa</label>
          <input id="company" name="company" defaultValue={defaults.company ?? undefined} className="w-full rounded border border-surface-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-xs font-medium text-ink-soft">Correo</label>
          <input id="email" name="email" type="email" defaultValue={defaults.email ?? undefined} className="w-full rounded border border-surface-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
        </div>
        <div>
          <label htmlFor="city" className="mb-1 block text-xs font-medium text-ink-soft">Ciudad</label>
          <input id="city" name="city" defaultValue={defaults.city ?? undefined} className="w-full rounded border border-surface-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
        </div>
        <div>
          <label htmlFor="neighborhood" className="mb-1 block text-xs font-medium text-ink-soft">Colonia</label>
          <input id="neighborhood" name="neighborhood" defaultValue={defaults.neighborhood ?? undefined} className="w-full rounded border border-surface-border px-3 py-2 text-sm focus:border-brand focus:outline-none" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="type" className="mb-1 block text-xs font-medium text-ink-soft">Tipo de cliente</label>
          <select id="type" name="type" defaultValue={defaults.type} className="w-full max-w-xs rounded border border-surface-border px-3 py-2 text-sm focus:border-brand focus:outline-none">
            {CUSTOMER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}
      {success && <p className="text-xs text-success">Guardado.</p>}

      <button type="submit" disabled={isPending} className="btn-secondary text-xs">
        {isPending ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  );
}
