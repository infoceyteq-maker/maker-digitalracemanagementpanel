-- =============================================================================
-- Digital Race — Public QR Menu Items + Server-Priced Orders
-- Date: 2026-09-24
-- =============================================================================

-- menu_items: public-readable catalog per tenant
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(120) NOT NULL DEFAULT 'General',
  price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'LKR',
  image_url TEXT,
  is_spicy BOOLEAN NOT NULL DEFAULT false,
  is_vegetarian BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_tenant ON menu_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(tenant_id, is_available);

-- orders: kitchen tickets from public QR menu (server-priced)
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(32) PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  table_number INT NOT NULL CHECK (table_number >= 1 AND table_number <= 999),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  tax NUMERIC(12, 2) NOT NULL CHECK (tax >= 0),
  total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
  status VARCHAR(32) NOT NULL DEFAULT 'NEW',
  customer_name VARCHAR(120),
  customer_phone VARCHAR(40),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- RLS: public SELECT for menu browsing + kitchen order lists
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS menu_items_public_select ON menu_items;
CREATE POLICY menu_items_public_select ON menu_items
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS orders_public_select ON orders;
CREATE POLICY orders_public_select ON orders
  FOR SELECT
  USING (true);

-- Service role / authenticated writes (inserts via service key from Express)
DROP POLICY IF EXISTS orders_service_insert ON orders;
CREATE POLICY orders_service_insert ON orders
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS menu_items_service_write ON menu_items;
CREATE POLICY menu_items_service_write ON menu_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Sample seed (commented — run after tenants exist)
-- ---------------------------------------------------------------------------
-- INSERT INTO menu_items (tenant_id, name, description, category, price, currency, is_spicy, is_vegetarian, is_available)
-- SELECT id, 'Black Pepper Crab Curry', 'Fresh jumbo lagoon mud crab...', 'Seafood Specials', 4800.00, 'LKR', true, false, true
-- FROM tenants WHERE slug = 'ceylon-spice' LIMIT 1;
--
-- INSERT INTO menu_items (tenant_id, name, description, category, price, currency, is_spicy, is_vegetarian, is_available)
-- SELECT id, 'Crispy Cheese Chicken Kottu', 'Godamba roti with chicken & mozzarella', 'Kottu & Roti', 2150.00, 'LKR', true, false, true
-- FROM tenants WHERE slug = 'ceylon-spice' LIMIT 1;
--
-- INSERT INTO orders (id, tenant_id, table_number, items, subtotal, tax, total, status)
-- SELECT 'KOT-DEMO1', id, 4,
--   '[{"productId":"p-2","name":"Crispy Cheese Chicken Kottu","quantity":2,"unitPrice":2150,"lineTotal":4300}]'::jsonb,
--   4300.00, 215.00, 4515.00, 'NEW'
-- FROM tenants WHERE slug = 'ceylon-spice' LIMIT 1;
