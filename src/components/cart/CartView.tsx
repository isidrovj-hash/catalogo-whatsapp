'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Minus, Plus, Share2, ShoppingBag, Trash2 } from 'lucide-react';
import { useCartStore, getCartSubtotal } from '@/store/cartStore';
import { formatCurrency } from '@/lib/format';
import { buildCartShareText } from '@/lib/cartShare';
import { logAnalyticsEvent } from '@/actions/analytics';
import type { MiniProduct } from '@/actions/products';
import { MiniProductCard } from '@/components/catalog/MiniProductCard';
import { CrossSellSuggestions } from './CrossSellSuggestions';

interface CartViewProps {
  /** Productos destacados para sugerir cuando el carrito está vacío. */
  featuredFallback?: MiniProduct[];
}

export function CartView({ featuredFallback = [] }: CartViewProps) {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const [shareLabel, setShareLabel] = useState<'idle' | 'copied'>('idle');

  if (items.length === 0) {
    return (
      <div>
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-surface-border py-16 text-center">
          <ShoppingBag className="h-10 w-10 text-ink-soft/40" />
          <p className="font-medium text-ink">Tu carrito está vacío.</p>
          <Link href="/productos" className="btn-primary">
            Ver productos
          </Link>
        </div>

        {featuredFallback.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-semibold text-ink">Productos populares</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {featuredFallback.map((product) => (
                <MiniProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  const subtotal = getCartSubtotal(items);

  async function handleShareCart() {
    const text = buildCartShareText(items);
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Mi lista de materiales', text });
      } catch {
        // Cancelado por el usuario, no es un error.
      }
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setShareLabel('copied');
      setTimeout(() => setShareLabel('idle'), 2000);
    }
  }

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-lg border border-surface-border bg-white">
            {items.map((item) => {
              const unitPrice = item.promoPrice ?? item.price;
              return (
                <div key={item.productId} className="flex gap-3 border-b border-surface-border p-4 last:border-b-0">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-surface-sunken">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>

                  <div className="flex-1">
                    <Link href={`/productos/${item.slug}`} className="text-sm font-semibold text-ink hover:text-brand">
                      {item.name}
                    </Link>
                    <p className="text-xs text-ink-soft">
                      {item.sku} · {item.presentation}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-ink">{formatCurrency(unitPrice)}</p>

                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center rounded border border-surface-border">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center text-ink-soft hover:bg-surface-sunken"
                          aria-label={`Disminuir cantidad de ${item.name}`}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center text-ink-soft hover:bg-surface-sunken"
                          aria-label={`Aumentar cantidad de ${item.name}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          removeItem(item.productId);
                          void logAnalyticsEvent('REMOVE_FROM_CART', item.productId);
                        }}
                        className="flex items-center gap-1 text-xs font-medium text-danger hover:underline"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Eliminar
                      </button>
                    </div>
                  </div>

                  <p className="w-24 shrink-0 text-right text-sm font-semibold text-ink">
                    {formatCurrency(unitPrice * item.quantity)}
                  </p>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleShareCart}
            className="btn-secondary mt-4 w-full sm:w-auto"
          >
            <Share2 className="h-4 w-4" />
            {shareLabel === 'copied' ? 'Lista copiada' : 'Compartir pedido'}
          </button>
        </div>

        <div className="h-fit rounded-lg border border-surface-border bg-white p-5">
          <h2 className="mb-4 font-display text-lg text-ink">Resumen</h2>
          <div className="flex items-center justify-between text-sm text-ink-soft">
            <span>Subtotal estimado</span>
            <span className="text-lg font-bold text-ink">{formatCurrency(subtotal)}</span>
          </div>
          <p className="mt-2 text-xs text-ink-soft">Precio sujeto a confirmación.</p>

          <Link href="/cotizar" className="btn-primary mt-5 w-full">
            Solicitar cotización
          </Link>
        </div>
      </div>

      <CrossSellSuggestions cartProductIds={items.map((item) => item.productId)} />
    </div>
  );
}
