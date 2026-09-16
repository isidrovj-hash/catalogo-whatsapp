'use client';

import { useRef, useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { addCustomerNote, deleteCustomerNote } from '@/actions/admin/customers';

export interface CustomerNoteData {
  id: string;
  content: string;
  createdAt: string; // ISO, ya formateado por el server component padre
  authorName: string | null;
}

const dateFormatter = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' });

export function CustomerNotes({ customerId, notes }: { customerId: string; notes: CustomerNoteData[] }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const content = String(formData.get('content') ?? '');

    startTransition(async () => {
      const result = await addCustomerNote(customerId, content);
      if (!result.ok) {
        setError(result.error ?? 'Ocurrió un error.');
      } else {
        formRef.current?.reset();
      }
    });
  }

  function handleDelete(noteId: string) {
    if (!window.confirm('¿Eliminar esta nota?')) return;
    startTransition(() => {
      void deleteCustomerNote(noteId, customerId);
    });
  }

  return (
    <div className="rounded-lg border border-surface-border bg-white p-5">
      <h2 className="mb-3 font-display text-lg text-ink">Notas y seguimiento</h2>

      <form ref={formRef} onSubmit={handleSubmit} className="mb-4 space-y-2">
        <textarea
          name="content"
          rows={2}
          required
          placeholder="Ej. Prefiere que le hablen después de las 5pm. Interesado en volumen para obra completa."
          className="w-full rounded border border-surface-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        <button type="submit" disabled={isPending} className="btn-secondary text-xs">
          {isPending ? 'Guardando...' : 'Agregar nota'}
        </button>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-ink-soft">Sin notas todavía.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded border border-surface-border bg-surface-sunken p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-ink">{note.content}</p>
                <button
                  type="button"
                  onClick={() => handleDelete(note.id)}
                  className="shrink-0 text-ink-soft hover:text-danger"
                  aria-label="Eliminar nota"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-1 text-[11px] text-ink-soft">
                {dateFormatter.format(new Date(note.createdAt))}
                {note.authorName ? ` · ${note.authorName}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
