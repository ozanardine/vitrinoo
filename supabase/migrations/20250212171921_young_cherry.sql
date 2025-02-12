/*
  # Update Stripe test product IDs

  1. Changes
    - Update product IDs to use test mode IDs
    - Keep existing features and configuration
    - Ensure data consistency
*/

-- Update existing products with new test mode IDs
UPDATE stripe_products
SET product_id = 'prod_RlG2OrPzfx2qhZ'
WHERE product_id = 'prod_Rkajxcxdu9nt47';

UPDATE stripe_products
SET product_id = 'prod_RlG2VAVuhPmnQ9'
WHERE product_id = 'prod_RkakSor8vTIbWN';

UPDATE stripe_products
SET product_id = 'prod_RlG2YipumdsH8P'
WHERE product_id = 'prod_Rkak9EXhC1cITX';

-- Re-insert products if they don't exist (with new IDs)
INSERT INTO stripe_products (product_id, name, description, features, active)
VALUES
  ('prod_RlG2OrPzfx2qhZ', 'Gratuito', 'Plano gratuito para começar', jsonb_build_object(
    'products', 100,
    'categories', 10,
    'images_per_product', 3,
    'custom_domain', false,
    'analytics', false,
    'support', 'email',
    'erp_integration', false
  ), true),
  ('prod_RlG2VAVuhPmnQ9', 'Básico', 'Plano ideal para pequenos negócios', jsonb_build_object(
    'products', 1000,
    'categories', 50,
    'images_per_product', 5,
    'custom_domain', true,
    'analytics', true,
    'support', 'priority',
    'erp_integration', false
  ), true),
  ('prod_RlG2YipumdsH8P', 'Plus', 'Plano completo para negócios em crescimento', jsonb_build_object(
    'products', 10000,
    'categories', 200,
    'images_per_product', 10,
    'custom_domain', true,
    'analytics', true,
    'support', 'premium',
    'erp_integration', true
  ), true)
ON CONFLICT (product_id) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  active = EXCLUDED.active;

-- Clean up any old unused products
DELETE FROM stripe_products 
WHERE product_id IN (
  'prod_Rkajxcxdu9nt47',
  'prod_RkakSor8vTIbWN', 
  'prod_Rkak9EXhC1cITX'
);