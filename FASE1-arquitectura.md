# FASE 1 — ARQUITECTURA PROFESIONAL DEL SISTEMA
## Catálogo Digital + WhatsApp

---

## 1. STACK TECNOLÓGICO RECOMENDADO

| Capa | Tecnología | Justificación |
|---|---|---|
| Frontend + Backend | **Next.js 14 (App Router) + TypeScript** | SSR/SSG para SEO real por producto, Server Actions para evitar exponer API keys, un solo repo para todo el ciclo de vida inicial. |
| Estilos | **Tailwind CSS** | Mobile-first, velocidad de desarrollo, consistencia de diseño. |
| Base de datos | **PostgreSQL (vía Supabase)** | Relacional, robusta, con Auth, Storage e RLS (Row Level Security) incluidos sin infraestructura extra. |
| ORM | **Prisma** | Tipado estricto end-to-end, migraciones versionadas, legible para crecer a CRM. |
| Autenticación admin | **Supabase Auth (email/password + roles)** | Evita reinventar seguridad; fácil de extender a multiusuario/sucursal. |
| Imágenes | **Supabase Storage + next/image (WebP/AVIF automático)** | CDN + optimización sin servidor adicional. |
| Carrito | **Zustand + localStorage (persist middleware)** | Estado global ligero, persistencia sin backend, fácil de migrar a sync con DB. |
| Validación | **Zod** | Validación compartida frontend/backend con los mismos esquemas. |
| WhatsApp (v1) | **wa.me links + capa `WhatsAppService`** | Sin costos ni aprobación de Meta; abstracción lista para Cloud API futura. |
| Hosting | **Vercel (frontend/backend) + Supabase (DB/Storage/Auth)** | Despliegue git-push, escalado automático, gratuito para etapa inicial. |
| Analítica | **GA4 + Meta Pixel (opcional) + tabla `analytics_events` propia** | Datos propios (first-party) que no dependen de terceros, además de las plataformas de ads. |

**Por qué Next.js sobre "solo React + Node separado":** cada producto necesita URL indexable por Google (`/productos/[slug]`) con metadata dinámica (Open Graph, Schema.org). Un SPA puro en React perdería SEO. Next.js resuelve frontend, backend (Server Actions/Route Handlers) y SEO en un mismo proyecto, reduciendo complejidad de despliegue sin sacrificar capacidad de crecer a un backend independiente después (la capa de datos queda desacoplada vía Prisma, migrable a un servicio API propio si el negocio lo requiere).

---

## 2. DIAGRAMA LÓGICO

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUARIO (Cliente)                        │
│         Facebook / Instagram / Google / WhatsApp / Directo       │
└───────────────────────────────┬───────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS APP (Vercel)                         │
│                                                                    │
│  ┌───────────────┐   ┌───────────────┐   ┌────────────────────┐  │
│  │  Páginas SSR   │   │  Componentes   │   │   Server Actions /  │  │
│  │  /productos    │   │  UI (Header,   │   │   Route Handlers    │  │
│  │  /categorias   │   │  Cards, Cart,  │   │   (leads, quotes,   │  │
│  │  /admin        │   │  Filters...)   │   │   whatsapp links)   │  │
│  └───────┬───────┘   └───────────────┘   └──────────┬─────────┘  │
│          │                                            │           │
│  ┌───────▼─────────────────────────────────────────────▼──────┐  │
│  │      Estado global (Zustand): carrito, favoritos           │  │
│  │      Persistencia: localStorage                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬───────────────────────────────────┘
                                 ▼  (Prisma Client)
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                         │
│  products · categories · brands · branches · inventory           │
│  customers · leads · quotes · quote_items · promotions           │
│  banners · business_settings · analytics_events · users          │
│  + Supabase Auth (panel admin) + Supabase Storage (imágenes)     │
└─────────────────────────────────────────────────────────────────┘
                                 ▲
