-- Create new type for service modality
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_modality') THEN
    CREATE TYPE service_modality AS ENUM ('presential', 'online', 'hybrid');
  END IF;
END $$;

-- Drop and recreate product_type enum with new value
DO $$
BEGIN
  -- Create temporary table to store existing products
  CREATE TEMP TABLE temp_products AS 
  SELECT id, store_id, title, description, brand, category_id, sku, tags, images, 
         price, promotional_price, status, created_at, updated_at, parent_id,
         attributes, variation_attributes
  FROM products;

  -- Drop constraints that reference the type
  ALTER TABLE products 
    DROP CONSTRAINT IF EXISTS products_type_check;

  -- Drop the old type
  DROP TYPE IF EXISTS product_type CASCADE;

  -- Create new enum with all values including 'service'
  CREATE TYPE product_type AS ENUM (
    'simple',
    'variable',
    'kit',
    'manufactured',
    'service'
  );

  -- Add fields for services
  ALTER TABLE products
    ADD COLUMN IF NOT EXISTS duration interval,
    ADD COLUMN IF NOT EXISTS availability jsonb DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS service_location text,
    ADD COLUMN IF NOT EXISTS service_modality service_modality,
    ADD COLUMN type product_type NOT NULL DEFAULT 'simple';

  -- Restore products data with default type
  UPDATE products p
  SET type = 'simple'
  FROM temp_products t
  WHERE p.id = t.id;

  -- Drop temp table
  DROP TABLE temp_products;
END $$;

-- Create index for service-specific fields
CREATE INDEX IF NOT EXISTS idx_products_service_modality 
  ON products(service_modality) 
  WHERE type = 'service';

-- Update product validation function
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

  -- Validar campos específicos de serviço
  IF NEW.type = 'service' THEN
    -- Duração é obrigatória para serviços
    IF NEW.duration IS NULL THEN
      RAISE EXCEPTION 'Duração é obrigatória para serviços';
    END IF;

    -- Validar formato do availability
    IF NEW.availability IS NOT NULL AND NOT (
      NEW.availability ? 'weekdays' AND
      NEW.availability ? 'hours'
    ) THEN
      RAISE EXCEPTION 'Disponibilidade deve incluir dias da semana e horários';
    END IF;

    -- Localização é obrigatória para serviços presenciais ou híbridos
    IF NEW.service_modality IN ('presential', 'hybrid') AND NEW.service_location IS NULL THEN
      RAISE EXCEPTION 'Localização é obrigatória para serviços presenciais ou híbridos';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;