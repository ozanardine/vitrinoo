/*
  # Update Stripe Products and Prices
  
  1. Updates the product and price IDs to match the test mode values
  2. Uses transaction blocks to maintain data consistency
  3. Avoids system trigger manipulation
*/

-- Start with a clean slate
BEGIN;

-- Update subscriptions first
UPDATE subscriptions 
SET stripe_subscription_id = NULL 
WHERE stripe_subscription_id IS NOT NULL;

-- Delete related data in correct order
DELETE FROM stripe_subscriptions;
DELETE FROM stripe_prices;
DELETE FROM stripe_products;

-- Insert products
INSERT INTO stripe_products (
  product_id,
  name,
  description,
  features,
  active
)
VALUES
  (
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
  ),
  (
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
  ),
  (
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

-- Insert prices
INSERT INTO stripe_prices (
  price_id,
  product_id,
  type,
  unit_amount,
  currency,
  interval,
  active
)
SELECT
  price_data.price_id,
  sp.id as product_id,
  'recurring' as type,
  price_data.unit_amount,
  'brl' as currency,
  'month' as interval,
  true as active
FROM (
  VALUES
    ('price_1QrjW7KOdXEklortSTjCd56B', 'Gratuito', 0),
    ('price_1QrjWNKOdXEklort1WzNdPIu', 'Básico', 4700),
    ('price_1QrjWaKOdXEklortFCkdku6t', 'Plus', 9700)
) as price_data(price_id, product_name, unit_amount)
JOIN stripe_products sp ON sp.name = price_data.product_name;

-- Update indexes
DROP INDEX IF EXISTS idx_stripe_prices_lookup;
CREATE INDEX idx_stripe_prices_lookup 
ON stripe_prices(price_id, active)
WHERE active = true;

COMMIT;