# FASE 7 — COTIZADOR

## Qué cambió

```
src/
├── actions/
│   └── quote.ts                # REEMPLAZADO por completo: ahora persiste todo en base de datos
├── components/quote/
│   ├── QuickQuoteForm.tsx       # ELIMINADO (era la versión preliminar de la FASE 4)
│   └── QuoteForm.tsx            # NUEVO: formulario completo + pantalla de confirmación con folio
└── app/cotizar/page.tsx         # Actualizado para usar QuoteForm

sql/schema.sql                   # + función next_quote_folio() (folios correlativos por año)
```

## El cambio central: de "armar un link" a "un flujo transaccional real"

La versión de la FASE 4 (`buildQuickQuoteLink`) solo construía el mensaje de WhatsApp — no tocaba la base de datos. La de esta fase, `submitQuote()`, hace lo que de verdad pide el brief (secciones 12, 14, 23 y 24) dentro de **una sola transacción de Prisma**:

1. Busca al cliente por teléfono; si ya cotizó antes, actualiza sus datos en vez de duplicarlo — así el futuro CRM (FASE 10) puede mostrar su historial completo.
2. Genera un **folio real y correlativo** (`COT-2026-000001`, `COT-2026-000002`, ...) llamando a la función `next_quote_folio()` de Postgres.
3. Crea la `quote` con sus `quote_items` (precio congelado al momento de cotizar, tal como se documentó en la FASE 2).
4. Crea el `lead` en estado `NUEVO`, enlazado a esa cotización.

**Si cualquier paso falla, la transacción completa se revierte.** Nunca puede quedar un lead sin su cotización, ni una cotización sin sus líneas de producto — eso sería un dato corrupto para el equipo de ventas.

## Por qué el folio necesitó una función de Postgres, no solo un contador en JavaScript

La forma ingenua de generar `COT-2026-000003` sería contar cuántas cotizaciones existen este año y sumar 1. Bajo carga real (dos clientes cotizando al mismo segundo) **esto puede generar folios duplicados** — es una condición de carrera clásica. La función `next_quote_folio()` (agregada a `sql/schema.sql`) usa una secuencia nativa de Postgres por año, creada automáticamente la primera vez que se necesita: `nextval()` es atómico a nivel de base de datos, así que dos transacciones simultáneas jamás pueden recibir el mismo número, sin necesidad de bloqueos manuales.

> **Acción requerida si tu base de datos ya existía de fases anteriores:** ejecuta el bloque nuevo al final de `sql/schema.sql` (la función `next_quote_folio`) directamente en el SQL Editor de Supabase, o corre `npx prisma db execute --file sql/schema.sql` apuntando solo a ese bloque. Si vuelves a correr `npx prisma migrate dev`, Prisma no detectará este cambio automáticamente porque es una función SQL pura, no un modelo — está documentado así a propósito para que no se pierda en el camino.

## El formulario ahora sí tiene todos los campos de la sección 12

Nombre*, Empresa, Teléfono*, Correo, Ciudad/Municipio, Colonia, Tipo de cliente (los 6 valores exactos del brief), y Comentarios. Después de enviar, la persona ve una pantalla de confirmación con su folio en texto monoespaciado (para que sea fácil de copiar/dictar por teléfono) y un botón para abrir WhatsApp — en vez de saltar automáticamente, para no depender de que el pop-up del navegador no sea bloqueado.

**Caso cubierto: WhatsApp no configurado.** Si `business_settings.whatsapp_number` está vacío, la cotización **igual se guarda** en base de datos (el lead no se pierde) y la pantalla de confirmación se lo explica al cliente en vez de intentar abrir un enlace roto.

## Analítica

Se cierran los 2 eventos de cotización que faltaban: `QUOTE_STARTED` (al abrir el formulario con productos en el carrito) y `QUOTE_SUBMITTED` (al completarse la transacción, con el folio y el total en los metadatos). Junto con lo ya construido en fases anteriores, esto deja **8 de los 9 eventos de la sección 25 completos** — solo falta `REMOVE_FROM_CART`, que se agrega en la FASE 11 junto con GA4/Meta Pixel.

## Validación que pude ejecutar aquí

Corrí `next build` real. **`actions/quote.ts` —el archivo central de esta fase— compiló limpio sin ningún error nuevo**, incluyendo la transacción de Prisma completa, la llamada a `$queryRaw` para el folio, y la construcción del link de WhatsApp reutilizando `WhatsAppService`. El build avanzó a través de todo ese archivo hasta volver a tropezar con la misma limitación ya documentada en cada fase anterior (el stub de `@prisma/client` sin generar en este sandbox). No toqué `QuoteForm.tsx` con parches de prueba porque no importa ningún tipo de Prisma directamente — solo consume la forma ya validada de `submitQuote()` (`{ ok: true, folio, whatsappLink } | { ok: false, error }`), así que su superficie de riesgo real es mínima.

## Cómo probarlo

```bash
npm run dev
```

1. Agrega 2-3 productos al carrito → ve a `/cotizar`.
2. Llena el formulario (deja algún campo opcional vacío para confirmar que no bloquea el envío) → envía.
3. Deberías ver la pantalla de confirmación con un folio con formato `COT-2026-00000X` y el botón para abrir WhatsApp.
4. Verifica en tu base de datos (`npx prisma studio` o el SQL Editor de Supabase):
   - Una fila nueva en `customers` (o una actualizada, si repites con el mismo teléfono).
   - Una fila en `quotes` con ese folio exacto y el `subtotal` correcto.
   - Tantas filas en `quote_items` como productos distintos tenías en el carrito.
   - Una fila en `leads` con `status = NUEVO` apuntando a esa cotización.
5. Repite el proceso una segunda vez: el folio debe incrementar (`000002`), nunca repetirse.
6. Confirma que el carrito quedó vacío después de cotizar.

## Errores potenciales

| Síntoma | Causa | Solución |
|---|---|---|
| Error "La base de datos no devolvió un folio" | No se ejecutó la función `next_quote_folio()` en tu base de datos | Corre el bloque nuevo de `sql/schema.sql` (ver nota arriba) |
| El botón de WhatsApp no aparece en la confirmación | `business_settings.whatsapp_number` vacío | La cotización ya se guardó de todas formas; configura el número y da seguimiento manual con el folio |
| Folios duplicados | No debería ocurrir gracias a `nextval()`, pero si ves esto, confirma que no haya dos funciones `next_quote_folio` distintas en bases de datos diferentes usándose por error | Revisa que `DATABASE_URL` apunte siempre al mismo proyecto de Supabase |

## Próximo paso

Sigo con **FASE 8 — Integración WhatsApp**: aunque `WhatsAppService` ya está completo y en uso desde la FASE 4, esta fase formaliza y documenta la capa de configuración (`/admin/configuracion` visual para cambiar el número sin tocar código, que se construye en paralelo con la FASE 9), y deja preparado el punto de extensión hacia WhatsApp Business Cloud API (sección 40) con un ejemplo concreto de cómo se vería `WhatsAppCloudApiService` sin romper nada de lo ya construido.
