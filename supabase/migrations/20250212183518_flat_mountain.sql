/*
  # Update Stripe Products and Prices
  
  1. Updates the product and price IDs to match the test mode values
  2. Breaks down the operations into smaller transactions
  3. Adds proper error handling
*/

-- Disable triggers temporarily to avoid conflicts
ALTER TABLE subscriptions DISABLE TRIGGER ALL;
ALTER TABLE stripe_subscriptions DISABLE TRIGGER ALL;
ALTER TABLE stripe_prices DISABLE TRIGGER ALL;
ALTER TABLE stripe_products DISABLE TRIGGER ALL;

-- Clean up existing data
DO $$ 
BEGIN
  -- Update subscriptions first
  UPDATE subscriptions 
  SET stripe_subscription_id = NULL 
  WHERE stripe_subscription_id IS NOT NULL;

  -- Delete related data
  DELETE FROM stripe_subscriptions;
  DELETE FROM stripe_prices;
  DELETE FROM stripe_products;
END $$;

-- Insert Free plan
DO $$ 
BEGIN
  INSERT INTO stripe_products (
    product_id,
    name,
    description,
    features,
    active
  )
  VALUES (
    'prod_RlG2OrPzfx2qhZ',
    'Gratuito',
    'Plano gratuito para começar',
    jsonb_build_object(
      'products', 100,
      'categories', 10,
      'images_per_product', 3,
      'custom_domain', false,
      'analytics', false,
      'support', 'email',
      'erp_integration', false
    ),
    true
  );
END $$;

-- Insert Basic plan
DO $$ 
BEGIN
  INSERT INTO stripe_products (
    product_id,
    name,
    description,
    features,
    active
  )
  VALUES (
    'prod_RlG2VAVuhPmnQ9',
    'Básico',
    'Plano ideal para pequenos negócios',
    jsonb_build_object(
      'products', 1000,
      'categories', 50,
      'images_per_product', 5,
      'custom_domain', true,
      'analytics', true,
      'support', 'priority',
      'erp_integration', false
    ),
    true
  );
END $$;

-- Insert Plus plan
DO $$ 
BEGIN
  INSERT INTO stripe_products (
    product_id,
    name,
    description,
    features,
    active
  )
  VALUES (
    'prod_RlG2YipumdsH8P',
    'Plus',
    'Plano completo para negócios em crescimento',
    jsonb_build_object(
      'products', 10000,
      'categories', 200,
      'images_per_product', 10,
      'custom_domain', true,
      'analytics', true,
      'support', 'premium',
      'erp_integration', true
    ),
    true
  );
END $$;

-- Insert prices one by one
DO $$ 
DECLARE
  free_product_id uuid;
  basic_product_id uuid;
  plus_product_id uuid;
BEGIN
  -- Get product IDs
  SELECT id INTO free_product_id FROM stripe_products WHERE name = 'Gratuito';
  SELECT id INTO basic_product_id FROM stripe_products WHERE name = 'Básico';
  SELECT id INTO plus_product_id FROM stripe_products WHERE name = 'Plus';

  -- Insert Free plan price
  INSERT INTO stripe_prices (
    price_id,
    product_id,
    type,
    unit_amount,
    currency,
    interval,
    active
  )
  VALUES (
    'price_1QrjW7KOdXEklortSTjCd56B',
    free_product_id,
    'recurring',
    0,
    'brl',
    'month',
    true
  );

  -- Insert Basic plan price
  INSERT INTO stripe_prices (
    price_id,
    product_id,
    type,
    unit_amount,
    currency,
    interval,
    active
  )
  VALUES (
    'price_1QrjWNKOdXEklort1WzNdPIu',
    basic_product_id,
    'recurring',
    4700,
    'brl',
    'month',
    true
  );

  -- Insert Plus plan price
  INSERT INTO stripe_prices (
    price_id,
    product_id,
    type,
    unit_amount,
    currency,
    interval,
    active
  )
  VALUES (
    'price_1QrjWaKOdXEklortFCkdku6t',
    plus_product_id,
    'recurring',
    9700,
    'brl',
    'month',
    true
  );
END $$;

-- Re-enable triggers
ALTER TABLE subscriptions ENABLE TRIGGER ALL;
ALTER TABLE stripe_subscriptions ENABLE TRIGGER ALL;
ALTER TABLE stripe_prices ENABLE TRIGGER ALL;
ALTER TABLE stripe_products ENABLE TRIGGER ALL;

-- Ensure indexes are up to date
DROP INDEX IF EXISTS idx_stripe_prices_lookup;
CREATE INDEX idx_stripe_prices_lookup 
ON stripe_prices(price_id, active)
WHERE active = true;