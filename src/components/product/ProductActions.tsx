'use client';

import { useState, useTransition } from 'react';
import { Check, Minus, MessageCircle, Plus, Share2 } from 'lucide-react';
import { useCartStore, type CartItem } from '@/store/cartStore';
import { logAnalyticsEvent } from '@/actions/analytics';
import { analytics } from '@/lib/analytics/gtag';
import { FavoriteButton } from '@/components/catalog/FavoriteButton';

type ProductSummary = Omit<CartItem, 'quantity'>;

interface ProductActionsProps {
  product: ProductSummary;
  whatsappInquiryLink: string;
  isSoldOut: boolean;
  requiresQuoteOnly: boolean; // priceMode === SOLICITAR_PRECIO
  productUrl: string;
  productName: string;
}

export function ProductActions({
  product,
  whatsappInquiryLink,
  isSoldOut,
  requiresQuoteOnly,
  productUrl,
  productName,
}: ProductActionsProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [shareLabel, setShareLabel] = useState<'idle' | 'copied'>('idle');
  const [, startTransition] = useTransition();

  function handleAdd() {
    addItem(product, quantity);
    setJustAdded(true);
    startTransition(() => {
      void logAnalyticsEvent('ADD_TO_CART', product.productId, { quantity, source: 'product_page' });
    });
    analytics.addToCart({
      item_id: product.sku,
      item_name: product.name,
      price: product.promoPrice ?? product.price,
      quantity,
    });
    setTimeout(() => setJustAdded(false), 1500);
  }

  async function handleShare() {
    const shareData = {
      title: productName,
      text: `Mira este producto: ${productName}`,
      url: productUrl,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // El usuario canceló el diálogo de compartir; no es un error real.
      }
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(productUrl);
      setShareLabel('copied');
      setTimeout(() => setShareLabel('idle'), 2000);
    }
  }

  const canAddToCart = !isSoldOut && !requiresQuoteOnly;

  return (
    <div className="space-y-3">
      {canAddToCart && (
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded border border-surface-border">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-11 w-11 items-center justify-center text-ink-soft hover:bg-surface-sunken"
              aria-label="Disminuir cantidad"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="w-14 border-x border-surface-border py-2.5 text-center text-sm focus:outline-none"
              aria-label="Cantidad"
            />
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-11 w-11 items-center justify-center text-ink-soft hover:bg-surface-sunken"
              aria-label="Aumentar cantidad"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button type="button" onClick={handleAdd} className="btn-primary flex-1" aria-live="polite">
            {justAdded ? (
              <>
                <Check className="h-4 w-4" /> Agregado al pedido
              </>
            ) : (
              'Agregar al pedido'
            )}
          </button>
        </div>
      )}

      <div className="flex gap-3">
        {whatsappInquiryLink && (
          <a
            href={whatsappInquiryLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              void logAnalyticsEvent('WHATSAPP_PRODUCT_CLICK', product.productId);
              analytics.whatsappClick('product_page');
            }}
            className={canAddToCart ? 'btn-secondary flex-1 text-success' : 'btn-primary flex-1'}
          >
            <MessageCircle className="h-4 w-4" />
            Cotizar por WhatsApp
          </a>
        )}

        <button type="button" onClick={handleShare} className="btn-secondary" aria-label="Compartir producto">
          <Share2 className="h-4 w-4" />
          {shareLabel === 'copied' ? 'Copiado' : 'Compartir'}
        </button>

        <FavoriteButton productId={product.productId} variant="label" />
      </div>
    </div>
  );
}
