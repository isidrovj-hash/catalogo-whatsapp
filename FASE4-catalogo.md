# FASE 4 — CATÁLOGO

## Qué se construyó

```
src/
├── lib/
│   ├── data/
│   │   ├── business-settings.ts   # Configuración global (cacheada, con tag para invalidar)
│   │   ├── categories.ts          # Árbol de categorías/subcategorías + lista plana
│   │   ├── brands.ts              # Marcas activas
│   │   └── products.ts            # getProducts() con búsqueda, filtros, orden y paginación
│   ├── whatsapp/
│   │   ├── messageTemplates.ts    # Plantillas de mensaje (producto y cotización)
│   │   └── WhatsAppService.ts     # Capa de abstracción prometida en la FASE 1
│   ├── availability.ts            # Traducción de estado de inventario a etiquetas
│   └── format.ts                  # Formato de moneda (MXN)
├── store/
│   └── cartStore.ts               # Carrito con Zustand + persist (localStorage)
├── actions/
│   ├── analytics.ts                # Server Action: registra eventos en `analytics_events`
│   └── quote.ts                    # Server Action: arma el link de WhatsApp de cotización
├── components/
│   ├── layout/ (Header, Footer, BottomNav, WhatsAppFloat, CartBadge)
│   ├── catalog/ (Hero, CategoryChips, BannerStrip, ProductCard, ProductGrid, Filters, Pagination, AddToCartButton)
│   ├── cart/CartView.tsx
│   └── quote/QuickQuoteForm.tsx
└── app/
    ├── layout.tsx (actualizado: monta Header/Footer/BottomNav/WhatsAppFloat)
    ├── page.tsx (Home: Hero + banners + categorías + destacados)
    ├── productos/page.tsx (catálogo completo: búsqueda + filtros + orden + paginación)
    ├── categorias/page.tsx y categorias/[slug]/page.tsx
    ├── ofertas/page.tsx
    ├── contacto/page.tsx
    ├── carrito/page.tsx
    └── cotizar/page.tsx (versión preliminar, ver nota abajo)
```

## Decisiones técnicas clave

**Búsqueda de texto completo real, no `LIKE '%...%'`.** `getProducts()` en `lib/data/products.ts` arma una sola consulta SQL con `Prisma.sql` que combina el `search_vector` (con ranking `ts_rank`) definido en la FASE 2, los filtros de categoría/marca/precio/promoción, y el orden pedido — todo en una sola ida a la base de datos, sin traer miles de filas para filtrar en memoria.

**Casi todo funciona sin JavaScript en el cliente.** El buscador del Header, el formulario de Filtros y la Paginación son formularios/enlaces `GET` nativos de HTML: cambiar un filtro simplemente navega a una nueva URL con query params. Esto es intencional — es más rápido, más accesible, y funciona incluso en conexiones móviles lentas. El menú móvil usa `<details>/<summary>` (disclosure widget nativo) por la misma razón. Los **únicos** componentes que son Client Components son los que necesitan de verdad estado del navegador: `CartBadge` (localStorage), `AddToCartButton` (Zustand), y `CartView`/`QuickQuoteForm` (edición interactiva del carrito).

**El carrito ya es funcional, no un placeholder.** Aunque el roadmap dedica la FASE 6 al carrito, el botón "Agregar" de cada tarjeta (sección 6 del brief) necesitaba funcionar de verdad en esta fase — así que ya existe `store/cartStore.ts` con persistencia real, y `/carrito` ya lista, permite ajustar cantidades y eliminar productos. La FASE 6 se enfoca en pulir esa experiencia (estados vacíos más ricos, venta cruzada, sincronización futura con cuenta de cliente) sobre esta base ya sólida.

**`/cotizar` es una versión preliminar — léelo con atención.** Para que el botón "Solicitar cotización" del carrito no fuera un enlace roto, ya construí un formulario funcional que arma el mensaje de WhatsApp con `WhatsAppService.getQuoteLink()` y lo abre. Sin embargo, **todavía no crea registros en `customers`, `quotes`, `quote_items` ni `leads`**, y el folio que ves (`PREVIO-XXXXXX`) es solo de vista previa, no el folio oficial correlativo (`COT-2026-000001`) de la sección 24. Eso —la persistencia completa, el folio real, y la captura formal de prospecto— es exactamente el contenido de la **FASE 7 (Cotizador)**, que reemplazará `actions/quote.ts` por la versión completa reutilizando el mismo `WhatsAppService`.

