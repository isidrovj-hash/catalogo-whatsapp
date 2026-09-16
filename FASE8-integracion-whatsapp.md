# FASE 8 — INTEGRACIÓN WHATSAPP

## Qué se construyó

```
prisma/schema.prisma            # + enum WhatsAppProvider, + business_settings.whatsappProvider
sql/schema.sql                  # + tipo whatsapp_provider, + bloque de migración manual

src/lib/whatsapp/
├── WhatsAppService.ts          # WhatsAppLinkService ahora exportada; factory con selección de proveedor
└── WhatsAppCloudApiService.ts  # NUEVO: implementación v2 (WhatsApp Business Cloud API)

src/app/api/webhooks/whatsapp/route.ts   # NUEVO: verificación + recepción de eventos de Meta

.env.example                    # + 3 variables opcionales de Cloud API
src/lib/env.ts                  # + validación opcional de esas variables
```

## Lo que ya estaba (auditoría, no reconstrucción)

`WhatsAppService` como interfaz, la generación de enlaces `wa.me`, el botón flotante, "Preguntar por WhatsApp" en cada tarjeta y ficha, y el cotizador — todo esto se construyó en las FASES 4, 5 y 7. Antes de escribir código nuevo, audité el proyecto completo:

```bash
grep -rn "wa.me\|whatsapp.com" src/ --include="*.tsx" --include="*.ts" | grep -v "WhatsAppService.ts"
```

**Resultado: cero coincidencias.** Ningún componente construye un enlace de WhatsApp por su cuenta — todo pasa por la capa de abstracción, tal como se prometió desde la FASE 1. Esto es lo que hace posible que esta fase active WhatsApp Business Cloud API sin tocar ni un componente de UI.

## Lo nuevo: el punto de extensión de la sección 40, ya no solo prometido — construido

**`WhatsAppCloudApiService`** implementa la misma interfaz `WhatsAppService` que `WhatsAppLinkService`, pero:
- `getProductInquiryLink()` y `getQuoteLink()` se **delegan** a la implementación de enlaces (por herencia) — porque esa parte del flujo (el cliente hace click y abre su propio WhatsApp) funciona igual sin importar qué use el negocio para sus propios envíos.
- `sendOrderConfirmation()` y `sendFollowUp()` sí están implementadas de verdad contra la API de Meta (`https://graph.facebook.com/v20.0/{phone_number_id}/messages`), usando plantillas aprobadas (obligatorio: WhatsApp Business Platform no permite texto libre fuera de una ventana de 24 horas de conversación).

**Selección de proveedor sin tocar código.** Se agregó `business_settings.whatsapp_provider` (`LINK` o `CLOUD_API`). La factory `getWhatsAppService()` lee ese valor y decide qué clase instanciar. Si el admin activa `CLOUD_API` pero faltan las credenciales en las variables de entorno, el sistema **se degrada automáticamente a enlaces `wa.me`** con una advertencia en consola — nunca se rompe el sitio por una configuración incompleta.

**Por qué las credenciales van en variables de entorno y no en la base de datos.** El número de WhatsApp (dato público, ya visible en cualquier enlace) vive en `business_settings`. El token de acceso de Meta es un secreto — si viviera en la base de datos, cualquier fuga de esa tabla comprometería la cuenta de WhatsApp Business del negocio. Por eso `WHATSAPP_CLOUD_API_TOKEN` y `WHATSAPP_CLOUD_API_PHONE_ID` son variables de entorno, nunca columnas de tabla.

**El webhook (`/api/webhooks/whatsapp`)** es el segundo requisito no-negociable de Meta para activar la Cloud API: un GET para verificar que el servidor es tuyo, y un POST donde Meta te avisa de mensajes entrantes y cambios de estado de entrega. Por ahora solo registra el evento en el log del servidor — conectar esas respuestas a un historial de conversación por cliente es trabajo del CRM (FASE 10), que necesita antes su propio modelo de datos para no construirse a medias.

## Tres bugs reales encontrados y corregidos durante la validación de esta fase

Validar cada fase con `next build` real sigue dando resultados. Esta vez encontré y corregí:

