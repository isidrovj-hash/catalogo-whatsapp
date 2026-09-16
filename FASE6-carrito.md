# FASE 6 — CARRITO

El carrito ya era funcional desde la FASE 4 (persistencia, cantidades, subtotal). Esta fase pule la experiencia alrededor de él, tal como se planeó.

## Qué se construyó

```
src/
├── store/
│   └── favoritesStore.ts              # Favoritos (Zustand + persist), sección 46
├── lib/
│   └── cartShare.ts                   # Texto de "Compartir pedido", sección 45
├── actions/
│   └── products.ts                     # Server Actions: getProductsByIds, getCrossSellSuggestions
└── components/
    ├── catalog/
    │   ├── FavoriteButton.tsx          # ♡ Guardar (icono en tarjeta, botón con texto en ficha)
    │   ├── MiniProductCard.tsx         # Tarjeta ligera 100% cliente (venta cruzada y favoritos)
    │   └── FavoritesView.tsx
    ├── layout/
    │   └── FavoritesBadge.tsx          # Contador de favoritos en el Header
    └── cart/
        └── CrossSellSuggestions.tsx    # "Completa tu compra", sección 48

app/favoritos/page.tsx                  # Página nueva de favoritos
```

## Decisiones técnicas

**Por qué la venta cruzada y los favoritos usan Server Actions en vez de props del servidor.** El carrito y los favoritos viven enteramente en `localStorage` — el servidor no sabe qué hay en ellos al renderizar la página. Por eso `CrossSellSuggestions` y `FavoritesView` son Client Components que, al montarse, **llaman directamente a una Server Action** (`getCrossSellSuggestions`, `getProductsByIds`) pasándole los ids que sí conocen del lado del cliente. Next.js convierte esa llamada en una petición al servidor automáticamente — no hace falta una ruta de API manual.

**Por qué existe `MiniProductCard` en vez de reutilizar `ProductCard`.** `ProductCard` es un *Server Component asíncrono* (necesita `await getWhatsAppService()` para el botón "Preguntar por WhatsApp" de cada producto). Los Server Components no se pueden instanciar dinámicamente desde un `useEffect` en el cliente. `MiniProductCard` es una versión más simple, 100% cliente, sin el botón de WhatsApp por producto — sacrifica esa única función a cambio de poder vivir dentro de `CrossSellSuggestions` y `FavoritesView`. El resto de sus funciones (favoritos, agregar al carrito, ir a la ficha) están completas.

**Venta cruzada con dos niveles de fallback (sección 48, tal como se pidió).** `getCrossSellSuggestions()` primero busca relaciones manuales (`product_relations`) de los productos ya en el carrito; si no junta 4 sugerencias, completa con productos de la misma categoría del primer artículo. Se muestra como una sección de texto simple más abajo del resumen — nunca como popup, cumpliendo la restricción explícita de la sección 48.

**"Compartir pedido" es deliberadamente distinto de "Solicitar cotización".** El texto que genera `buildCartShareText()` (sección 45) es una lista simple sin precios — pensado para compartir con un colega o cliente ("Mi lista de materiales: 10 Cementos, 5 Multiplast..."), no para enviarse al negocio. Usa `navigator.share()` nativo con fallback a copiar al portapapeles. Es un botón distinto del cotizador, que sí incluye precios y va dirigido al WhatsApp del negocio.

**Favoritos ya tienen su propio ícono y contador en el Header**, siguiendo el mismo patrón de hidratación segura que el contador del carrito (`CartBadge`): no se muestra ningún número hasta que el componente confirma que ya está montado en el cliente, para evitar el parpadeo de hidratación.

## Un bug real que encontré y corregí durante la validación

Al escribir `actions/products.ts` tipé los campos `price`/`promoPrice` de `ProductLike` como `unknown`, pero la función `toNumber()` (de la FASE 4) espera específicamente `number | string | { toNumber: () => number } | null | undefined`. TypeScript lo marcó correctamente como error al compilar. Lo corregí tipando `ProductLike.price`/`promoPrice` con la unión exacta que `toNumber()` necesita. Este es un ejemplo real (no relacionado al sandbox) de por qué vale la pena correr `next build` en cada fase en vez de solo revisar el código a simple vista.

## Validación que pude ejecutar aquí

Corrí `next build` real contra todo el código nuevo. Encontré y corregí el bug de tipos mencionado arriba. Después de corregirlo, el build avanzó limpio a través de todos los archivos nuevos de esta fase hasta volver a tropezar con la misma limitación ya documentada en fases anteriores (el cliente de Prisma sin generar por el bloqueo de red hacia `binaries.prisma.sh` en este sandbox) — confirmé, aplicando parches temporales de prueba únicamente para diagnosticar, que esos errores restantes son atribuibles enteramente a esa causa y no a lógica nueva.

## Cómo probarlo

```bash
npm run dev
```

1. Agrega 2-3 productos al carrito y ve a `/carrito`: deberías ver la sección "Completa tu compra" más abajo con sugerencias reales (ej. si agregaste Cemento Gris, verás Varilla y Multiplast, sus relaciones manuales del seed).
2. Haz click en el corazón ♡ de cualquier tarjeta del catálogo → ve a `/favoritos` (ícono junto al carrito en el header, en pantallas ≥640px, o dentro del menú ☰ en teléfonos pequeños) → confirma que aparece ahí.
3. Con el carrito vacío, ve a `/carrito`: deberías ver productos destacados sugeridos en vez de una pantalla completamente vacía.
4. Haz click en "Compartir pedido": en móvil debería abrir el panel nativo de compartir; en escritorio, debería copiar el texto al portapapeles (confirma con el cambio de texto del botón a "Lista copiada").

## Errores potenciales

| Síntoma | Causa | Solución |
|---|---|---|
| "Completa tu compra" nunca aparece | El/los producto(s) en el carrito no tienen relaciones manuales NI comparten categoría con otros productos activos | Esperado con datos demo limitados; se resuelve con más productos reales o más relaciones en `product_relations` |
| El corazón no se guarda entre visitas | El navegador tiene bloqueado `localStorage` (modo incógnito estricto, por ejemplo) | Comportamiento esperado de cualquier solución basada en `localStorage`; se resuelve con cuentas de cliente en el CRM futuro |

## Próximo paso

Sigo con **FASE 7 — Cotizador**: aquí es donde `actions/quote.ts` (la versión preliminar de la FASE 4) se reemplaza por la versión completa — creación real de `customer`, `quote`, `quote_items` y `lead` en base de datos, folio oficial correlativo (`COT-2026-000001`, `COT-2026-000002`...), y el formulario completo de la sección 12 (tipo de cliente, empresa, colonia, comentarios).
