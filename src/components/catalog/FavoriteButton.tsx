'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useFavoritesStore } from '@/store/favoritesStore';

interface FavoriteButtonProps {
  productId: string;
  /** "icon": solo el corazón, para la esquina de la tarjeta. "label": corazón + texto "GUARDAR", para la ficha de producto. */
  variant?: 'icon' | 'label';
}

export function FavoriteButton({ productId, variant = 'icon' }: FavoriteButtonProps) {
  const toggle = useFavoritesStore((state) => state.toggle);
  const isFavorite = useFavoritesStore((state) => state.isFavorite(productId));
  const [mounted, setMounted] = useState(false);

  // Igual que CartBadge: el estado real de "favorito" solo existe en el
  // cliente (localStorage), así que se evita el mismatch de hidratación
  // renderizando el estado "no guardado" hasta montar.
  useEffect(() => setMounted(true), []);
  const active = mounted && isFavorite;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(productId);
  }

  if (variant === 'label') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={active}
        className={`btn-secondary ${active ? 'border-brand text-brand' : ''}`}
      >
        <Heart className={`h-4 w-4 ${active ? 'fill-brand text-brand' : ''}`} />
        {active ? 'Guardado' : 'Guardar'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={active ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink-soft shadow-sm backdrop-blur transition-colors hover:text-brand"
    >
      <Heart className={`h-4 w-4 ${active ? 'fill-brand text-brand' : ''}`} />
    </button>
  );
}
