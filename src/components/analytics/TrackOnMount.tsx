'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics/gtag';

/**
 * Puente entre Server Components (que ya registran el evento real en
 * `analytics_events` vía Server Action) y GA4/Meta Pixel (que solo pueden
 * dispararse desde el navegador). Se renderiza sin salida visual — un único
 * `useEffect` que corre una vez por carga de página.
 */
export function TrackOnMount({ event, params }: { event: string; params?: Record<string, unknown> }) {
  useEffect(() => {
    trackEvent(event, params);
    // Se dispara solo al montar; no se re-ejecuta si `params` cambia de
    // identidad entre renders (evitaría duplicar el evento).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
