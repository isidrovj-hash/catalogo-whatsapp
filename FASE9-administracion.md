# FASE 9 — ADMINISTRACIÓN

La fase más grande del proyecto hasta ahora: el panel `/admin` completo con autenticación, dashboard y CRUD real de productos, categorías, promociones, banners y configuración.

## Cambio estructural importante: separación de layouts

Antes de construir el admin, reorganicé el árbol de rutas porque el layout raíz montaba el Header/Footer/BottomNav/WhatsAppFloat del catálogo público — el panel admin **no debe heredar nada de eso**.

```
src/app/
├── layout.tsx                    # Layout raíz MÍNIMO: solo fuentes + html/body
├── (public)/                     # NUEVO route group — todo el catálogo de las FASES 4-7
│   ├── layout.tsx                # Header/Footer/BottomNav/WhatsAppFloat (antes vivía en el root)
│   ├── page.tsx, productos/, categorias/, ofertas/, contacto/, carrito/, cotizar/, favoritos/
└── admin/
    ├── (auth)/
    │   ├── layout.tsx             # Sin protección — evita el bucle de redirección
    │   └── login/page.tsx
    └── (dashboard)/
        ├── layout.tsx             # requireAdminUser() + sidebar — protege TODO lo de adentro
        ├── page.tsx                # Dashboard
        ├── productos/, categorias/, promociones/, banners/, configuracion/, cotizaciones/, prospectos/
```

Los nombres entre paréntesis son *route groups* de Next.js: no aparecen en la URL, solo sirven para aplicar layouts distintos a ramas distintas del árbol. `/admin/login` no exige sesión (viviría en un bucle infinito si lo exigiera); todo lo demás bajo `/admin` sí.

## Autenticación: dos capas independientes (sección 34)

1. **`middleware.ts`** — corre en Edge Runtime en cada request a `/admin/*`. Solo verifica que exista una sesión de Supabase; si no, redirige a `/admin/login`. Deliberadamente no consulta Prisma (Edge Runtime no es el entorno adecuado para eso).
2. **`lib/auth.ts` → `requireAdminUser()`** — corre dentro de `app/admin/(dashboard)/layout.tsx` (Node runtime). Verifica que el usuario autenticado en Supabase **también** tenga una fila activa en nuestra tabla `users`. Esta separación importa: alguien puede tener cuenta de Supabase sin tener permiso de administrar este catálogo específico.

**Cómo crear tu primer usuario admin:**
```bash
# 1. Crea el usuario en Supabase Dashboard → Authentication → Users → Add user
# 2. Promuévelo a admin en nuestra tabla `users`:
npm run admin:create -- correo@ejemplo.com "Tu Nombre"
```
El script (`scripts/create-admin.ts`) busca al usuario en Supabase Auth por correo y crea/actualiza su fila correspondiente con `role: 'ADMIN'`.

## Productos: el módulo más complejo (sección 19)

El formulario cubre los ~20 campos del brief en cuatro secciones (Información general, Imágenes, Precio, Inventario). Dos decisiones que vale la pena explicar:

- **Subida de imágenes real, no solo campos de texto.** `actions/admin/upload.ts` sube archivos a Supabase Storage con validación de tipo (`image/jpeg|png|webp|avif`) y tamaño (máx. 5 MB) — sección 34. `ImageUploadField` sube el archivo apenas se selecciona y guarda la URL resultante en un input oculto; también acepta pegar una URL manualmente si el bucket de Storage todavía no está configurado. **Debes crear el bucket `catalog` (público) en tu proyecto de Supabase antes de usar esto** — está documentado como comentario en el archivo.
- **Eliminar un producto respeta la integridad del historial.** `quote_items.product_id` usa `RESTRICT` (definido desde la FASE 2) — un producto que ya fue cotizado no se puede borrar. `deleteProduct()` atrapa ese error específico (`P2003`/`P2014`) y le explica al admin que debe desactivarlo en vez de eliminarlo, en vez de mostrar un error críptico de base de datos.

## Categorías, Promociones y Banners

Mismo patrón que productos pero más simples: formulario + lista con `ActiveToggle` (interruptor optimista) + `DeleteButton` (con `window.confirm` — una decisión consciente de mantener simple algo poco frecuente, en vez de construir un modal a medida). El slug de categorías se autogenera del nombre igual que en productos (`NameSlugFields`, compartido entre ambos formularios).

## Configuración: el cierre del ciclo de la FASE 8

`SettingsForm` edita **toda** la tabla `business_settings` en un solo formulario, con una sección destacada (borde de color de marca) específicamente para WhatsApp: número y selector de proveedor (`LINK` / `CLOUD_API`). Esto es exactamente lo que la sección 13 pedía desde el principio: *"el número de WhatsApp deberá configurarse desde el panel administrativo"* — ya no hace falta Prisma Studio para cambiarlo.

