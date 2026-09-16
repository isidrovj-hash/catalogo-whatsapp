# FASE 2 — BASE DE DATOS

## Archivos generados

| Archivo | Contenido |
|---|---|
| `prisma/schema.prisma` | Schema completo de Prisma (fuente de verdad para el código TypeScript) |
| `sql/schema.sql` | DDL puro en PostgreSQL — equivalente 1:1 al schema de Prisma, útil si se quiere inspeccionar o ejecutar directamente en Supabase SQL Editor |
| `prisma/seed.ts` | Datos demo: negocio, sucursal, 9 categorías, 5 marcas, 10 productos con inventario e imágenes, relaciones entre productos, 1 promoción, 2 banners, 1 cliente + 1 cotización + 1 lead de ejemplo (folio `COT-2026-000001`) |

> **Nota sobre validación:** el entorno de esta conversación no tiene salida de red hacia los binarios de motor de Prisma (`binaries.prisma.sh`), así que no pude ejecutar `prisma validate`/`prisma generate` aquí. Revisé el schema manualmente línea por línea contra el SQL. El primer paso al instalar el proyecto (sección de instalación, FASE 13) será correr `npx prisma validate` y `npx prisma generate` en tu máquina, donde sí habrá salida a internet — es un paso de segundos.

---

## 1. Tablas, llaves primarias y llaves foráneas

| Tabla | PK | FKs salientes | Regla de borrado |
|---|---|---|---|
| `users` | `id` (uuid) | — | — |
| `categories` | `id` | `parent_id → categories.id` | `SET NULL` (subcategoría queda huérfana, no se borra) |
| `brands` | `id` | — | — |
| `products` | `id` | `category_id → categories.id`, `brand_id → brands.id` | Categoría: `RESTRICT` (no se puede borrar una categoría con productos); Marca: `SET NULL` |
| `product_images` | `id` | `product_id → products.id` | `CASCADE` (la galería muere con el producto) |
| `product_relations` | `id` | `product_id`, `related_product_id → products.id` | `CASCADE` |
| `branches` | `id` | — | — |
| `inventory` | `id` | `product_id → products.id` (único, 1:1) | `CASCADE` |
| `customers` | `id` | — | — |
| `quotes` | `id` | `customer_id → customers.id` | `CASCADE` |
| `quote_items` | `id` | `quote_id → quotes.id`, `product_id → products.id` | Cotización: `CASCADE`; Producto: `RESTRICT` (protege el historial: no se puede borrar un producto que ya fue cotizado) |
| `leads` | `id` | `customer_id → customers.id`, `quote_id → quotes.id` (único, opcional) | Cliente: `CASCADE`; Cotización: `SET NULL` |
| `promotions` | `id` | `product_id`, `category_id` (ambos opcionales) | `SET NULL` |
| `banners` | `id` | — | — |
| `business_settings` | `id` | — | Fila única de configuración |
| `analytics_events` | `id` | `product_id → products.id` (opcional) | `SET NULL` (el evento histórico se conserva aunque el producto se borre) |

**Decisión de diseño clave — `quote_items.unit_price` es un snapshot:** se guarda el precio del producto al momento exacto de cotizar, no una referencia al precio actual. Si el producto cambia de precio después, las cotizaciones históricas no se alteran. Por eso `product_id` en `quote_items` usa `RESTRICT` en vez de `CASCADE`: nunca debe ser posible borrar un producto que ya tiene historial de cotización real.

---

## 2. Relaciones relevantes para el negocio

- **`categories` es autorreferente** (`parent_id`) para soportar categoría → subcategoría (ej. "Materiales para construcción" → "Cementos") sin límite de niveles ni tablas rígidas, tal como pide la sección 7 del prompt original.
- **`inventory` es 1:1 con `products`** en esta versión. El campo `show_exact_stock` decide si el cliente ve "12 disponibles" o solo la etiqueta genérica (`DISPONIBLE` / `POCAS_PIEZAS` / `AGOTADO`). La tabla `branches` ya existe de forma independiente para que, cuando se necesite inventario por sucursal, sea un cambio de `inventory.product_id UNIQUE` a `inventory (product_id, branch_id) UNIQUE` — sin rediseñar el resto del sistema.
- **`leads` se genera siempre a partir de un `customer`**, con un `quote_id` opcional: esto permite capturar un prospecto que solo preguntó por WhatsApp (sin cotización formal) y también el caso normal (cotización completa). El campo `origin` (enum) distingue el canal.
- **`product_relations` es autorreferente sobre `products`** con dos relaciones nombradas (`RelationFrom` / `RelationTo`) para permitir que el admin defina manualmente "también puedes necesitar" (sección 47), independiente de la sugerencia automática por categoría que se implementará en el frontend.

