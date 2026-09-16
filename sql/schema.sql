-- ============================================================================
-- CATÁLOGO DIGITAL + WHATSAPP — SQL DDL (PostgreSQL 15+)
-- FASE 2 — Corresponde 1:1 al schema.prisma
--
-- NOTA (agregada en la FASE 13): este archivo es la referencia COMPLETA de
-- la base de datos (tablas + funciones + triggers) para quien prefiera
-- crearla con SQL puro, de una sola vez. Si en cambio usas el flujo normal
-- del proyecto (`npx prisma db push` o `migrate`), las tablas ya las crea
-- Prisma a partir de schema.prisma, y solo necesitas aplicar por separado
-- `sql/functions.sql` — que contiene ÚNICAMENTE las piezas que Prisma no
-- puede expresar (extensiones, funciones PL/pgSQL, triggers). No apliques
-- ambos archivos completos sobre la misma base de datos: duplicarías las
-- definiciones de función (inofensivo, son CREATE OR REPLACE) pero también
-- intentarías crear las tablas dos veces (sí falla).
-- ============================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "unaccent";   -- búsqueda sin acentos

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------

CREATE TYPE user_role AS ENUM ('ADMIN', 'EDITOR');
CREATE TYPE availability_status AS ENUM ('DISPONIBLE', 'POCAS_PIEZAS', 'AGOTADO', 'SOBRE_PEDIDO');
CREATE TYPE price_mode AS ENUM ('MOSTRAR_PRECIO', 'SOLICITAR_PRECIO');
CREATE TYPE whatsapp_provider AS ENUM ('LINK', 'CLOUD_API');
CREATE TYPE customer_type AS ENUM ('PARTICULAR', 'CONTRATISTA', 'EMPRESA', 'CONSTRUCTOR', 'MAYORISTA', 'OTRO');
CREATE TYPE lead_status AS ENUM ('NUEVO', 'CONTACTADO', 'COTIZADO', 'SEGUIMIENTO', 'GANADO', 'PERDIDO');
CREATE TYPE lead_origin AS ENUM ('CATALOGO_WHATSAPP', 'WHATSAPP_PRODUCTO', 'FORMULARIO_CONTACTO', 'OTRO');
CREATE TYPE analytics_event_type AS ENUM (
  'PRODUCT_VIEW', 'ADD_TO_CART', 'REMOVE_FROM_CART', 'WHATSAPP_PRODUCT_CLICK',
  'QUOTE_STARTED', 'QUOTE_SUBMITTED', 'WHATSAPP_QUOTE_CLICK', 'SEARCH', 'CATEGORY_VIEW'
);

-- ----------------------------------------------------------------------------
-- USERS (panel administrativo)
-- ----------------------------------------------------------------------------

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_id   TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'EDITOR',
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- CATEGORIES (jerárquicas: soporta subcategorías)
-- ----------------------------------------------------------------------------

CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_url   TEXT,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- ----------------------------------------------------------------------------
-- BRANDS
-- ----------------------------------------------------------------------------

