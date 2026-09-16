# FASE 13 — DEPLOYMENT

## Qué se construyó

```
.github/workflows/ci.yml          # CI: Postgres real de servicio, lint, tipos, pruebas, build
sql/functions.sql                 # NUEVO: extraído de schema.sql para aplicarse junto a "prisma db push"
src/app/api/health/route.ts       # Healthcheck para monitoreo post-despliegue
README.md                         # Documento raíz que amarra las 13 fases
```

## El cambio más importante de esta fase: CI que sí prueba contra una base de datos real

Hasta ahora, la validación de cada fase (documentada en cada `FASE*.md`) se hizo con `next build` en este sandbox, que no tiene salida de red hacia el motor de Prisma. Eso fue honesto y suficiente para verificar tipos, pero un pipeline de CI real para este proyecto necesita algo más fuerte: **un Postgres real, de principio a fin**.

`.github/workflows/ci.yml` levanta un contenedor de Postgres 16 como servicio del job, y en cada push/PR:

1. Instala dependencias (`prisma generate` corre automáticamente vía `postinstall`, y esta vez sí tiene salida a internet).
2. Crea las tablas con `prisma db push` contra ese Postgres efímero.
3. Aplica `sql/functions.sql` (extensiones, triggers, la función de folio) — la pieza que Prisma no puede expresar.
4. Corre lint, las 67 pruebas unitarias, y el build de producción completo.

Esto significa que, a diferencia de este sandbox, **el CI de GitHub Actions sí puede validar que `/sitemap.xml` genera correctamente contra datos reales** — cerrando la única brecha de validación que quedó documentada en la FASE 11.

## Por qué separé `sql/functions.sql` de `sql/schema.sql`

`sql/schema.sql` (de la FASE 2) era la referencia completa de la base de datos en un solo archivo — pensado para quien quisiera crear todo con SQL puro, sin Prisma. Pero el flujo real del proyecto usa `prisma db push`/`migrate` para las tablas, y solo necesita las piezas que Prisma no puede modelar (extensiones, funciones PL/pgSQL, triggers) aplicadas aparte. Tener eso mezclado en un solo archivo obligaba a elegir entre "aplico todo con SQL puro" o "aplico todo con Prisma" sin una tercera opción limpia para el caso real (mixto). `sql/functions.sql` es exactamente esa tercera opción — y es lo que usa el CI nuevo.

## Guía de despliegue: Vercel + Supabase

### 1. Supabase (base de datos, auth, storage)

Si ya veniste siguiendo las fases anteriores en desarrollo, probablemente ya tengas un proyecto de Supabase — para producción, la recomendación es **un proyecto de Supabase separado del de desarrollo** (así nunca hay riesgo de que pruebas locales toquen datos reales de clientes).

1. Crea el proyecto en [supabase.com](https://supabase.com).
2. Copia las credenciales de **Project Settings → API** (`URL`, `anon key`, `service_role key`) y de **Project Settings → Database** (cadena de conexión — usa la de **Connection pooling** para `DATABASE_URL` y la **Direct connection** para `DIRECT_URL`).
3. Aplica el schema:
   ```bash
   DATABASE_URL="<tu-direct-url-de-produccion>" npx prisma db push
   psql "<tu-direct-url-de-produccion>" -f sql/functions.sql
   ```
4. Crea el bucket de Storage: **Storage → New bucket → `catalog` → Public: ON.**
5. (Opcional) Carga datos demo con `npx prisma db seed`, o crea tus productos reales directamente desde `/admin` una vez desplegado.

### 2. Vercel (hosting)

1. Sube el repositorio a GitHub (si no lo has hecho).
2. En [vercel.com](https://vercel.com) → **New Project** → importa el repositorio.
3. Framework Preset: Vercel detecta Next.js automáticamente. No hace falta configurar nada más ahí.
4. **Environment Variables** — agrega todas las de `.env.example` con tus valores de producción. Las más importantes:
   - `NEXT_PUBLIC_SITE_URL` → tu dominio real (ej. `https://materialesdelnorte.mx`), **no** `localhost`.
   - `DATABASE_URL` → la cadena de **pooler** de Supabase (puerto 6543) — importante para funciones serverless, que abren muchas conexiones cortas.
   - El resto, igual que en tu `.env` local pero con los valores del proyecto de Supabase de producción.
5. **Deploy.** Vercel construye con `npm run build` y despliega automáticamente.

### 3. Dominio propio

En Vercel: **Project → Settings → Domains** → agrega tu dominio y sigue las instrucciones de DNS (típicamente un registro `CNAME` o `A` según tu proveedor). Vercel emite el certificado HTTPS automáticamente — no hay nada manual que hacer para SSL.

### 4. Tu primer usuario administrador de producción

```bash
# Con las variables de entorno de PRODUCCIÓN en tu .env local temporalmente:
npm run admin:create -- tu-correo@ejemplo.com "Tu Nombre"
```

(Crea antes el usuario en el Supabase Auth de producción, igual que en desarrollo — ver FASE 9.)

### 5. WhatsApp Business Cloud API (opcional)

Si vas a activar el proveedor `CLOUD_API` (FASE 8) en producción, registra el webhook con tu dominio real:
```
https://tu-dominio.com/api/webhooks/whatsapp
```

## Checklist post-despliegue

- [ ] `https://tu-dominio.com/api/health` responde `{"status":"ok","database":"connected"}`.
- [ ] `https://tu-dominio.com/sitemap.xml` lista tus productos y categorías reales.
- [ ] `https://tu-dominio.com/admin/login` carga y puedes iniciar sesión con tu usuario admin de producción.
- [ ] El botón de WhatsApp abre con el número correcto (verifica `business_settings` en el Supabase de producción, no el de desarrollo).
- [ ] Sube al menos un producto real con imagen (verifica que el bucket `catalog` de Storage esté en modo público) y confírmalo visible en el catálogo.
- [ ] Corre una cotización de prueba de punta a punta y confirma que el folio generado es `COT-<año>-000001` (o el siguiente correlativo si ya hiciste pruebas).
- [ ] Si usas GA4/Meta Pixel, confirma en "Tiempo real" que los eventos llegan desde el dominio de producción.

## Mantenimiento continuo

- **Migraciones futuras de schema**: usa `npx prisma migrate dev --name <descripcion>` en desarrollo (genera un archivo de migración versionado), y `npx prisma migrate deploy` contra producción — no `db push` en producción una vez que el sitio esté en vivo, para no arriesgar pérdida de datos por diffs automáticos.
- **Nuevas funciones/triggers SQL**: agrégalas a `sql/functions.sql` (es idempotente) y vuelve a aplicarlo tanto en desarrollo como en producción.
- **Backups**: Supabase hace backups automáticos diarios en los planes pagos; en el plan gratuito, considera exportar `pg_dump` periódicamente mientras el proyecto crece.

## Cierre del proyecto

Con esta fase se completan las 13 fases planeadas desde `FASE1-arquitectura.md`. El sistema cubre el embudo completo pedido desde el inicio:

```
MOSTRAR → INTERESAR → COTIZAR → WHATSAPP → SEGUIMIENTO → VENDER
```

con catálogo, carrito, cotizador, WhatsApp, captura de prospectos, panel administrativo y una base ya lista para crecer hacia un CRM completo — exactamente el objetivo planteado en la sección 54 del brief original.
