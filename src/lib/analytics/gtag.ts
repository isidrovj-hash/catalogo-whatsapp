declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Dispara un evento a GA4 y Meta Pixel si están cargados (sección 43).
 * Nunca lanza error si no están configurados — este catálogo debe funcionar
 * igual de bien sin ninguna integración de analítica externa; GA4/Meta
 * Pixel son un complemento opcional, no una dependencia.
 */
export function trackEvent(eventName: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return;

  try {
    window.gtag?.('event', eventName, params);
  } catch {
    // Silenciar: un fallo de analítica externa nunca debe afectar la UX.
  }

  try {
    window.fbq?.('trackCustom', eventName, params);
  } catch {
    // Ver nota anterior.
  }
}

// Wrappers con los nombres de evento estándar de GA4 Enhanced Ecommerce
// (sección 43), para no repetir strings mágicos por todo el código.
export const analytics = {
  viewItem: (params: { item_id: string; item_name: string; price?: number }) => trackEvent('view_item', params),
  search: (searchTerm: string) => trackEvent('search', { search_term: searchTerm }),
  addToCart: (params: { item_id: string; item_name: string; price?: number; quantity?: number }) =>
    trackEvent('add_to_cart', params),
  beginCheckout: (params: { value?: number; num_items?: number }) => trackEvent('begin_checkout', params),
  generateLead: (params: { value?: number; folio?: string }) => trackEvent('generate_lead', params),
  contact: (method: 'whatsapp' | 'phone' | 'email') => trackEvent('contact', { method }),
  whatsappClick: (context: string) => trackEvent('whatsapp_click', { context }),
};
