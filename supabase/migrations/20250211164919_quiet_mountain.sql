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

-- Drop stock validation function and trigger
DROP TRIGGER IF EXISTS validate_stock_trigger ON products;
DROP FUNCTION IF EXISTS validate_stock();

-- Update product attributes validation to remove dimensions check
CREATE OR REPLACE FUNCTION validate_product_attributes()
RETURNS trigger AS $$
BEGIN
  -- Validar atributos para produtos variáveis
  IF NEW.type = 'variable' THEN
    IF array_length(NEW.variation_attributes, 1) IS NULL THEN
      RAISE EXCEPTION 'Produtos variáveis precisam ter pelo menos um atributo de variação';
    END IF;

    -- Verificar se os atributos existem
    IF NOT EXISTS (
      SELECT 1 FROM product_attributes
      WHERE store_id = NEW.store_id
      AND name = ANY(NEW.variation_attributes)
    ) THEN
      RAISE EXCEPTION 'Um ou mais atributos de variação não existem';
    END IF;
  END IF;

  -- Validar que produtos simples não têm variações
  IF NEW.type = 'simple' AND NEW.parent_id IS NOT NULL THEN
    RAISE EXCEPTION 'Produtos simples não podem ser variações';
  END IF;

  -- Validar que apenas produtos variáveis podem ter variações
  IF NEW.parent_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM products
      WHERE id = NEW.parent_id
      AND type = 'variable'
    ) THEN
      RAISE EXCEPTION 'Apenas produtos variáveis podem ter variações';
    END IF;

    -- Validar que variação tem todos os atributos do pai
    IF NOT EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = NEW.parent_id
      AND NOT EXISTS (
        SELECT unnest(p.variation_attributes) EXCEPT
        SELECT key FROM jsonb_object_keys(NEW.attributes::jsonb) k(key)
      )
    ) THEN
      RAISE EXCEPTION 'A variação deve ter todos os atributos definidos no produto pai';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;