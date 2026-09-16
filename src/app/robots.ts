import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // El panel admin y las páginas de sesión (carrito/cotizar/favoritos)
        // ya llevan `robots: { index: false }` en su metadata individual
        // (FASE 4/9), pero se refuerza aquí también para rastreadores que no
        // respeten el meta tag por página.
        disallow: ['/admin', '/carrito', '/cotizar', '/favoritos', '/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