---

## 3. Índices

Los índices se diseñaron pensando en las consultas más frecuentes del catálogo público y del panel admin:

- **Búsqueda de texto completo:** `products.search_vector` (GIN) — combina nombre, SKU, descripción corta, descripción larga y tags con pesos distintos (`A` para nombre/SKU, `B` para descripción corta/tags, `C` para descripción larga), y usa `unaccent` para que "impermeabilizante" encuentre resultados aunque el usuario no escriba acentos.
- **Filtros de catálogo:** índices simples en `products.category_id`, `products.brand_id`, `products.active`, `products.featured`, `products.on_promotion` — cubren exactamente los filtros de la sección 9.
- **Tags:** índice GIN en `products.tags` (array) para filtrar por etiquetas libres.
- **Prospección:** `leads.status`, `leads.created_at` — para el dashboard de admin (sección 18) que necesita ordenar/filtrar por estado y fecha.
- **Analítica:** `analytics_events.type`, `product_id`, `created_at` — para reportes de "productos más consultados" y "más agregados" sin escanear toda la tabla.
- **Folio único:** `quotes.folio` con constraint `UNIQUE` — garantiza que nunca se dupliquen folios aunque se envíen cotizaciones simultáneas.

---

## 4. Restricciones (constraints) de integridad de negocio

- `products.price >= 0`, `promo_price >= 0`, `cost >= 0` — nunca se permite un precio negativo por error de captura.
- `promo_price <= price` — imposible configurar una "promoción" más cara que el precio normal.
- `inventory.stock >= 0` — el stock nunca puede quedar negativo aunque haya un error de resta concurrente.
- `quote_items.quantity > 0` — no se permiten líneas de pedido con cantidad cero o negativa.
- `promotions.end_date >= start_date` — evita promociones mal configuradas que nunca estarían activas.
- `product_relations`: `product_id <> related_product_id` — un producto no puede "relacionarse consigo mismo".

---

## 5. Cómo probar esta fase

```bash
# 1. Instalar dependencias del proyecto (se hace formalmente en FASE 3,
#    pero puedes adelantar la verificación de la base de datos):
npm install prisma @prisma/client

# 2. Define DATABASE_URL en .env apuntando a tu proyecto de Supabase
#    (ver .env.example en FASE 3)

# 3. Validar el schema
npx prisma validate

# 4. Generar el cliente TypeScript
npx prisma generate

# 5. Crear las tablas en la base de datos
npx prisma migrate dev --name init

# 6. Cargar los datos demo
npx prisma db seed
```

**Verificación esperada tras el seed:**
- 9 categorías (incluida 1 subcategoría: Cementos dentro de Materiales para construcción).
- 10 productos, cada uno con su registro de `inventory` y al menos 1 imagen.
- 1 cotización con folio `COT-2026-000001`, 2 líneas de producto, y su `lead` asociado en estado `NUEVO`.
- La tabla `business_settings` con el número de WhatsApp de prueba `528112345678` — este es el valor que la FASE 8 (integración WhatsApp) leerá dinámicamente, nunca hardcodeado.

Si `npx prisma migrate dev` falla, la causa más común es `DATABASE_URL` mal formada o el proyecto de Supabase con conexión por *pooler* (puerto 6543) en vez de la conexión directa (puerto 5432) que Prisma necesita para migraciones — usa la cadena "Direct connection" que Supabase entrega en Project Settings → Database.

---

## Errores potenciales a vigilar

1. **`Unsupported("tsvector")`**: Prisma no puede escribir este campo directamente; se llena solo vía el trigger SQL `products_search_vector_update()`. Si alguna vez seleccionas explícitamente este campo desde Prisma Client, no vendrá tipado — usa `$queryRaw` si necesitas leerlo directamente.
2. **Conexión pooled vs directa de Supabase**: usar la URL equivocada es el error #1 al migrar. Se documentará explícitamente en `.env.example` en la FASE 3.
3. **Orden de inserción en el seed**: el seed depende de que categorías y marcas existan antes que los productos, y productos antes que inventario/imágenes/relaciones — el archivo ya respeta ese orden.

---

## Próximo paso

Con la base de datos definida, continúo con **FASE 3 — Proyecto base de Next.js**: configuración inicial (Tailwind, Prisma Client singleton, layout raíz mobile-first, variables de entorno, conexión a Supabase Storage) para que a partir de la FASE 4 empecemos a construir el catálogo visible.
