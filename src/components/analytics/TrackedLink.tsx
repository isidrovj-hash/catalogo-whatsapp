'use client';

import type { AnchorHTMLAttributes } from 'react';
import { analytics } from '@/lib/analytics/gtag';

interface TrackedLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  event: 'whatsapp' | 'phone' | 'email';
  context: string;
}

/**
 * Envoltorio delgado sobre <a>: dispara el evento de analítica externa
 * correspondiente (GA4/Meta Pixel) sin bloquear ni retrasar la navegación
 * real — el registro interno en `analytics_events` (base de datos) sigue
 * ocurriendo por separado vía Server Actions donde ya existía.
 */
export function TrackedLink({ event, context, onClick, children, ...anchorProps }: TrackedLinkProps) {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (event === 'whatsapp') analytics.whatsappClick(context);
    else analytics.contact(event);
    onClick?.(e);
  }

  return (
    <a {...anchorProps} onClick={handleClick}>
      {children}
    </a>
  );
}
