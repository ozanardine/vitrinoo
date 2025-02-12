/*
  # Update Stripe product and price IDs
  
  Updates the product and price IDs to match the test mode values
*/

-- First, update all subscriptions to use NULL for stripe_subscription_id
UPDATE subscriptions 
SET stripe_subscription_id = NULL 
WHERE stripe_subscription_id IS NOT NULL;

-- Then delete data in correct order to respect foreign keys
DELETE FROM stripe_subscriptions;
DELETE FROM stripe_prices;
DELETE FROM stripe_products;

-- Insert products with correct test mode IDs
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

-- Insert prices with correct test mode IDs
INSERT INTO stripe_prices (
  price_id,
  product_id,
  type,
  unit_amount,
  currency,
  interval,
  active
)
VALUES
  (
    'price_1QrjW7KOdXEklortSTjCd56B',
    (SELECT id FROM stripe_products WHERE name = 'Gratuito'),
    'recurring',
    0,
    'brl',
    'month',
    true
  ),
  (
    'price_1QrjWNKOdXEklort1WzNdPIu',
    (SELECT id FROM stripe_products WHERE name = 'Básico'),
    'recurring',
    4700,
    'brl',
    'month',
    true
  ),
  (
    'price_1QrjWaKOdXEklortFCkdku6t',
    (SELECT id FROM stripe_products WHERE name = 'Plus'),
    'recurring',
    9700,
    'brl',
    'month',
    true
  );