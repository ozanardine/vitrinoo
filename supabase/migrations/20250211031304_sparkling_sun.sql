-- Remove stock control fields
ALTER TABLE products
  DROP COLUMN IF EXISTS stock_control,
  DROP COLUMN IF EXISTS min_stock,
  DROP COLUMN IF EXISTS max_stock,
  DROP COLUMN IF EXISTS stock_unit,
  DROP COLUMN IF EXISTS stock,
  DROP COLUMN IF EXISTS weight,
  DROP COLUMN IF EXISTS weight_unit,
  DROP COLUMN IF EXISTS dimensions;

-- Drop related constraints and indexes
DROP INDEX IF EXISTS idx_products_stock_control;
DROP INDEX IF EXISTS idx_products_stock;
DROP INDEX IF EXISTS idx_products_weight;