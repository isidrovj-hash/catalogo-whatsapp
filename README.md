# Catálogo Digital + WhatsApp

Catálogo digital de productos con carrito, cotizador y envío directo por WhatsApp, panel administrativo completo, y base preparada para evolucionar hacia un CRM. Construido con Next.js 14, TypeScript, Tailwind CSS, Prisma/PostgreSQL (Supabase) y Zustand.

> Este README es el punto de entrada. El proyecto se construyó en 13 fases documentadas individualmente en `FASE1-arquitectura.md` … `FASE13-deployment.md` — consúltalas para el detalle de decisiones de cada área.

---

## Qué incluye

- **Catálogo público** con búsqueda de texto completo, filtros, categorías/subcategorías ilimitadas, ofertas y productos destacados.
- **Ficha de producto** con galería, productos relacionados, Schema.org (`Product`, `BreadcrumbList`) y Open Graph dinámico.
- **Carrito** persistente (sin necesidad de cuenta), favoritos, venta cruzada, y "compartir pedido".
- **Cotizador** que genera folios reales y correlativos (`COT-2026-000001`) y arma el mensaje de WhatsApp automáticamente.
- **Integración de WhatsApp** mediante una capa de abstracción (`WhatsAppService`) que hoy usa enlaces `wa.me` y está lista para migrar a WhatsApp Business Cloud API sin tocar el resto del sistema.
- **Panel administrativo** (`/admin`) con autenticación (Supabase Auth): productos, categorías, promociones, banners, configuración del negocio, cotizaciones, prospectos y perfil de cliente (CRM básico).
- **SEO técnico**: sitemap y robots.txt dinámicos, Schema.org `LocalBusiness`, metadata por página.
- **Analítica**: eventos internos en base de datos (para el dashboard del admin) + integración opcional con GA4/Meta Pixel.
- **67 pruebas unitarias automatizadas** (Vitest) sobre la lógica de negocio crítica: carrito, folios, y muy especialmente la codificación de caracteres especiales en los mensajes de WhatsApp.

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 (App Router), TypeScript, Server Actions |
| Estilos | Tailwind CSS |
| Base de datos | PostgreSQL vía Supabase, Prisma ORM |
| Autenticación | Supabase Auth |
| Almacenamiento de imágenes | Supabase Storage |
| Estado del carrito/favoritos | Zustand + persist (localStorage) |
| Pruebas | Vitest (unitarias, automatizadas) + Playwright (E2E, scaffold) |
| Hosting recomendado | Vercel |

## Estructura del proyecto

```
src/
├── app/
│   ├── (public)/          # Catálogo, producto, carrito, cotizar, contacto, favoritos
│   ├── admin/
│   │   ├── (auth)/        # Login — sin protección
│   │   └── (dashboard)/   # Todo lo demás — protegido por requireAdminUser()
│   ├── api/                # Webhook de WhatsApp, healthcheck
│   ├── sitemap.ts, robots.ts
│   └── layout.tsx          # Layout raíz mínimo (fuentes + html/body)
├── actions/                # Server Actions (públicas y /admin)
├── components/             # catalog/, product/, cart/, quote/, layout/, admin/, analytics/
├── lib/                    # data/ (consultas Prisma), whatsapp/, validations/, auth.ts, etc.
└── store/                  # Zustand: cartStore, favoritesStore

prisma/
├── schema.prisma           # Fuente de verdad del modelo de datos
└── seed.ts                 # Datos demo (10 productos, categorías, 1 cotización)

sql/
├── schema.sql               # Referencia SQL completa (alternativa a Prisma)
└── functions.sql            # Extensiones/funciones/triggers que Prisma no expresa

e2e/                         # Pruebas Playwright (scaffold, ver FASE12)
scripts/create-admin.ts      # Promueve un usuario de Supabase Auth a admin del panel
```

## Puesta en marcha local

### 1. Requisitos