**WhatsAppService ya está completo end-to-end.** `getProductInquiryLink()` se usa en cada tarjeta y en el botón flotante/header (mensaje genérico); `getQuoteLink()` ya se usa en el cotizador preliminar y se reutilizará sin cambios en la FASE 7. El número de WhatsApp se lee siempre desde `business_settings` vía `getBusinessSettings()` — nunca hardcodeado.

**Dirección de diseño aplicada de forma consistente.** El naranja de marca (`brand`) se reserva solo para acciones de conversión (Agregar, CTAs, precios en oferta); el badge "OFERTA" usa el amarillo de acento; el botón de WhatsApp usa verde (`success`) porque es un color ya asociado culturalmente a WhatsApp y ayuda a distinguirlo visualmente de las acciones "Agregar al carrito".

## Analítica ya conectada (adelanto de la FASE 11)

Se registran ya 3 de los 9 eventos de la sección 25, porque encajaban naturalmente en el código de esta fase sin trabajo extra:
- `SEARCH` — al renderizar resultados de `/productos?q=...`
- `CATEGORY_VIEW` — al visitar una página de categoría
- `ADD_TO_CART` — al hacer click en "Agregar"
- `WHATSAPP_QUOTE_CLICK` — al enviar el cotizador preliminar

`PRODUCT_VIEW` se añade en la FASE 5 (cuando exista la página de ficha de producto) y `WHATSAPP_PRODUCT_CLICK`/`REMOVE_FROM_CART`/`QUOTE_STARTED` se completan en la FASE 11 junto con el resto de la instrumentación (GA4, Meta Pixel).

## Validación que pude ejecutar aquí

Corrí `next build` de nuevo contra todo el código nuevo. Resultado:

- ✅ **Todo el JSX, la estructura de componentes y los formularios GET compilan sin errores de sintaxis.**
- ⚠️ Al llegar a la verificación de tipos, aparecen errores de `"implicitly has an 'any' type"` en los puntos donde el código consume datos de Prisma (por ejemplo, `category.children.map(...)`). Confirmé que la causa raíz es siempre la misma que en la FASE 3: `@prisma/client` en este sandbox nunca terminó de generarse contra nuestro schema real (el binario del motor sigue bloqueado por red), así que TypeScript ve esos campos como `any` en lugar del tipo real (`Category[]`, etc.). No son errores de lógica — revisé a mano cada nombre de campo usado contra `schema.prisma` y son consistentes.

En tu máquina, donde `npm install` sí completa `prisma generate` con éxito, estos mismos archivos deberían tipar correctamente sin cambios. Si al probarlo ves un error de tipos genuino (no relacionado a "any" implícito), avísame con el mensaje exacto y lo corrijo de inmediato.

## Cómo probarlo

```bash
npm install
cp .env.example .env   # completa tus credenciales de Supabase
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Recorrido sugerido:
1. `/` — Hero, banners, categorías, destacados.
2. `/productos?q=cemento` — deberías ver los 2 productos de cemento del seed, ordenados por relevancia.
3. `/categorias/cementos` — filtra automáticamente por esa categoría.
4. `/ofertas` — muestra Cemento Gris e Impermeabilizante (los dos productos con `onPromotion: true` en el seed).
5. Agrega productos al carrito desde cualquier tarjeta → revisa el contador en el header/bottom nav → ve a `/carrito` → ajusta cantidades → `/cotizar` → llena el formulario → confirma que se abre WhatsApp con el mensaje correcto.
6. Reduce el navegador a un ancho móvil: deberías ver la barra de navegación inferior y el botón flotante debería estar oculto (por diseño, ver nota en `WhatsAppFloat.tsx`).

## Errores potenciales

| Síntoma | Causa | Solución |
|---|---|---|
| El buscador no devuelve resultados en español con acentos | Falta la extensión `unaccent` | Ya está en `sql/schema.sql`; confirma que corriste el `CREATE EXTENSION` |
| El botón de WhatsApp no aparece | `business_settings.whatsapp_number` vacío | Revisa el seed o configúralo manualmente en la tabla |
| El contador del carrito parpadea de 0 a N al cargar | Hidratación de Zustand tras localStorage | Es esperado y ya está mitigado (`CartBadge` no renderiza nada hasta montar en cliente) |

## Próximo paso

Sigo con **FASE 5 — Ficha de producto**: página individual `/productos/[slug]` con galería, características completas, productos relacionados (ya definidos manualmente en el seed vía `product_relations`), Schema.org de producto, Open Graph dinámico, y el registro del evento `PRODUCT_VIEW`.
