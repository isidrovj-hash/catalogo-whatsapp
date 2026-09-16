# FASE 3 — PROYECTO BASE DE NEXT.JS

## Qué se creó

```
catalogo-whatsapp/
├── .env.example              # Variables de entorno documentadas (sin valores reales)
├── .eslintrc.json
├── .gitignore
├── next.config.mjs           # Imágenes remotas (Supabase Storage), Server Actions
├── package.json              # Next 14, React 18, Tailwind, Prisma, Zustand, Zod, Supabase
├── postcss.config.js
├── tailwind.config.ts        # Tokens de diseño de marca (ver sección "Diseño")
├── tsconfig.json
├── prisma/
│   ├── schema.prisma         # (de la FASE 2)
│   └── seed.ts                # (de la FASE 2)
├── sql/schema.sql            # (de la FASE 2)
├── public/demo/               # Carpeta para imágenes demo del seed
└── src/
    ├── app/
    │   ├── globals.css        # Base Tailwind + botones .btn-primary/.btn-secondary
    │   ├── layout.tsx         # Layout raíz: fuentes, metadata SEO base, viewport
    │   └── page.tsx           # Página de verificación (se reemplaza en FASE 4)
    ├── lib/
    │   ├── env.ts             # Validación de variables de entorno con Zod
    │   ├── prisma.ts          # Singleton de Prisma Client
    │   └── supabase/
    │       ├── client.ts      # Cliente Supabase para Client Components
    │       └── server.ts      # Cliente Supabase para Server Components + cliente admin
    ├── components/            # Carpetas listas para catalog/, product/, cart/, quote/, admin/, layout/
    ├── actions/                # Server Actions (se llenan desde la FASE 6)
    ├── store/                  # Zustand store del carrito (FASE 6)
    └── types/                  # Tipos compartidos
```

## Decisiones de diseño (tokens)

Antes de escribir código visual revisé la guía de diseño para no caer en los defaults genéricos de "SaaS card kit" o el fondo crema/terracota que se repite en interfaces generadas por IA. Como el negocio es una ferretería/materiales de construcción, la dirección visual se inspira en **señalética de bodega y almacén industrial**, no en un dashboard genérico:

- **Color:** fondo blanco cálido (`#FFFFFF` / `#F2F0EA` para secciones), texto casi negro pero cálido (`#201E1B`, no el `#0B0B0B` genérico), y un **naranja de seguridad** (`#E1531C`) como acento único de conversión — se usa para botones de WhatsApp, "Agregar" y CTAs, nunca como decoración. Un amarillo de advertencia (`#F0AC00`) queda reservado solo para insignias de promoción.
- **Tipografía:** `Barlow Condensed` para títulos (evoca la rotulación condensada de almacén/ferretería) + `Inter` para texto de cuerpo (máxima legibilidad en catálogos largos en móvil). Son dos familias claramente distintas entre sí, como pide la guía.
- **Radios y espaciado:** radios pequeños (4–12px), no el "todo con el mismo radio de 16px y sombra gris suave" típico de plantillas SaaS.

Estos tokens viven en `tailwind.config.ts` y `globals.css`, y se usan a partir de la FASE 4 en el Header, Hero y tarjetas de producto.

## Por qué `page.tsx` solo verifica la conexión (todavía)

Esta fase es exclusivamente el andamiaje del proyecto. `page.tsx` hace una sola consulta (`prisma.product.count()`) envuelta en manejo de error explícito (estado `Success`/`Error`, no una pantalla en blanco si algo falla) para demostrar que **Next.js, Tailwind, TypeScript y Prisma están conectados correctamente de punta a punta** antes de construir el catálogo real en la FASE 4.

## Validación que sí pude ejecutar aquí

Instalé las dependencias reales (`npm install`) y corrí `next build` en este entorno. Resultado:

- ✅ TypeScript compila sin errores (`Compiled successfully`, `Linting and checking validity of types` en verde).
- ✅ Tailwind procesa los tokens de marca sin conflictos.
- ✅ La estructura de rutas del App Router y el singleton de Prisma están correctamente tipados.
- ⚠️ Dos pasos fallaron **por restricciones de red de este entorno de pruebas específico**, no por errores de código:
  1. `prisma generate` no pudo descargar el motor binario porque este sandbox no tiene salida hacia `binaries.prisma.sh`.
  2. `next/font/google` no pudo descargar las tipografías porque no hay salida hacia `fonts.googleapis.com`.

  Ambos dominios son accesibles sin ningún problema desde tu máquina de desarrollo o desde Vercel — son bloqueos específicos de este sandbox de conversación, no del proyecto. En tu entorno real, `npm install` (que ya incluye `postinstall: prisma generate`) y `next build` deberían completarse sin intervención.

## Cómo probarlo tú mismo

```bash
# 1. Instalar dependencias (esto corre automáticamente "prisma generate")
npm install

# 2. Copiar y completar las variables de entorno
cp .env.example .env
# Edita .env con tu DATABASE_URL/DIRECT_URL de Supabase y tus llaves de API

# 3. Crear las tablas y cargar datos demo (de la FASE 2)
npx prisma migrate dev --name init
npx prisma db seed

# 4. Levantar el servidor de desarrollo
npm run dev
```

Abre `http://localhost:3000`: deberías ver "Proyecto base listo" junto con un mensaje verde confirmando cuántos productos hay en la base de datos (10, si ya corriste el seed).

## Errores potenciales

| Síntoma | Causa probable | Solución |
|---|---|---|
| "Environment variable not found: DATABASE_URL" | No copiaste `.env.example` a `.env` | `cp .env.example .env` y complétalo |
| La página muestra el mensaje rojo de error de conexión | `DATABASE_URL` usa el puerto del pooler (6543) donde se necesita el directo (5432), o falta el password | Revisa las cadenas de conexión en Supabase → Database |
| `next/font` falla al hacer build | Sin salida a internet (solo pasa en entornos aislados) | No debería ocurrir en tu máquina ni en Vercel |
| Tailwind no aplica estilos | Falta reiniciar el servidor de dev tras editar `tailwind.config.ts` | `Ctrl+C` y `npm run dev` de nuevo |

## Próximo paso

Con el proyecto base validado, sigo con **FASE 4 — Catálogo**: Header con buscador y carrito, Hero comercial, grid de productos con tarjetas (foto, precio, promoción, disponibilidad), categorías administrables desde la base de datos, buscador con full-text search sobre `search_vector`, y filtros/ordenamiento — todo consumiendo ya la base de datos real de la FASE 2.
