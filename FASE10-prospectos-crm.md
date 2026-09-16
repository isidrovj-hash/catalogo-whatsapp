# FASE 10 — PROSPECTOS/CRM

## Qué se construyó

```
prisma/schema.prisma                          # + modelo CustomerNote, + relación en User
sql/schema.sql                                # + tabla customer_notes, + bloque de migración manual

src/actions/admin/customers.ts                # updateCustomer, addCustomerNote, deleteCustomerNote
src/components/admin/
├── CustomerEditForm.tsx                       # Edición de datos del cliente (client)
└── CustomerNotes.tsx                          # Timeline de notas: agregar/eliminar (client)

src/app/admin/(dashboard)/clientes/
├── page.tsx                                    # Listado de clientes con búsqueda
└── [id]/page.tsx                               # Perfil completo: datos, cotizaciones, prospectos, notas
```

Más: enlaces cruzados desde `/admin/prospectos` y `/admin/cotizaciones` hacia el perfil de cliente, entrada "Clientes" en `AdminSidebar.tsx`, y una nota de ejemplo agregada al seed.

> **Nota:** este documento se escribió después de construir el código de la fase — se me pasó guardarlo en su momento. El contenido describe exactamente lo que ya está implementado y validado (ver la sección de validación abajo, que sí se hizo en su momento).

## Nuevo modelo: `CustomerNote`

```prisma
model CustomerNote {
  id         String   @id @default(uuid())
  customerId String   @map("customer_id")
  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  authorId   String?  @map("author_id")
  author     User?    @relation(fields: [authorId], references: [id], onDelete: SetNull)
  content    String
  createdAt  DateTime @default(now()) @map("created_at")
}
```

**Decisión de diseño deliberada:** la nota se asocia al **cliente**, no a una cotización puntual. La sección 41 del brief pide un historial de "Notas" y "Seguimientos" por cliente — un vendedor anota contexto ("prefiere que le hablen por la tarde", "compra para varias obras a la vez") que aplica a toda la relación comercial, no a un pedido específico. Si una nota estuviera atada a una `quote`, se perdería en cuanto el cliente hiciera una segunda cotización.

`authorId` es opcional y usa `onDelete: SetNull`: si el usuario admin que escribió la nota se elimina más adelante, la nota permanece (con autor desconocido) en vez de desaparecer — el historial de seguimiento es más valioso que la atribución exacta.

## Perfil de cliente (`/admin/clientes/[id]`)

Una sola pantalla reúne todo lo que la sección 41 pide, con una excepción documentada abajo:

- **Historial de cotizaciones**: todas las `quotes` del cliente, con folio, fecha, cantidad de productos y subtotal, cada una enlazada al detalle completo (`/admin/cotizaciones/[id]`, de la FASE 9).
- **Prospectos asociados**: cada `lead` con su estado y origen.
- **Notas y seguimiento**: el componente `CustomerNotes` — timeline con quién escribió cada nota y cuándo, más un formulario para agregar una nueva sin recargar la página.
- **Datos del cliente editables**: `CustomerEditForm` permite corregir nombre, teléfono, empresa, correo, ciudad, colonia y tipo de cliente directamente desde el perfil.

### Lo que NO se muestra, y por qué

La sección 41 también pide "productos consultados" en el historial del cliente. **Esto no se implementó**, y se documenta explícitamente en el código (`clientes/[id]/page.tsx`) en vez de simularlo: los eventos de analítica (`PRODUCT_VIEW`, tabla `analytics_events`, FASE 4/5) se registran por **sesión anónima**, no por cliente identificado. Un visitante navega libremente el catálogo — sin iniciar sesión — antes de dejar sus datos en un formulario de cotización. Conectar "qué productos vio esta persona antes de convertirse en lead" requeriría cuentas de cliente con autenticación (login), lo cual está fuera del alcance de este catálogo sin pago online. Es una limitación de arquitectura real, no un descuido.

## Server Actions

`actions/admin/customers.ts` expone tres funciones, todas protegidas por `requireAdminUser()`:

- `updateCustomer(id, formData)` — valida que nombre y teléfono no estén vacíos y que el tipo de cliente sea uno de los 6 valores válidos del enum antes de guardar.
- `addCustomerNote(customerId, content)` — rechaza notas vacías; asocia automáticamente al usuario admin autenticado como autor.
- `deleteCustomerNote(noteId, customerId)` — recibe ambos ids porque, tras borrar, necesita saber qué ruta revalidar (`/admin/clientes/[customerId]`).

## Validación (realizada en su momento, con los mismos resultados que las demás fases)

Se corrió `next build` real después de construir este código. Tras corregir un bug real encontrado durante esa validación —`startTransition` en `CustomerNotes.tsx` recibía una función que retornaba `Promise<{ok, error}>` en vez de `void`, y TypeScript lo marcó correctamente— **la verificación de tipos de todo el proyecto pasó sin errores**, incluyendo el nuevo modelo de datos y todos los componentes de esta fase. El build se detuvo únicamente en la etapa de recolección de datos, por la misma limitación de red de este sandbox (motor de Prisma sin generar) documentada desde la FASE 3.

## Cómo probarlo

```bash
npm run dev
```

1. Ve a `/admin/clientes` y busca "Juan" (el cliente demo del seed).
2. Entra a su perfil: deberías ver la cotización `COT-2026-000001`, el prospecto en estado `NUEVO`, y una nota de ejemplo ("Prefiere que le llamen por la tarde...").
3. Agrega una nota nueva y confirma que aparece al instante, con tu nombre de usuario admin como autor.
4. Edita el teléfono del cliente y guarda — confirma que el cambio persiste al recargar la página.
5. Desde `/admin/prospectos` o `/admin/cotizaciones`, haz click en el nombre del cliente y confirma que te lleva al mismo perfil.

## Próximo paso

Con esta fase completa, el proyecto continuó hacia **FASE 11 — SEO/Analytics** (ver `FASE11-seo-analytics.md`).
