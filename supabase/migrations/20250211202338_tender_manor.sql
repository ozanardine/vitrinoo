-- Add limits column to subscriptions table
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS limits jsonb DEFAULT '{}';

-- Update plan limits in subscriptions
CREATE OR REPLACE FUNCTION get_plan_limits(plan_type text)
RETURNS jsonb AS $$
BEGIN
  RETURN CASE plan_type
    WHEN 'free' THEN jsonb_build_object(
      'products', 100,
      'categories', 10,
      'images_per_product', 3,
      'name', 'Gratuito',
      'price', 0
    )
    WHEN 'basic' THEN jsonb_build_object(
      'products', 1000,
      'categories', 50,
      'images_per_product', 5,
      'name', 'Básico',
      'price', 47
    )
    WHEN 'plus' THEN jsonb_build_object(
      'products', 10000,
      'categories', 200,
      'images_per_product', 10,
      'name', 'Plus',
      'price', 97
    )
    ELSE jsonb_build_object(
      'products', 100,
      'categories', 10,
      'images_per_product', 3,
      'name', 'Gratuito',
      'price', 0
    )
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add function to validate product limits
CREATE OR REPLACE FUNCTION validate_product_limits()
RETURNS trigger AS $$
DECLARE
  store_plan text;
  plan_limits jsonb;
  product_count integer;
BEGIN
  -- Get store's plan
  SELECT plan_type INTO store_plan
  FROM subscriptions
  WHERE store_id = NEW.store_id
  AND active = true
  LIMIT 1;

  -- Get plan limits
  plan_limits := get_plan_limits(store_plan);

  -- Count existing products
  SELECT COUNT(*) INTO product_count
  FROM products
  WHERE store_id = NEW.store_id
  AND parent_id IS NULL; -- Only count parent products

  -- Validate product limit
  IF product_count >= (plan_limits->>'products')::integer 
  AND NEW.parent_id IS NULL -- Only check for parent products
  THEN
    RAISE EXCEPTION 'Limite de produtos atingido para o plano %', plan_limits->>'name';
  END IF;

  -- Validate images limit
  IF NEW.images IS NOT NULL AND 
     array_length(NEW.images, 1) > (plan_limits->>'images_per_product')::integer 
  THEN
    RAISE EXCEPTION 'Limite de imagens por produto atingido para o plano %', plan_limits->>'name';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for product limits
DROP TRIGGER IF EXISTS validate_product_limits_trigger ON products;
CREATE TRIGGER validate_product_limits_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION validate_product_limits();

-- Update existing subscriptions with limits
UPDATE subscriptions
SET limits = get_plan_limits(plan_type)
WHERE active = true;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_limits ON subscriptions USING gin(limits);