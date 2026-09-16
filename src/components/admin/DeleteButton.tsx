'use client';

import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';

interface DeleteButtonProps {
  id: string;
  action: (id: string) => Promise<{ ok: boolean; error?: string }>;
  confirmMessage?: string;
}

/**
 * Botón de eliminar genérico. Usa `window.confirm` en vez de un modal a
 * medida — para una acción destructiva poco frecuente en un panel interno,
 * es una compensación razonable de complejidad vs. valor; un modal propio
 * puede añadirse después sin cambiar la firma de este componente.
 */
export function DeleteButton({ id, action, confirmMessage = '¿Eliminar este elemento? Esta acción no se puede deshacer.' }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    setError(null);
    startTransition(async () => {
      const result = await action(id);
      if (!result.ok) {
        setError(result.error ?? 'No se pudo eliminar.');
      }
    });
  }

  return (
    <div className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center gap-1 text-xs font-medium text-danger hover:underline disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" /> Eliminar
      </button>
      {error && <p className="mt-1 max-w-[180px] text-right text-[11px] text-danger">{error}</p>}
    </div>
  );
}
