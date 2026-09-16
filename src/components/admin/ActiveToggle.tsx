'use client';

import { useTransition } from 'react';

interface ActiveToggleProps {
  id: string;
  active: boolean;
  action: (id: string, nextActive: boolean) => Promise<void>;
}

/** Interruptor reutilizado por productos, categorías, promociones y banners para activar/desactivar sin pasar por el formulario completo. */
export function ActiveToggle({ id, active, action }: ActiveToggleProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange() {
    startTransition(() => action(id, !active));
  }

  return (
    <button
      type="button"
      onClick={handleChange}
      disabled={isPending}
      role="switch"
      aria-checked={active}
      aria-label={active ? 'Desactivar' : 'Activar'}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        active ? 'bg-success' : 'bg-surface-border'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          active ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
