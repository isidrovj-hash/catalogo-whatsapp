'use client';

import { useEffect, useState } from 'react';
import { useCartStore, getCartTotalItems } from '@/store/cartStore';

/**
 * El contador del carrito solo puede conocerse en el cliente (localStorage),
 * así que renderiza 0 en el primer paint del servidor y se actualiza tras la
 * hidratación. Esto evita un mismatch de hidratación entre servidor y
 * cliente en vez de forzarlo con supresión de warnings.
 */
export function CartBadge() {
  const items = useCartStore((state) => state.items);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const count = mounted ? getCartTotalItems(items) : 0;

  if (count === 0) return null;

  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-semibold text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}
