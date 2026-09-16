'use client';

import { useEffect, useState } from 'react';
import { useFavoritesStore } from '@/store/favoritesStore';

export function FavoritesBadge() {
  const count = useFavoritesStore((state) => state.productIds.length);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const displayCount = mounted ? count : 0;
  if (displayCount === 0) return null;

  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-semibold text-white">
      {displayCount > 99 ? '99+' : displayCount}
    </span>
  );
}
