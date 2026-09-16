import Script from 'next/script';

/**
 * Solo se renderiza en `app/(public)/layout.tsx` — el panel /admin nunca
 * carga estos scripts. No tiene sentido exponer analítica de marketing
 * pensada para clientes del catálogo dentro de una herramienta interna, y
 * evita ruido de eventos de admin mezclado con el comportamiento real de
 * compradores.
 *
 * Ambas integraciones son 100% opcionales: si `NEXT_PUBLIC_GA4_ID` o
 * `NEXT_PUBLIC_META_PIXEL_ID` no están definidas, simplemente no se
 * inyecta nada — el catálogo funciona igual sin ellas (sección 43).
 */
export function AnalyticsScripts() {
  const ga4Id = process.env.NEXT_PUBLIC_GA4_ID;
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <>
      {ga4Id && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga4Id}');
            `}
          </Script>
        </>
      )}

      {metaPixelId && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${metaPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}