CREATE TABLE brands (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE,
  logo_url   TEXT,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- PRODUCTS
-- ----------------------------------------------------------------------------

CREATE TABLE products (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku                TEXT NOT NULL UNIQUE,
  name               TEXT NOT NULL,
  slug               TEXT NOT NULL UNIQUE,
  short_description  TEXT,
  description        TEXT,
  category_id        UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  brand_id           UUID REFERENCES brands(id) ON DELETE SET NULL,

  price              NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  promo_price        NUMERIC(10,2) CHECK (promo_price >= 0),
  cost               NUMERIC(10,2) CHECK (cost >= 0),
  price_mode         price_mode NOT NULL DEFAULT 'MOSTRAR_PRECIO',

  unit               TEXT NOT NULL,
  presentation       TEXT NOT NULL,

  main_image_url     TEXT,
  tags               TEXT[] NOT NULL DEFAULT '{}',

  featured           BOOLEAN NOT NULL DEFAULT FALSE,
  on_promotion       BOOLEAN NOT NULL DEFAULT FALSE,
  active             BOOLEAN NOT NULL DEFAULT TRUE,

  meta_title         TEXT,
  meta_description   TEXT,
  search_vector      TSVECTOR,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_promo_lower_than_price CHECK (promo_price IS NULL OR promo_price <= price)
);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_products_on_promotion ON products(on_promotion);
CREATE INDEX idx_products_search_vector ON products USING GIN (search_vector);
CREATE INDEX idx_products_tags ON products USING GIN (tags);

-- Trigger: mantener search_vector actualizado automáticamente
CREATE OR REPLACE FUNCTION products_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', unaccent(coalesce(NEW.name, ''))), 'A') ||
    setweight(to_tsvector('spanish', unaccent(coalesce(NEW.sku, ''))), 'A') ||
    setweight(to_tsvector('spanish', unaccent(coalesce(NEW.short_description, ''))), 'B') ||
    setweight(to_tsvector('spanish', unaccent(coalesce(NEW.description, ''))), 'C') ||
    setweight(to_tsvector('spanish', unaccent(array_to_string(NEW.tags, ' '))), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_search_vector
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();

-- ----------------------------------------------------------------------------
-- PRODUCT IMAGES (galería)
-- ----------------------------------------------------------------------------

CREATE TABLE product_images (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  alt_text   TEXT,
  sort_order INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_product_images_product_id ON product_images(product_id);

-- ----------------------------------------------------------------------------
-- PRODUCT RELATIONS (productos relacionados, definidos manualmente)
-- ----------------------------------------------------------------------------

CREATE TABLE product_relations (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id         UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  related_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE (product_id, related_product_id),
  CHECK (product_id <> related_product_id)
);

-- ----------------------------------------------------------------------------
-- BRANCHES
-- ----------------------------------------------------------------------------

CREATE TABLE branches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  address         TEXT NOT NULL,
  city            TEXT NOT NULL,
  state           TEXT NOT NULL,
  phone           TEXT,
  whatsapp        TEXT,
  google_maps_url TEXT,
  schedule        TEXT,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- INVENTORY (1:1 con products en v1; ampliable a 1:N por sucursal)
-- ----------------------------------------------------------------------------

CREATE TABLE inventory (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  stock               INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  low_stock_threshold INT NOT NULL DEFAULT 5,
  availability        availability_status NOT NULL DEFAULT 'DISPONIBLE',
  show_exact_stock    BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- CUSTOMERS
-- ----------------------------------------------------------------------------

CREATE TABLE customers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  company      TEXT,
  phone        TEXT NOT NULL,
  email        TEXT,
  city         TEXT,
  neighborhood TEXT,
  type         customer_type NOT NULL DEFAULT 'PARTICULAR',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_customers_phone ON customers(phone);

-- ----------------------------------------------------------------------------
-- CUSTOMER NOTES (FASE 10, sección 41 — historial de seguimiento por cliente)
-- ----------------------------------------------------------------------------

CREATE TABLE customer_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_customer_notes_customer_id ON customer_notes(customer_id);

-- ----------------------------------------------------------------------------
-- QUOTES + QUOTE_ITEMS
-- ----------------------------------------------------------------------------

CREATE TABLE quotes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio       TEXT NOT NULL UNIQUE, -- ej. COT-2026-000001
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  comments    TEXT,
  subtotal    NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX idx_quotes_created_at ON quotes(created_at);

CREATE TABLE quote_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id   UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity   INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0), -- snapshot al momento de cotizar
  subtotal   NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0)
);
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX idx_quote_items_product_id ON quote_items(product_id);

-- ----------------------------------------------------------------------------
-- LEADS (prospectos — se generan al cotizar o preguntar por WhatsApp)
-- ----------------------------------------------------------------------------

CREATE TABLE leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  quote_id        UUID UNIQUE REFERENCES quotes(id) ON DELETE SET NULL,
  status          lead_status NOT NULL DEFAULT 'NUEVO',
  origin          lead_origin NOT NULL DEFAULT 'CATALOGO_WHATSAPP',
  estimated_total NUMERIC(10,2),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_leads_customer_id ON leads(customer_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);

-- ----------------------------------------------------------------------------
-- PROMOTIONS
-- ----------------------------------------------------------------------------

CREATE TABLE promotions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  start_date  TIMESTAMPTZ NOT NULL,
  end_date    TIMESTAMPTZ NOT NULL,
  product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  promo_price NUMERIC(10,2) CHECK (promo_price >= 0),
  image_url   TEXT,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);
CREATE INDEX idx_promotions_active ON promotions(active);
CREATE INDEX idx_promotions_product_id ON promotions(product_id);
CREATE INDEX idx_promotions_category_id ON promotions(category_id);

-- ----------------------------------------------------------------------------
-- BANNERS
-- ----------------------------------------------------------------------------