- Node.js 20+
- Una cuenta de [Supabase](https://supabase.com) (gratis) — provee Postgres, Auth y Storage

### 2. Instalar y configurar

```bash
npm install
cp .env.example .env
```

Completa `.env` con las credenciales de tu proyecto de Supabase (Project Settings → Database y → API). El archivo `.env.example` explica cada variable, incluyendo cuáles son opcionales (WhatsApp Cloud API, GA4/Meta Pixel).

### 3. Base de datos

```bash
npx prisma db push          # crea las tablas a partir de prisma/schema.prisma
psql "$DATABASE_URL" -f sql/functions.sql   # funciones/triggers que Prisma no expresa
npx prisma db seed          # datos demo: 10 productos, categorías, 1 cotización
```

> En Supabase, `DATABASE_URL` para `psql`/migraciones debe ser la cadena de **conexión directa** (puerto 5432), no la del pooler (6543) — ver el comentario en `.env.example`.

También necesitas crear el bucket de Storage para imágenes:
**Supabase Dashboard → Storage → New bucket → nombre `catalog` → Public bucket: ON.**

### 4. Tu primer usuario administrador

```bash
# 1. Crea el usuario en Supabase Dashboard → Authentication → Users → Add user
# 2. Promuévelo a admin:
npm run admin:create -- tu-correo@ejemplo.com "Tu Nombre"
```

### 5. Levantar el proyecto

```bash
npm run dev
```

Abre `http://localhost:3000` (catálogo) y `http://localhost:3000/admin` (panel).

## Comandos disponibles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Build y arranque de producción |
| `npm run lint` | ESLint |
| `npm run test` | 67 pruebas unitarias (Vitest) |
| `npm run test:e2e` | Pruebas E2E con Playwright (requiere servidor + DB reales, ver FASE12) |
| `npm run db:migrate` | `prisma migrate dev` (entornos con historial de migraciones) |
| `npm run db:seed` | Recarga los datos demo |
| `npm run db:studio` | Explorador visual de la base de datos (Prisma Studio) |
| `npm run admin:create -- correo "Nombre"` | Promueve un usuario a admin del panel |

## Variables de entorno

Ver `.env.example` para la lista completa con comentarios. Resumen:

| Variable | Requerida | Para qué |
|---|---|---|
| `DATABASE_URL` | Sí | Conexión a Postgres (pooler en producción) |
| `DIRECT_URL` | Sí (migraciones) | Conexión directa, para `prisma migrate`/`db push` |
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | Sí | Cliente de Supabase (Auth, Storage) |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | Solo servidor — Storage admin, script de creación de admins |
| `NEXT_PUBLIC_SITE_URL` | Sí | URLs absolutas (Open Graph, sitemap, enlaces de WhatsApp) |
| `WHATSAPP_CLOUD_API_*` | No | Solo si activas el proveedor `CLOUD_API` (FASE 8) |
| `NEXT_PUBLIC_GA4_ID` / `NEXT_PUBLIC_META_PIXEL_ID` | No | Analítica externa opcional (FASE 11) |

**El número de WhatsApp del negocio NO es una variable de entorno** — vive en la tabla `business_settings` y se administra desde `/admin/configuracion`, precisamente para poder cambiarlo sin redesplegar.

## Despliegue a producción

Ver **`FASE13-deployment.md`** para la guía completa paso a paso (Vercel + Supabase, dominio, variables de entorno de producción, checklist post-despliegue). Resumen rápido:

1. Sube el repositorio a GitHub.
2. Crea un proyecto en [Vercel](https://vercel.com) e impórtalo.
3. Configura las variables de entorno de producción en Vercel (mismas que `.env`, con `NEXT_PUBLIC_SITE_URL` apuntando a tu dominio real).
4. Aplica el schema y las funciones a tu base de datos de Supabase de producción (mismos comandos que en local, contra el `DATABASE_URL` de producción).
5. Crea tu usuario admin de producción con `npm run admin:create`.
6. Despliega. Vercel construye y sirve automáticamente en cada push a `main`.

## Documentación por fase

| Fase | Contenido |
|---|---|
| [FASE1-arquitectura.md](./FASE1-arquitectura.md) | Stack, diagrama, modelo de datos, roadmap |
| [FASE2-database.md](./FASE2-database.md) | Schema completo, relaciones, índices, restricciones |
| [FASE3-proyecto-base.md](./FASE3-proyecto-base.md) | Setup de Next.js, Tailwind, tokens de diseño |
| [FASE4-catalogo.md](./FASE4-catalogo.md) | Búsqueda, filtros, carrito inicial, WhatsAppService |
| [FASE5-ficha-producto.md](./FASE5-ficha-producto.md) | Galería, relacionados, Schema.org, Open Graph |
| [FASE6-carrito.md](./FASE6-carrito.md) | Favoritos, venta cruzada, compartir pedido |
| [FASE7-cotizador.md](./FASE7-cotizador.md) | Folio real, persistencia transaccional |
| [FASE8-integracion-whatsapp.md](./FASE8-integracion-whatsapp.md) | WhatsApp Cloud API, webhook, selección de proveedor |
| [FASE9-administracion.md](./FASE9-administracion.md) | Panel admin completo, autenticación, CRUD |
| [FASE10-prospectos-crm.md](./FASE10-prospectos-crm.md) | Perfil de cliente, notas de seguimiento |
| [FASE11-seo-analytics.md](./FASE11-seo-analytics.md) | Sitemap, robots, GA4/Meta Pixel |
| [FASE12-testing.md](./FASE12-testing.md) | 67 pruebas unitarias, checklist de QA manual |
| [FASE13-deployment.md](./FASE13-deployment.md) | Guía de despliegue completa |

## Una nota sobre las limitaciones de validación durante el desarrollo

Este proyecto se construyó y validó en un entorno sin salida de red hacia `binaries.prisma.sh`, así que el cliente de Prisma nunca pudo generarse completamente ahí. Cada fase documenta esto explícitamente: la verificación de tipos de **todo** el proyecto se confirmó limpia (`next build` sin errores) en repetidas ocasiones a lo largo del desarrollo, y las 67 pruebas unitarias de la FASE 12 sí corrieron de principio a fin con éxito. En tu máquina o en Vercel, donde el motor de Prisma sí se descarga con normalidad, `npm install` y `npm run build` deberían completarse sin ningún paso adicional.

## Roadmap más allá de esta versión

Preparado pero no construido en esta versión (documentado explícitamente en las fases correspondientes para no fingir que está resuelto):

- **Seguimiento automático por tiempo** (30 min / 24 h / 72 h, sección 42): `WhatsAppCloudApiService.sendFollowUp()` ya sabe *cómo* enviar el mensaje; falta el *job programado* que decida *cuándo*, y el consentimiento explícito del cliente antes de activarlo.
- **Multi-sucursal con inventario independiente**: la tabla `branches` ya existe separada de `inventory`; pasar a inventario por sucursal es una migración de `inventory.product_id UNIQUE` a `(product_id, branch_id) UNIQUE`, sin rediseño.
- **Importación/exportación masiva** (CSV/Excel, secciones 35-36): no incluida en esta versión.
- **"Productos consultados" en el perfil de cliente** (sección 41): los eventos de analítica se registran por sesión anónima, no por cliente identificado — requeriría cuentas de cliente con login.
