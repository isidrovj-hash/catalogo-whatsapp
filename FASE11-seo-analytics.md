# FASE 11 — SEO / ANALYTICS

## Qué se construyó

```
src/app/
├── sitemap.ts                          # Sitemap dinámico (productos + categorías activos)
└── robots.ts                           # robots.txt dinámico

src/lib/
├── schema.ts                           # + buildLocalBusinessJsonLd, + buildBreadcrumbJsonLd
└── analytics/
    └── gtag.ts                         # Helpers seguros para GA4 / Meta Pixel

src/components/analytics/
├── AnalyticsScripts.tsx                # Carga condicional de GA4/Meta Pixel (solo en el sitio público)
├── TrackedLink.tsx                     # <a> con evento de analítica externa adjunto
└── TrackOnMount.tsx                    # Dispara un evento una vez al montar (view_item, search, begin_checkout)
```

Más ediciones a: `(public)/page.tsx`, `(public)/productos/[slug]/page.tsx`, `(public)/productos/page.tsx`, `(public)/layout.tsx`, `AddToCartButton.tsx`, `ProductActions.tsx`, `ProductCard.tsx`, `Header.tsx`, `WhatsAppFloat.tsx`, `BottomNav.tsx`, `contacto/page.tsx`, `QuoteForm.tsx`, `CartView.tsx`, `.env.example`, `env.ts`.

## SEO técnico (sección 26)

**Sitemap dinámico, no un archivo estático que se desactualiza.** `app/sitemap.ts` consulta productos y categorías activos en cada generación — cuando el admin publica un producto nuevo desde el panel (FASE 9), aparece en el sitemap sin que nadie tenga que tocar un archivo. Incluye `lastModified` real (`updatedAt` de la base de datos), lo que ayuda a Google a re-rastrear solo lo que cambió.

**`robots.ts` bloquea explícitamente** `/admin`, `/carrito`, `/cotizar`, `/favoritos` y `/api/` — páginas que no tiene sentido que aparezcan en resultados de búsqueda (ya llevaban `robots: { index: false }` en su metadata individual desde fases anteriores; esto es una segunda capa de refuerzo para rastreadores que no respeten el meta tag).

**Schema.org completo:** además del `Product` (FASE 5), ahora la home incluye `LocalBusiness` (dirección, teléfono, logo — ayuda a aparecer en Google Maps y búsquedas locales) y la ficha de producto incluye `BreadcrumbList` (la ruta de navegación que Google puede mostrar directamente en el resultado de búsqueda, en vez de solo la URL).

## Analítica externa: opcional de verdad, no solo "opcional en el papel"

Esto era importante hacerlo bien: **el catálogo no debe depender de GA4 o Meta Pixel para funcionar.** `AnalyticsScripts.tsx` no renderiza absolutamente nada si `NEXT_PUBLIC_GA4_ID`/`NEXT_PUBLIC_META_PIXEL_ID` no están en el `.env`, y `lib/analytics/gtag.ts` envuelve cada llamada en `try/catch` silencioso — si `window.gtag` no existe (porque no se cargó el script), nada truena.

**Decisión de privacidad/arquitectura:** `AnalyticsScripts` se monta únicamente en `app/(public)/layout.tsx`, nunca en `app/admin`. No tiene sentido mezclar el comportamiento de un administrador operando el panel con el comportamiento real de compradores — eso ensuciaría cualquier reporte de conversión en GA4/Meta Ads.

**Los eventos de GA4 Enhanced Ecommerce ya están conectados** (sección 43), usando los nombres estándar que Google Ads y Meta Ads reconocen automáticamente para optimizar campañas:

| Evento GA4 | Dónde se dispara |
|---|---|
| `view_item` | Al abrir una ficha de producto |
| `search` | Al ver resultados de `/productos?q=...` |
| `add_to_cart` | Botón "Agregar" (tarjeta de catálogo y ficha de producto) |
| `begin_checkout` | Al abrir `/cotizar` con productos en el carrito |
| `generate_lead` | Al completar una cotización exitosamente |
| `contact` | Click en teléfono o correo (página de Contacto) |
| `whatsapp_click` | **Todos** los puntos de contacto de WhatsApp: header, botón flotante, nav inferior móvil, tarjetas de catálogo, ficha de producto, contacto |

