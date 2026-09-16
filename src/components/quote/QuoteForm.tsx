'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import { useCartStore, getCartSubtotal } from '@/store/cartStore';
import { formatCurrency } from '@/lib/format';
import { submitQuote, logQuoteStarted } from '@/actions/quote';
import { analytics } from '@/lib/analytics/gtag';

const CUSTOMER_TYPES = [
  { value: 'PARTICULAR', label: 'Particular' },
  { value: 'CONTRATISTA', label: 'Contratista' },
  { value: 'EMPRESA', label: 'Empresa' },
  { value: 'CONSTRUCTOR', label: 'Constructor' },
  { value: 'MAYORISTA', label: 'Mayorista' },
  { value: 'OTRO', label: 'Otro' },
] as const;

export function QuoteForm() {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clear);

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [customerType, setCustomerType] = useState<(typeof CUSTOMER_TYPES)[number]['value']>('PARTICULAR');
  const [comments, setComments] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmation, setConfirmation] = useState<{ folio: string; whatsappLink: string } | null>(null);

  // Registra "quote_started" una sola vez, al abrir el formulario con
  // productos en el carrito — no cuando el carrito está vacío (eso no es
  // realmente un intento de cotizar).
  useEffect(() => {
    if (items.length > 0) {
      void logQuoteStarted();
      analytics.beginCheckout({ value: getCartSubtotal(items), num_items: items.length });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (confirmation) {
    return (
      <div className="mx-auto max-w-md rounded-lg border border-success/30 bg-success/5 p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
        <h2 className="mt-3 font-display text-2xl text-ink">¡Cotización registrada!</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Tu folio es <span className="font-mono font-bold text-ink">{confirmation.folio}</span>. Guárdalo para dar
          seguimiento a tu pedido.
        </p>

        {confirmation.whatsappLink ? (
          <a href={confirmation.whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-primary mt-5 w-full">
            <MessageCircle className="h-4 w-4" /> Abrir WhatsApp
          </a>
        ) : (
          <p className="mt-5 rounded border border-accent/30 bg-accent-soft px-3 py-2 text-xs text-ink">
            No pudimos abrir WhatsApp automáticamente, pero tu cotización ya quedó registrada. Contáctanos directamente
            mencionando tu folio.
          </p>
        )}

        <Link href="/productos" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
          Seguir comprando
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-surface-border py-16 text-center">
        <p className="font-medium text-ink">Tu carrito está vacío.</p>
        <Link href="/productos" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
          Ver productos
        </Link>
      </div>
    );
  }

  const subtotal = getCartSubtotal(items);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !phone.trim()) {
      setError('Nombre y teléfono son obligatorios.');
      return;
    }

    startTransition(async () => {
      const result = await submitQuote({
        customerName: name,
        company,
        customerPhone: phone,
        email,
        city,
        neighborhood,
        customerType,
        comments,
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.promoPrice ?? item.price,
        })),
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (result.whatsappLink) {
        window.open(result.whatsappLink, '_blank', 'noopener,noreferrer');
      }
      analytics.generateLead({ value: subtotal, folio: result.folio });
      clearCart();
      setConfirmation({ folio: result.folio, whatsappLink: result.whatsappLink });
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form onSubmit={handleSubmit} className="space-y-4 lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-ink">
              Nombre *
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="company" className="mb-1 block text-sm font-medium text-ink">
              Empresa
            </label>
            <input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-ink">
              Teléfono *
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink">
              Correo
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="city" className="mb-1 block text-sm font-medium text-ink">
              Ciudad / Municipio
            </label>
            <input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="neighborhood" className="mb-1 block text-sm font-medium text-ink">
              Colonia
            </label>
            <input
              id="neighborhood"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="customerType" className="mb-1 block text-sm font-medium text-ink">
            Tipo de cliente
          </label>
          <select
            id="customerType"
            value={customerType}
            onChange={(e) => setCustomerType(e.target.value as typeof customerType)}
            className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none sm:w-64"
          >
            {CUSTOMER_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="comments" className="mb-1 block text-sm font-medium text-ink">
            Comentarios
          </label>
          <textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
            placeholder="Indícanos cualquier información adicional sobre tu pedido."
            className="w-full rounded border border-surface-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button type="submit" disabled={isPending} className="btn-primary w-full sm:w-auto">
          <MessageCircle className="h-4 w-4" />
          {isPending ? 'Generando cotización...' : 'Enviar cotización por WhatsApp'}
        </button>
      </form>

      <div className="h-fit rounded-lg border border-surface-border bg-white p-5">
        <h2 className="mb-3 font-display text-lg text-ink">Tu pedido</h2>
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li key={item.productId} className="flex justify-between gap-2 text-ink-soft">
              <span>
                {item.quantity} × {item.name}
              </span>
              <span className="shrink-0 font-medium text-ink">{formatCurrency((item.promoPrice ?? item.price) * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-surface-border pt-3 text-sm font-bold text-ink">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
      </div>
    </div>
  );
}