┌─────────────────────────────────────────────────────────────────┐
│                    WhatsAppService (capa de abstracción)          │
│  v1: genera enlaces wa.me con mensaje URL-encoded                │
│  v2 (futuro): WhatsApp Business Cloud API                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. ARQUITECTURA FRONTEND / BACKEND

### Frontend
- **App Router de Next.js**, rutas públicas server-rendered para SEO (`/`, `/productos`, `/productos/[slug]`, `/categorias/[slug]`).
- Componentes cliente (`"use client"`) solo donde hay interactividad real: carrito, filtros, buscador, formulario de cotización.
- Diseño **mobile-first** con Tailwind: breakpoints `sm/md/lg/xl`, navegación inferior fija en móvil, header simplificado.

### Backend (dentro del mismo proyecto Next.js)
- **Server Actions** para mutaciones simples y seguras (crear lead, crear cotización, registrar evento analítico) — evita crear API REST completa desde el día uno.
- **Route Handlers** (`/app/api/...`) para lo que necesite ser llamado desde fuera (webhooks futuros, integraciones, exportaciones CSV).
- Toda lógica de negocio (cálculo de folio, armado de mensaje de WhatsApp, validaciones) vive en `/lib`, no en los componentes — reutilizable y testeable.
- El panel `/admin` está protegido por middleware que verifica sesión de Supabase Auth y rol `admin` antes de renderizar o ejecutar cualquier acción.

### Por qué no "backend separado" desde el inicio
Un backend Node/Express independiente añadiría un despliegue más, CORS, y duplicación de tipos. Con Server Actions + Prisma se obtiene la misma seguridad (el código corre en servidor, nunca se expone al cliente) con muchísima menos fricción. Si en el futuro se requiere un backend independiente (por ejemplo, para WhatsApp Cloud API con webhooks de alto volumen), se extrae `/lib` a un servicio propio sin reescribir el frontend.

---

## 4. MODELO DE DATOS (visión general — SQL completo en FASE 2)

Entidades principales y relaciones clave:

```
categories 1─┐
             ├─* products *─┐
brands     1─┘              ├─* quote_items *─1 quotes *─1 customers
                             │                              │
inventory  1─1 products      │                              └─* (historial CRM futuro)
                             │
branches   1─* inventory (futuro: inventario por sucursal)
                             │
promotions *─1 products / categories
banners    (independiente, gestionado por admin)
business_settings (fila única de configuración global)
analytics_events *─ products (opcional, referencia por sku/slug)
users (admin) — roles: admin, editor
```

**Relaciones clave:**
- `products.category_id → categories.id` (FK, `ON DELETE RESTRICT`)
- `products.brand_id → brands.id` (FK, `ON DELETE SET NULL`)
- `inventory.product_id → products.id` (1:1, ampliable a 1:N por sucursal)
- `quote_items.quote_id → quotes.id`, `quote_items.product_id → products.id`
- `quotes.customer_id → customers.id` (nullable — se puede cotizar sin cuenta)
- `leads` se genera automáticamente al enviar una cotización (o puede capturarse antes, ej. "preguntar por WhatsApp")

**Índices previstos:** `products.slug` (único), `products.sku` (único), `products.category_id`, búsqueda full-text sobre `name + description + tags` (usando `tsvector` de Postgres), `quotes.folio` (único).

---

## 5. FLUJO CLIENTE → CARRITO → COTIZACIÓN → WHATSAPP

