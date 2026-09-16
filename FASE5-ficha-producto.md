# FASE 5 — FICHA DE PRODUCTO

## Qué se construyó

```
src/
├── lib/
│   └── schema.ts                      # JSON-LD Product (Schema.org) para SEO
├── components/
│   └── product/
│       ├── Gallery.tsx                # Galería con miniaturas (client)
│       ├── ProductActions.tsx         # Cantidad + Agregar + WhatsApp + Compartir (client)
│       ├── Breadcrumbs.tsx
│       └── RelatedProducts.tsx        # "También puedes necesitar" (sección 47)
└── app/
    └── productos/[slug]/page.tsx      # Ficha de producto completa
```

## Cómo cumple cada requisito de la sección 10

| Requisito del brief | Dónde |
|---|---|
| URL amigable (`/productos/cemento-monterrey-25kg`) | Ruta dinámica `app/productos/[slug]/page.tsx`, usando el `slug` único ya definido en la FASE 2 |
| Galería + imagen principal | `Gallery.tsx` — miniaturas clicables, primera imagen como principal por defecto |
| Nombre, SKU, marca, categoría, descripción, características | Todo renderizado desde `getProductBySlug()` (ya existía desde la FASE 4); "características" se muestra como los `tags` del producto en forma de chips |
| Presentación, unidad, precio, precio promocional, disponibilidad | Reutiliza `formatCurrency`, `toNumber` y `getAvailabilityLabel` ya construidos en la FASE 4 — cero duplicación de lógica |
| Cantidad | Selector +/- con input numérico en `ProductActions.tsx` |
| Productos relacionados | `RelatedProducts.tsx`: primero usa las relaciones manuales del admin (tabla `product_relations`, ya sembradas en el seed: Cemento → Varilla/Multiplast), y si un producto no tiene ninguna definida, sugiere automáticamente productos de su misma categoría — cumpliendo literalmente la sección 47 ("el admin puede definir relaciones manualmente y el sistema también puede sugerir por categoría") |
| Botón AGREGAR AL PEDIDO | Reutiliza `useCartStore` — el mismo carrito de la FASE 4, con cantidad seleccionada |
| Botón COTIZAR POR WHATSAPP | Reutiliza `WhatsAppService.getProductInquiryLink()` — la misma plantilla exacta de la tarjeta de catálogo |
| Botón COMPARTIR | Web Share API nativa (`navigator.share`) en móvil; en escritorio, donde no existe, cae a "copiar enlace" al portapapeles |

## SEO por producto (sección 26)

Cada ficha genera:
- **Metadata dinámica** (`generateMetadata`): título, descripción, `alternates.canonical` con la URL absoluta del producto.
- **Open Graph y Twitter Card** con la imagen principal — al compartir un producto por WhatsApp, Facebook o Messenger, aparecerá con foto, nombre y descripción (sección 27).
- **JSON-LD `Product`** (`lib/schema.ts`) inyectado como `<script type="application/ld+json">`: incluye `sku`, `brand`, `offers` con precio y **disponibilidad mapeada a los valores estándar de Schema.org** (`InStock`, `LimitedAvailability`, `OutOfStock`, `PreOrder`) según el `AvailabilityStatus` de la tabla `inventory`. Esto es lo que le permite a Google mostrar precio y disponibilidad directamente en resultados de búsqueda.
- **Breadcrumbs** visuales (Inicio / Productos / Categoría / Producto) — el marcado `BreadcrumbList` de Schema.org se añade formalmente en la FASE 11 junto con el resto de SEO técnico (sitemap, robots.txt), para no duplicar esfuerzo.

## Analítica

Se agrega el evento `PRODUCT_VIEW` (pendiente desde la FASE 4) cada vez que se visita una ficha, y `WHATSAPP_PRODUCT_CLICK` al hacer click en "Cotizar por WhatsApp" desde la ficha — cerrando 5 de los 9 eventos de la sección 25. Los 4 restantes (`REMOVE_FROM_CART`, `QUOTE_STARTED`, `QUOTE_SUBMITTED`, y la integración con GA4/Meta Pixel) llegan en la FASE 11.

## Decisión de diseño: relacionados automáticos por categoría

Cuando un producto no tiene relaciones manuales (la mayoría del catálogo demo, excepto Cemento Gris y Pintura Vinílica), la ficha llama a `getProducts({ categorySlug, pageSize: 5 })` — la misma función de listado de la FASE 4 — y descarta el producto actual. Esto significa que **ningún producto se queda sin sección de relacionados**, sin que el admin tenga que configurar nada manualmente desde el día uno.

## Validación que pude ejecutar aquí

Repetí el mismo proceso de la FASE 3/4: corrí `next build` real. Todo el archivo `productos/[slug]/page.tsx` y sus componentes nuevos (`Gallery`, `ProductActions`, `Breadcrumbs`, `RelatedProducts`, `schema.ts`) **compilaron sin ningún error nuevo** — el build avanzó limpio a través de todo el archivo hasta tropezar con el mismo problema ya conocido y documentado en archivos de fases anteriores (el stub de `@prisma/client` sin generar en este sandbox, por el bloqueo de red hacia `binaries.prisma.sh`). No encontré ningún error de lógica, de tipos genuino, ni de JSX en el código nuevo.

## Cómo probarlo

```bash
npm run dev
```

1. Ve a `/productos` y haz click en cualquier producto (o directamente a `/productos/cemento-gris-monterrey-25kg`).
2. Verifica: galería (aunque el seed usa una sola imagen por producto, el componente ya soporta múltiples), precio tachado si hay promoción, badge de disponibilidad, selector de cantidad.
3. Cambia la cantidad a 3, haz click en "Agregar al pedido" → ve a `/carrito` y confirma que se agregó con cantidad 3.
4. Haz click en "Cotizar por WhatsApp" → confirma que el mensaje incluye el nombre exacto del producto, SKU, presentación y el enlace de vuelta a la ficha.
5. Visita `/productos/cemento-gris-monterrey-25kg` (tiene relaciones manuales en el seed) y luego `/productos/tubo-pvc-hidraulico-1-2-pulgada` (no tiene, así que verás sugerencias automáticas de Plomería).
6. Copia la URL de un producto y pégala en el [validador de resultados enriquecidos de Google](https://search.google.com/test/rich-results) una vez desplegado, para confirmar que el JSON-LD es válido.

## Errores potenciales

| Síntoma | Causa | Solución |
|---|---|---|
| "Compartir" no abre el diálogo nativo en escritorio | Web Share API solo existe en navegadores móviles/algunos de escritorio | Es el comportamiento esperado; cae a "copiar enlace" |
| Página de producto 404 | El producto está `active: false` o el slug no coincide | `getProductBySlug` solo busca productos activos, a propósito |
| Relacionados vacíos en un producto sin categoría compartida | Solo hay 1 producto en esa categoría en el seed | Esperado con datos demo; se resuelve solo con más productos reales |

## Próximo paso

Sigo con **FASE 6 — Carrito**: aunque ya es funcional desde la FASE 4, en esta fase se pule la experiencia completa (estados vacíos más trabajados, recomendaciones "Completa tu compra" con venta cruzada de la sección 48, favoritos con corazón ♡, y la función "Compartir pedido" de la sección 45).
