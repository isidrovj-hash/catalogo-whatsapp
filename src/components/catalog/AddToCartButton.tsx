'use client';

import { useState, useTransition } from 'react';
import { Check, Plus } from 'lucide-react';
import { useCartStore, type CartItem } from '@/store/cartStore';
import { logAnalyticsEvent } from '@/actions/analytics';
import { analytics } from '@/lib/analytics/gtag';

type AddToCartProduct = Omit<CartItem, 'quantity'>;

export function AddToCartButton({ product, className }: { product: AddToCartProduct; className?: string }) {
  const addItem = useCartStore((state) => state.addItem);
  const [justAdded, setJustAdded] = useState(false);
  const [, startTransition] = useTransition();

  function handleAdd() {
    addItem(product, 1);
    setJustAdded(true);
    startTransition(() => {
      void logAnalyticsEvent('ADD_TO_CART', product.productId);
    });
    analytics.addToCart({
      item_id: product.sku,
      item_name: product.name,
      price: product.promoPrice ?? product.price,
      quantity: 1,
    });
    setTimeout(() => setJustAdded(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      className={className ?? 'btn-primary w-full'}
      aria-live="polite"
    >
      {justAdded ? (
        <>
          <Check className="h-4 w-4" /> Agregado
        </>
      ) : (
        <>
          <Plus className="h-4 w-4" /> Agregar
        </>
      )}
    </button>
  );
}