```
1. Cliente llega desde anuncio/redes → aterriza en /productos o /productos/[slug]
2. Explora, filtra, busca → evento analítico "product_view" / "search"
3. Click "AGREGAR" → producto entra a Zustand store → se persiste en localStorage
4. Header muestra contador de carrito 🛒 N
5. Cliente abre carrito (/carrito) → ajusta cantidades → ve subtotal
6. Click "SOLICITAR COTIZACIÓN" → formulario (nombre, teléfono, tipo cliente, etc.)
7. Al enviar:
     a. Server Action valida datos con Zod
     b. Crea/actualiza `customers`
     c. Crea `leads` (estado NUEVO)
     d. Crea `quotes` + `quote_items` con folio autogenerado (COT-2026-000001)
     e. Registra evento "quote_submitted"
     f. WhatsAppService.sendQuote() arma el mensaje y devuelve el link wa.me
8. Se abre WhatsApp (móvil o web) con el mensaje pre-cargado
9. Vendedor recibe el mensaje, folio y datos → continúa la venta manualmente
10. (Futuro) admin actualiza el estado del lead: CONTACTADO → COTIZADO → GANADO/PERDIDO
```

Este flujo es el que se prueba explícitamente al final de cada fase relevante (carrito, cotizador, WhatsApp).

---

## 6. ESTRUCTURA DE CARPETAS

```
catalogo-whatsapp/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx                    # Home
│   │   │   ├── productos/
│   │   │   │   ├── page.tsx                # Catálogo
│   │   │   │   └── [slug]/page.tsx         # Ficha de producto
│   │   │   ├── categorias/[slug]/page.tsx
│   │   │   ├── carrito/page.tsx
│   │   │   ├── cotizar/page.tsx
│   │   │   └── contacto/page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx                  # Protegido por middleware
│   │   │   ├── page.tsx                    # Dashboard
│   │   │   ├── productos/
│   │   │   ├── categorias/
│   │   │   ├── prospectos/
│   │   │   ├── cotizaciones/
│   │   │   ├── promociones/
│   │   │   ├── banners/
│   │   │   └── configuracion/
│   │   ├── api/
│   │   │   ├── export/[entity]/route.ts
│   │   │   └── import/products/route.ts
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── components/
│   │   ├── layout/ (Header, Footer, BottomNav, WhatsAppFloat)
│   │   ├── catalog/ (ProductCard, ProductGrid, Filters, SearchBar)
│   │   ├── product/ (Gallery, RelatedProducts, ShareButtons)
│   │   ├── cart/ (CartDrawer, CartItem, CartSummary)
│   │   ├── quote/ (QuoteForm)
│   │   └── admin/ (DataTable, ProductForm, StatsCard)
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── whatsapp/
│   │   │   ├── WhatsAppService.ts          # Capa de abstracción (sección 7)
│   │   │   └── messageTemplates.ts
│   │   ├── validations/ (zod schemas)
│   │   ├── folio.ts                        # Generador de folios
│   │   └── analytics.ts
│   ├── store/
│   │   └── cartStore.ts                    # Zustand + persist
│   ├── actions/                            # Server Actions
│   │   ├── products.ts
│   │   ├── quotes.ts
│   │   └── leads.ts
│   └── types/
├── public/
├── .env.example
└── README.md
```

---

## 7. ESTRATEGIA PARA WHATSAPP

**Principio:** ningún componente arma el mensaje de WhatsApp directamente. Todo pasa por `WhatsAppService`, y el número/configuración vive en `business_settings` (tabla), nunca hardcodeado.

```ts
// lib/whatsapp/WhatsAppService.ts (interfaz conceptual)
interface WhatsAppService {
  sendQuote(quote: QuoteWithItems): string;          // → wa.me link
  sendProductInquiry(product: Product): string;      // → wa.me link
  sendOrderConfirmation(order: Order): Promise<void>;// v2: Cloud API
  sendFollowUp(lead: Lead, stage: FollowUpStage): Promise<void>; // v2
}
```

- **v1 (esta implementación):** clase `WhatsAppLinkService` que construye el texto con las plantillas de las secciones 14 y 16, aplica `encodeURIComponent`, y devuelve `https://wa.me/<numero>?text=<mensaje>`.
- **v2 (futuro, sin reconstruir):** clase `WhatsAppCloudApiService` que implementa la misma interfaz pero llama a la API de Meta (envío directo, plantillas aprobadas, webhooks de respuesta). El resto del sistema no cambia porque depende de la interfaz, no de la implementación.
- El número de WhatsApp y el mensaje base se leen de `business_settings` en cada request (server-side), permitiendo cambiarlo desde `/admin/configuracion` sin tocar código.

