-- Shared, reusable product facts only. Never put user-owned inventory details,
-- personal photos, receipts, notes, quantities, serials or locations in this DB.
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 180),
  brand TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  barcode TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  product_url TEXT NOT NULL DEFAULT '',
  photo_url TEXT NOT NULL DEFAULT '',
  manual_url TEXT NOT NULL DEFAULT '',
  brand_key TEXT NOT NULL DEFAULT '',
  model_key TEXT NOT NULL DEFAULT '',
  name_key TEXT NOT NULL DEFAULT '',
  search_key TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (barcode = '' OR (length(barcode) BETWEEN 8 AND 14 AND barcode NOT GLOB '*[^0-9]*')),
  CHECK (product_url = '' OR product_url LIKE 'https://%'),
  CHECK (photo_url = '' OR photo_url LIKE 'https://%'),
  CHECK (manual_url = '' OR manual_url LIKE 'https://%')
);

CREATE UNIQUE INDEX IF NOT EXISTS products_barcode_unique
  ON products(barcode) WHERE barcode <> '';
CREATE UNIQUE INDEX IF NOT EXISTS products_brand_model_unique
  ON products(brand_key, model_key) WHERE model_key <> '';
CREATE INDEX IF NOT EXISTS products_model_key_idx ON products(model_key);
CREATE INDEX IF NOT EXISTS products_name_key_idx ON products(name_key);
CREATE INDEX IF NOT EXISTS products_search_key_idx ON products(search_key);
