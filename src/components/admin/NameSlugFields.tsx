'use client';

import { useState } from 'react';
import { slugify } from '@/lib/slugify';

interface NameSlugFieldsProps {
  defaultName?: string;
  defaultSlug?: string;
}

/**
 * El slug se autogenera a partir del nombre mientras el usuario no haya
 * tocado el campo de slug directamente — en cuanto lo edita a mano, deja de
 * seguir al nombre (para no pisar una URL que el admin ya personalizó).
 */
export function NameSlugFields({ defaultName = '', defaultSlug = '' }: NameSlugFieldsProps) {
  const [name, setName] = useState(defaultName);
  const [slug, setSlug] = useState(defaultSlug);
  const [slugTouched, setSlugTouched] = useState(Boolean(defaultSlug));

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-ink">
          Nombre *
        </label>
        <input
          id="name"
          name="name"
          required
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="slug" className="mb-1 block text-sm font-medium text-ink">
          Slug (URL) *
        </label>
        <input
          id="slug"
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
          className="w-full rounded border border-surface-border px-3 py-2.5 font-mono text-sm focus:border-brand focus:outline-none"
        />
      </div>
    </div>
  );
}
