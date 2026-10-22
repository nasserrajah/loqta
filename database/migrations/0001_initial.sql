-- 0001_initial.sql
-- Core schema for Loqta. Written in SQLite syntax that Cloudflare D1 also supports.
-- Application-generated values are ISO-8601 UTC strings; SQL defaults are a safety net.

PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'User' CHECK (role IN ('User', 'Admin')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  ip_address TEXT,
  expires_at TEXT NOT NULL,
  last_used_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_password_reset_user_id ON password_reset_tokens(user_id);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_categories_active_sort ON categories(is_active, sort_order);

CREATE TABLE brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_brands_active ON brands(is_active);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  brand_id TEXT REFERENCES brands(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  specifications TEXT NOT NULL DEFAULT '{}',
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (length(currency) = 3),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  sku TEXT UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  is_featured INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_active_price ON products(is_active, price_cents);
CREATE INDEX idx_products_active_created ON products(is_active, created_at);
CREATE INDEX idx_products_name ON products(name);

CREATE TABLE product_images (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_product_images_product ON product_images(product_id, sort_order);

CREATE TABLE favorites (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (user_id, product_id)
);

CREATE INDEX idx_favorites_product ON favorites(product_id);

CREATE TABLE carts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE cart_items (
  id TEXT PRIMARY KEY,
  cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 99),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
  shipping_cents INTEGER NOT NULL CHECK (shipping_cents >= 0),
  tax_cents INTEGER NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (length(currency) = 3),
  shipping_name TEXT NOT NULL,
  shipping_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_orders_user_created ON orders(user_id, created_at);
CREATE INDEX idx_orders_status_created ON orders(status, created_at);

CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total_cents INTEGER NOT NULL CHECK (line_total_cents >= 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