---

## 8. ESTRATEGIA DE DEPLOYMENT

| Elemento | Dónde | Notas |
|---|---|---|
| Frontend + Server Actions | **Vercel** | Deploy automático por push a `main`; preview deploys por PR. |
| Base de datos | **Supabase (Postgres)** | Incluye backups automáticos, панel SQL, y Auth/Storage. |
| Imágenes | **Supabase Storage** | Bucket público para catálogo, políticas RLS para admin. |
| Variables de entorno | **Vercel Environment Variables** | Nunca en el repo; `.env.example` documenta las claves necesarias sin valores reales. |
| Dominio | Dominio propio apuntando a Vercel (CNAME) | Necesario para SEO y Open Graph consistentes. |
| CI mínimo | GitHub Actions (lint + typecheck + build) | Evita desplegar código roto. |

---

## 9. RIESGOS TÉCNICOS

| Riesgo | Mitigación |
|---|---|
| Mensajes de WhatsApp mal codificados (saltos de línea, `$`, `%`) | Uso estricto de `encodeURIComponent` centralizado en `WhatsAppService`, con tests dedicados (FASE 12). |
| Carrito perdido entre dispositivos | v1 acepta esta limitación (localStorage); arquitectura ya prevé `customers.id` para sync futuro post-login. |
| Crecimiento de catálogo (miles de SKUs) sin degradar velocidad | Paginación server-side + índices en Postgres + `next/image` con lazy loading desde el inicio, no como parche. |
| Uso indebido del panel admin | Supabase Auth + roles + middleware de rutas protegidas + RLS a nivel de base de datos como segunda capa. |
| Dependencia de wa.me para volumen alto de mensajes | Aceptable en v1 (uso manual por vendedor); capa de abstracción lista para Cloud API cuando el volumen lo justifique. |
| SEO débil si se usa client-side rendering para productos | Server-rendering obligatorio en `/productos/[slug]` con metadata dinámica; se verifica en FASE 11. |
| Importación masiva con datos corruptos | Validación fila por fila con Zod antes de insertar; reporte de errores sin abortar el resto del archivo. |

---

## 10. ROADMAP DE CONSTRUCCIÓN

| Fase | Entregable |
|---|---|
| 1 | Arquitectura (este documento) |
| 2 | Base de datos: schema Prisma completo + SQL + seed demo |
| 3 | Proyecto base Next.js configurado (Tailwind, Prisma, layout, variables de entorno) |
| 4 | Catálogo: listado, filtros, búsqueda, categorías |
| 5 | Ficha de producto (SEO, galería, relacionados, compartir) |
| 6 | Carrito (Zustand + persistencia + cálculo de subtotales) |
| 7 | Cotizador (formulario, folio, creación de lead/quote) |
| 8 | Integración WhatsApp (WhatsAppService, botón flotante, por producto y por cotización) |
| 9 | Panel administrativo (productos, categorías, promociones, banners, configuración) |
| 10 | Prospectos/CRM básico (estados, notas, historial) |
| 11 | SEO técnico + Analytics (sitemap, robots, Schema.org, GA4/Pixel) |
| 12 | Testing funcional de todo el embudo |
| 13 | Deployment a producción + datos demo + README final |

---

### Próximo paso

Si esta arquitectura te parece correcta, continúo con **FASE 2 — Base de datos** (schema de Prisma completo, SQL con constraints/índices, y seed con datos demo realistas de un catálogo de materiales de construcción). Si quieres ajustar algo del stack (por ejemplo, usar MySQL en vez de Postgres, o un backend separado) dime antes y lo adapto.