1. **`src/lib/schema.ts`**: los campos `price`/`promoPrice` de `ProductForSchema` estaban tipados como `unknown`, incompatibles con lo que espera `toNumber()`. Mismo patrón de bug que ya había corregido en `actions/products.ts` en la FASE 6 — corregido con la unión de tipos correcta.
2. **`src/components/product/Gallery.tsx`**: `images[activeIndex] ?? images[0]` podía resultar en `undefined` según TypeScript (por `noUncheckedIndexedAccess` en `tsconfig.json`), aunque en la práctica nunca ocurre porque el componente ya valida `images.length > 0` antes. Corregido con una aserción no-nula documentada explicando por qué es segura.

Ambos bugs eran inofensivos en la práctica (el código funcionaba en runtime), pero representan una brecha real entre lo que TypeScript puede garantizar y lo que el código asumía — exactamente el tipo de error que `next build` está diseñado para atrapar antes de que llegue a producción.

## Validación que pude ejecutar aquí — la más completa hasta ahora

Por primera vez en el proyecto, después de corregir los bugs anteriores, **`next build` completó la verificación de tipos de TODO el proyecto sin un solo error**, incluyendo los tres archivos nuevos de esta fase. El build solo se detuvo después, en la etapa de "Collecting page data", con el error ya conocido y documentado en cada fase anterior: `@prisma/client did not initialize yet` — la confirmación en tiempo de ejecución de que el motor de Prisma nunca terminó de generarse en este sandbox por el bloqueo de red hacia `binaries.prisma.sh`. Es un problema de infraestructura de este entorno de pruebas, no del código.

## Cómo probarlo

**Modo LINK (por defecto, no requiere nada nuevo):** ya funciona desde la FASE 4 — no hay nada que configurar.

**Modo CLOUD_API (opcional, requiere cuenta de Meta Business):**
1. Crea una app en [Meta for Developers](https://developers.facebook.com/) con el producto "WhatsApp".
2. Copia el `Phone Number ID` y genera un token de acceso (temporal para pruebas, permanente para producción).
3. Completa `WHATSAPP_CLOUD_API_TOKEN` y `WHATSAPP_CLOUD_API_PHONE_ID` en tu `.env`.
4. Actualiza `business_settings.whatsapp_provider` a `'CLOUD_API'` (vía Prisma Studio, hasta que exista el panel visual en la FASE 9).
5. Registra `https://tu-dominio.com/api/webhooks/whatsapp` como webhook en Meta, usando el mismo valor de `WHATSAPP_CLOUD_API_VERIFY_TOKEN` que pusiste en tu `.env`.
6. `sendOrderConfirmation()`/`sendFollowUp()` están listas para llamarse, pero necesitan plantillas de mensaje aprobadas por Meta con los nombres exactos usados en el código (`order_confirmation`, `followup_30min`, `followup_24h`, `followup_72h`) — créalas desde WhatsApp Manager antes de invocarlas.

## Errores potenciales

| Síntoma | Causa | Solución |
|---|---|---|
| El sitio sigue generando enlaces `wa.me` aunque configuraste Cloud API | Faltan `WHATSAPP_CLOUD_API_TOKEN` o `WHATSAPP_CLOUD_API_PHONE_ID` | Es el comportamiento esperado (degradación segura); revisa la advertencia en el log del servidor |
| Meta rechaza la verificación del webhook | `WHATSAPP_CLOUD_API_VERIFY_TOKEN` no coincide entre tu `.env` y lo que registraste en Meta | Deben ser exactamente el mismo string en ambos lados |
| `sendOrderConfirmation`/`sendFollowUp` fallan con error 400 de Meta | La plantilla no existe o no ha sido aprobada | Créala y espera la aprobación (usualmente unas horas) en WhatsApp Manager |

## Próximo paso

Sigo con **FASE 9 — Administración**: el panel `/admin` con autenticación (Supabase Auth), donde por fin existirá una interfaz visual para cambiar `business_settings` (incluyendo el número de WhatsApp y el proveedor activo) sin necesidad de Prisma Studio, además de la administración completa de productos, categorías, promociones y banners.