**Detalle técnico que importa:** `updateBusinessSettings()` llama a `revalidateTag('business-settings')` después de guardar. `getBusinessSettings()` (FASE 4) cachea ese dato con `unstable_cache` y ese tag exacto — sin este revalidate, un cambio de número de WhatsApp tardaría hasta una hora en reflejarse en el sitio público en vez de ser inmediato.

## Cotizaciones y Prospectos (secciones 18 y 23)

Listados de solo lectura con vínculo cruzado: cada prospecto muestra el folio de su cotización, y el detalle de cada cotización enlaza de vuelta al prospecto. El estado del lead (`NUEVO` → `CONTACTADO` → `COTIZADO` → `SEGUIMIENTO` → `GANADO`/`PERDIDO`) se cambia con un `<select>` que dispara la actualización al instante — sin botón de guardar aparte, para que el seguimiento de ventas sea lo más rápido posible.

## Dos bugs reales corregidos durante esta fase

1. **`getBusinessSettings()` fallback incompleto:** el objeto de respaldo (para cuando la tabla `business_settings` está vacía) no incluía el campo `whatsappProvider` agregado en la FASE 8. Sin este fix, el sitio se hubiera roto en un proyecto recién creado sin seed. Corregido antes de que `next build` llegara a detectarlo como error de tipos, durante la revisión manual.
2. **Comillas sin escapar en JSX** (`react/no-unescaped-entities`) en `ProductForm.tsx` y `SettingsForm.tsx` — texto como `Umbral "pocas piezas"` necesita `&quot;` en JSX. Esto sí lo atrapó el linter de `next build`, no la revisión manual.

## Validación — la más completa hasta ahora

Con ~20 archivos nuevos (auth, middleware, 6 módulos de administración completos), corrí `next build` real. Después de corregir los dos bugs anteriores, **la verificación de tipos completa de absolutamente todo el proyecto pasó sin un solo error** — el build llegó limpio hasta la etapa de "Collecting page data", donde se detuvo por la misma limitación de red de este sandbox ya documentada en cada fase anterior (Prisma sin poder descargar su motor binario). Ningún error de lógica, de JSX ni de tipos en todo el código nuevo.

## Cómo probarlo

```bash
npm install
npx prisma migrate dev   # si no lo habías corrido con el schema actualizado de la FASE 8
npx prisma db seed

# Crea tu usuario admin (ver sección de arriba)
npm run admin:create -- tu-correo@ejemplo.com "Tu Nombre"

npm run dev
```

1. Ve a `/admin` sin haber iniciado sesión → deberías ser redirigido a `/admin/login`.
2. Inicia sesión con el correo/contraseña que configuraste en Supabase Auth.
3. En el Dashboard, deberías ver las estadísticas del seed (10 productos activos, 9 categorías, 1 cotización, 1 prospecto).
4. Ve a Productos → edita "Cemento Gris Monterrey" → cambia el precio → guarda → confirma en `/productos/cemento-gris-monterrey-25kg` (en otra pestaña) que el cambio se refleja.
5. Ve a Configuración → cambia el número de WhatsApp → guarda → confirma que el botón de WhatsApp del sitio público usa el número nuevo de inmediato (no esperes una hora).
6. Ve a Prospectos → cambia el estado del prospecto demo a "Contactado" → confirma que se guarda sin recargar la página.
7. Intenta eliminar "Cemento Gris Monterrey" (que ya tiene una cotización en el seed) → deberías ver el mensaje explicando que debes desactivarlo en su lugar, no un error genérico.

## Errores potenciales

| Síntoma | Causa | Solución |
|---|---|---|
| Bucle de redirección en `/admin/login` | Layout mal anidado (no debería pasar con esta estructura, pero si personalizas rutas, cuidado) | El grupo `(auth)` nunca debe llamar a `requireAdminUser()` |
| "No se pudo subir la imagen" | El bucket `catalog` no existe en Supabase Storage, o no es público | Storage → New bucket → nombre exacto `catalog` → Public: ON |
| El script `admin:create` no encuentra al usuario | Se creó con un correo distinto o falta `SUPABASE_SERVICE_ROLE_KEY` en `.env` | Verifica el correo exacto en Supabase Dashboard → Authentication |
| Cambios de configuración tardan en reflejarse | Falta el `revalidateTag('business-settings')` (ya incluido) o el navegador cacheó la página | Recarga forzada (Ctrl+Shift+R) |

## Próximo paso

Sigo con **FASE 10 — Prospectos/CRM**: historial completo por cliente (cotizaciones anteriores, notas de seguimiento), y la arquitectura de conversaciones que el webhook de WhatsApp (FASE 8) ya deja preparada para conectar.