## Los 9 eventos internos de la sección 25, completos

Con esta fase se cierra el último evento que faltaba: `REMOVE_FROM_CART`, ahora registrado en `CartView.tsx` cada vez que se elimina un producto del carrito. La tabla `analytics_events` (FASE 2) y el dashboard de "productos más consultados/agregados" (FASE 9) ya tenían la infraestructura lista desde antes — esta fase solo terminó de conectar el cableado que faltaba.

**Nota de diseño que vale la pena repetir:** los eventos internos (`analytics_events` en Postgres) y los eventos externos (GA4/Meta Pixel) son *dos sistemas independientes* que se disparan en paralelo desde los mismos puntos de la UI. El interno siempre funciona (no depende de configuración externa) y alimenta el dashboard del panel admin; el externo es un espejo opcional para quien quiera conectar campañas de Google/Meta Ads.

## Validación

Corrí `next build` real. Después de un par de correcciones menores de tipos (mismo patrón de fases anteriores — parámetros de `.map()` sin anotar en dos funciones nuevas), **la verificación de tipos de todo el proyecto pasó sin errores**, incluyendo los 8 archivos nuevos de esta fase y todas las ediciones a archivos existentes. El build se detuvo después, al intentar generar `/sitemap.xml` de verdad — porque a diferencia de las páginas anteriores, el sitemap ejecuta su consulta a Prisma en el momento de la recolección de datos del build, y tropezó con la misma limitación de red de este sandbox (motor de Prisma sin generar) que ya se documentó en cada fase desde la FASE 3. No es un defecto del código: en tu entorno, con `prisma generate` funcionando, `/sitemap.xml` se genera con datos reales sin intervención.

## Cómo probarlo

```bash
npm run dev
```

1. Visita `http://localhost:3000/sitemap.xml` — deberías ver las páginas estáticas más los 10 productos y 9 categorías del seed.
2. Visita `http://localhost:3000/robots.txt` — confirma que `/admin` está en `disallow` y que apunta al sitemap correcto.
3. Copia la URL de un producto y pégala en el [Rich Results Test de Google](https://search.google.com/test/rich-results) una vez desplegado — deberías ver tanto `Product` como `BreadcrumbList` detectados.
4. Sin configurar GA4/Meta Pixel: navega el sitio con las herramientas de desarrollador abiertas — no debería haber ninguna petición de red hacia `googletagmanager.com` ni `facebook.net`.
5. Configura `NEXT_PUBLIC_GA4_ID` en tu `.env` con un ID de prueba, reinicia el servidor, y revisa en el panel de "Tiempo real" de Google Analytics que los eventos `view_item`, `add_to_cart`, etc. lleguen al navegar el catálogo.
6. En el panel admin (`/admin`), confirma que el Dashboard (FASE 9) ahora también refleja los eventos `REMOVE_FROM_CART` en la sección de analítica si consultas la tabla directamente (el dashboard visual actual no desglosa este evento en particular, pero ya queda registrado para reportes futuros).

## Errores potenciales

| Síntoma | Causa | Solución |
|---|---|---|
| El sitemap no incluye un producto nuevo | ISR/caché de la ruta `/sitemap.xml` | Next.js regenera sitemaps dinámicos en cada request por defecto salvo que agregues `revalidate`; si notas demora, confirma que no se agregó caché adicional |
| Los eventos no llegan a GA4 en "Tiempo real" | Ad blocker del navegador bloqueando `googletagmanager.com` | Prueba en una ventana de incógnito sin extensiones, es el falso positivo más común |
| El Rich Results Test no encuentra `LocalBusiness` | Faltan datos de `business_settings` (dirección/teléfono vacíos) | Complétalos desde `/admin/configuracion` (FASE 9) |

## Próximo paso

Sigo con **FASE 12 — Testing**: pruebas funcionales de punta a punta sobre todo el embudo (agregar al carrito, cotizar, WhatsApp, folios, caracteres especiales, responsive, búsqueda, filtros, administración) antes de pasar a la FASE 13 (Deployment).
