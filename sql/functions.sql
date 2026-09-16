-- ============================================================================
-- CATÁLOGO DIGITAL + WHATSAPP — FUNCIONES, TRIGGERS Y EXTENSIONES
--
-- `prisma db push` / `prisma migrate` crean tablas, columnas, enums e
-- índices a partir de schema.prisma, pero NO pueden expresar extensiones de
-- Postgres, funciones en PL/pgSQL, ni triggers — eso se aplica por separado
-- con este archivo. Es idempotente (usa IF NOT EXISTS / CREATE OR REPLACE),
-- así que es seguro volver a correrlo tantas veces como haga falta.
--
-- Uso:
--   npx prisma db push                                  # tablas (desde schema.prisma)
--   psql "$DATABASE_URL" -f sql/functions.sql            # esto (funciones/triggers)
--   npx prisma db seed                                   # datos demo (opcional)
--
-- En CI (.github/workflows/ci.yml) se aplica automáticamente en ese orden.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "unaccent";   -- búsqueda sin acentos

-- ----------------------------------------------------------------------------
-- Búsqueda de texto completo (FASE 2, sección 8)
-- ----------------------------------------------------------------------------
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

DROP TRIGGER IF EXISTS trg_products_search_vector ON products;
CREATE TRIGGER trg_products_search_vector
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();

-- ----------------------------------------------------------------------------
-- `updated_at` automático (FASE 2)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_inventory_updated_at ON inventory;
CREATE TRIGGER trg_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_customers_updated_at ON customers;
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_leads_updated_at ON leads;
CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_business_settings_updated_at ON business_settings;
CREATE TRIGGER trg_business_settings_updated_at BEFORE UPDATE ON business_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- Folio de cotización correlativo por año (FASE 7, sección 24)
-- ----------------------------------------------------------------------------
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
