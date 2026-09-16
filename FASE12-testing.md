# FASE 12 — TESTING

## Qué se construyó

```
vitest.config.ts                              # Runner de pruebas unitarias
playwright.config.ts                          # Runner E2E (scaffold, ver nota abajo)
e2e/checkout-flow.spec.ts                     # Prueba E2E del embudo completo (scaffold)

src/lib/
├── format.test.ts                            # 9 pruebas
├── slugify.test.ts                           # 7 pruebas
├── availability.test.ts                      # 6 pruebas
├── cartShare.test.ts                         # 5 pruebas
└── whatsapp/
    ├── messageTemplates.test.ts              # 15 pruebas
    ├── WhatsAppLinkService.ts                # NUEVO: extraído de WhatsAppService.ts
    └── WhatsAppLinkService.test.ts           # 9 pruebas

src/store/
└── cartStore.test.ts                          # 16 pruebas
```

## Un cambio de arquitectura necesario antes de poder probar de verdad

`WhatsAppLinkService` vivía en el mismo archivo que `getWhatsAppService()`, la factory que consulta `business_settings` en la base de datos. Eso significaba que para probar la lógica de construcción de enlaces (la parte más importante de la sección 15: codificación de espacios, saltos de línea, símbolos, signos de pesos) había que arrastrar una conexión a Postgres — imposible de probar de forma aislada.

**Separé la clase a su propio archivo** (`WhatsAppLinkService.ts`), sin ninguna dependencia de base de datos: recibe el número de teléfono y el mensaje base ya resueltos por quien la instancia. `WhatsAppService.ts` ahora solo contiene la interfaz y la factory (que sí depende de la DB), y re-exporta todo para que ningún componente existente tuviera que cambiar sus imports. Verifiqué esto con `next build`: cero errores nuevos en todo el proyecto después del cambio.

Esto es exactamente el tipo de decisión que una fase de testing debe forzar: si algo es difícil de probar, usualmente es una señal de que está acoplado a algo que no debería.

## 67 pruebas unitarias — ejecutadas de verdad, no solo escritas

A diferencia de las fases anteriores (donde la validación se limitó a `next build` porque todo dependía de una base de datos real), esta fase sí pude **correr las pruebas de principio a fin en este sandbox**, porque la lógica pura (formato, slugs, plantillas de mensaje, el store del carrito) no necesita Postgres ni el motor de Prisma.

```
 ✓ src/store/cartStore.test.ts (16 tests) 23ms
 ✓ src/lib/whatsapp/messageTemplates.test.ts (15 tests) 7ms
 ✓ src/lib/whatsapp/WhatsAppLinkService.test.ts (9 tests) 7ms
 ✓ src/lib/cartShare.test.ts (5 tests) 5ms
 ✓ src/lib/availability.test.ts (6 tests) 4ms
 ✓ src/lib/format.test.ts (9 tests) 5ms
 ✓ src/lib/slugify.test.ts (7 tests) 4ms

 Test Files  7 passed (7)
      Tests  67 passed (67)
```

### Cobertura contra la lista de la sección 53

| Requisito de la sección 53 | Cómo se cubrió |
|---|---|
| Agregar producto | `cartStore.test.ts` — cantidad por defecto, cantidad específica, merge si ya existe |
| Eliminar producto | `cartStore.test.ts` — `removeItem`, y `updateQuantity` a 0 |
| Cambiar cantidad | `cartStore.test.ts` — actualizar, reducir a 0, cantidad negativa, producto inexistente |
| Persistencia | `cartStore.test.ts` — verifica el contenido exacto escrito en `localStorage` |
| Cálculo de subtotales | `cartStore.test.ts` — `getCartSubtotal` con y sin promoción, con y sin múltiples productos |
| Cálculo total | Igual que arriba — la suma de subtotales por línea |
| Generación de WhatsApp | `WhatsAppLinkService.test.ts` + `messageTemplates.test.ts` — el enlace, la plantilla, y **la codificación exacta** |
| Caracteres especiales | `WhatsAppLinkService.test.ts` — espacios (%20), saltos de línea (%0A), signo de pesos (%24), acentos/ñ con round-trip, comentarios con símbolos mixtos (`#`, `¡`, comillas) |
| Formulario | Cubierto parcialmente por `messageTemplates.test.ts` (los datos que el formulario produce); la validación de campos del formulario en sí se prueba manualmente (ver checklist abajo) porque vive en un Client Component con estado de React |
| Generación de folio | **No se pudo probar aquí** — ver sección siguiente |
| Búsqueda, Filtros, Responsive, Administración | **Requieren base de datos y navegador reales** — ver checklist manual abajo y el scaffold de Playwright |