CREATE TABLE banners (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  subtitle   TEXT,
  image_url  TEXT NOT NULL,
  link_url   TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- BUSINESS SETTINGS (fila única de configuración global)
-- ----------------------------------------------------------------------------

CREATE TABLE business_settings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name         TEXT NOT NULL,
  logo_url              TEXT,
  whatsapp_number       TEXT NOT NULL, -- formato E.164, ej. 528112345678
  whatsapp_provider     whatsapp_provider NOT NULL DEFAULT 'LINK',
  phone                 TEXT,
  email                 TEXT,
  address               TEXT,
  city                  TEXT,
  state                 TEXT,
  schedule              TEXT,
  facebook_url          TEXT,
  instagram_url         TEXT,
  tiktok_url            TEXT,
  google_maps_url       TEXT,
  currency              TEXT NOT NULL DEFAULT 'MXN',
  tax_rate              NUMERIC(5,2) NOT NULL DEFAULT 0,
  min_purchase_amount   NUMERIC(10,2),
  free_shipping_amount  NUMERIC(10,2),
  legal_text            TEXT,
  whatsapp_message_base TEXT,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- ANALYTICS EVENTS
-- ----------------------------------------------------------------------------

CREATE TABLE analytics_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type       analytics_event_type NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  session_id TEXT,
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_analytics_events_type ON analytics_events(type);
CREATE INDEX idx_analytics_events_product_id ON analytics_events(product_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

-- ----------------------------------------------------------------------------
-- TRIGGERS GENÉRICOS: actualizar updated_at automáticamente
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_business_settings_updated_at BEFORE UPDATE ON business_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- FOLIO DE COTIZACIÓN (FASE 7, sección 24)
-- ----------------------------------------------------------------------------
-- Genera folios correlativos por año (COT-2026-000001, COT-2026-000002, ...)
-- usando una secuencia de Postgres por año, creada de forma perezosa la
-- primera vez que se pide un folio en un año nuevo. `nextval()` es atómico,
-- así que dos cotizaciones simultáneas nunca pueden recibir el mismo folio
-- (a diferencia de contar filas existentes y sumar 1, que sí tiene condición
-- de carrera bajo concurrencia).
CREATE OR REPLACE FUNCTION next_quote_folio() RETURNS TEXT AS $$
DECLARE
  year_part TEXT := to_char(now(), 'YYYY');
  seq_name TEXT := 'quote_folio_seq_' || year_part;
  next_val BIGINT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = seq_name) THEN
    EXECUTE format('CREATE SEQUENCE %I START 1', seq_name);
  END IF;
  EXECUTE format('SELECT nextval(%L)', seq_name) INTO next_val;
  RETURN 'COT-' || year_part || '-' || LPAD(next_val::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- INTEGRACIÓN WHATSAPP (FASE 8, sección 40)
-- ----------------------------------------------------------------------------
-- Permite alternar entre la implementación v1 (enlaces wa.me) y una futura
-- v2 (WhatsApp Business Cloud API) sin redesplegar código: el admin cambia
-- este valor desde /admin/configuracion (FASE 9) y WhatsAppService.ts elige
-- la implementación correcta en tiempo de ejecución.
--
-- Si tu base de datos ya existía de una fase anterior a la FASE 8, ejecuta
-- este bloque manualmente (es seguro volver a correrlo, usa IF NOT EXISTS):
--
--   DO $$ BEGIN
--     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_provider') THEN
--       CREATE TYPE whatsapp_provider AS ENUM ('LINK', 'CLOUD_API');
--     END IF;
--   END $$;
--
--   ALTER TABLE business_settings
--     ADD COLUMN IF NOT EXISTS whatsapp_provider whatsapp_provider NOT NULL DEFAULT 'LINK';

-- ----------------------------------------------------------------------------
-- CRM: NOTAS DE CLIENTE (FASE 10)
-- ----------------------------------------------------------------------------
-- Si tu base de datos ya existía de una fase anterior a la FASE 10:
--
--   CREATE TABLE IF NOT EXISTS customer_notes (
--     id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
--     author_id   UUID REFERENCES users(id) ON DELETE SET NULL,
--     content     TEXT NOT NULL,
--     created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
--   );
--   CREATE INDEX IF NOT EXISTS idx_customer_notes_customer_id ON customer_notes(customer_id);

-- ============================================================================
-- FIN DEL SCHEMA
-- ============================================================================
