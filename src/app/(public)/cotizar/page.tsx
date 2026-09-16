import type { Metadata } from 'next';
import { QuoteForm } from '@/components/quote/QuoteForm';

export const metadata: Metadata = {
  title: 'Cotizar',
  robots: { index: false },
};

export default function QuotePage() {
  return (
    <div className="container-app py-8">
      <h1 className="mb-1 text-3xl text-ink">Solicitar cotización</h1>
      <p className="mb-6 text-sm text-ink-soft">Completa tus datos y enviaremos tu pedido directamente por WhatsApp.</p>
      <QuoteForm />
    </div>
  );
}