## Por qué el folio NO se probó con una prueba automatizada

`next_quote_folio()` es una función de PostgreSQL (FASE 7) que usa `nextval()` sobre una secuencia real de la base de datos — es, por diseño, imposible de probar sin una conexión a Postgres real. No existe una versión "simulada" razonable de esto: simularla en JavaScript no probaría nada sobre la garantía real (atomicidad bajo concurrencia) que es la razón de ser de esa función.

**Lo que sí se puede y se debe hacer** (documentado como prueba manual/de integración):
```sql
-- Ejecuta esto varias veces seguidas en el SQL Editor de Supabase:
SELECT next_quote_folio();
-- Verifica que cada resultado incrementa: COT-2026-000001, COT-2026-000002, ...

-- Prueba de concurrencia real (opcional, con psql):
-- Abre 2 sesiones simultáneas y ejecuta SELECT next_quote_folio() en ambas
-- al mismo tiempo; los dos folios devueltos deben ser distintos.
```

## El scaffold de Playwright: honesto sobre sus límites

`e2e/checkout-flow.spec.ts` cubre el embudo completo de la sección 44 (Catálogo → Producto → Carrito → Cotización → WhatsApp) y una prueba de responsive (bottom nav en móvil vs. botón flotante en escritorio). **No lo ejecuté en este sandbox** — necesita un servidor Next.js corriendo contra una base de datos Postgres real con el seed cargado, y un navegador Chromium real, ninguno de los dos disponibles aquí. Corre así en tu máquina:

```bash
npx playwright install --with-deps chromium
npm run dev &          # en otra terminal, o en background
npx playwright test
```

Algunos selectores del spec (ej. `page.locator('input[type="text"]').first()`) son deliberadamente genéricos y probablemente necesiten ajustarse a los `data-testid` o textos exactos una vez que lo corras contra la UI real — lo dejé como punto de partida funcional, no como una prueba pulida al 100%, para ser honesto sobre su estado.

## Checklist de QA manual (todo lo que necesita navegador + base de datos reales)

Usa esto como lista de verificación antes de cada despliegue a producción, junto con `npm run test` (automatizado) y `npm run test:e2e` (si tienes Playwright configurado):

- [ ] **Búsqueda**: `/productos?q=cemento` devuelve los productos correctos; buscar con acentos ("acrílico") encuentra resultados sin acentos también.
- [ ] **Filtros**: combinar categoría + marca + rango de precio + "solo ofertas" en `/productos` reduce los resultados correctamente; los filtros persisten al cambiar de página.
- [ ] **Responsive**: en un viewport de 375px (iPhone SE), el bottom nav no tapa el botón "Agregar al pedido" de la ficha de producto; en 1440px, el botón flotante de WhatsApp es visible y el bottom nav no aparece.
- [ ] **Administración — productos**: crear un producto nuevo con imagen subida (no solo URL pegada), verificar que aparece en el catálogo público en segundos (no minutos).
- [ ] **Administración — eliminar con integridad referencial**: intentar eliminar un producto con cotizaciones asociadas debe mostrar el mensaje de "desactívalo en su lugar", no un error 500.
- [ ] **Administración — configuración**: cambiar el número de WhatsApp y confirmar que el botón flotante del sitio público lo refleja sin esperar el tiempo de caché.
- [ ] **Folio**: generar 3 cotizaciones seguidas y confirmar que los folios son consecutivos y únicos (ver SQL de arriba).
- [ ] **WhatsApp real**: en un teléfono real, hacer click en "Cotizar por WhatsApp" y confirmar que abre la app de WhatsApp (no el navegador) con el mensaje pre-cargado y correctamente acentuado.
- [ ] **WhatsApp Web**: repetir la prueba anterior en escritorio y confirmar que abre `web.whatsapp.com` con el mismo mensaje.

## Cómo correr lo que sí está automatizado

```bash
npm install
npm run test          # 67 pruebas unitarias, corren en segundos, sin necesitar base de datos
npm run test:watch    # modo watch mientras desarrollas
```

## Próximo paso

Sigo con **FASE 13 — Deployment**: instrucciones de despliegue a Vercel + Supabase, variables de entorno de producción, y el README final del proyecto — cerrando las 13 fases.
