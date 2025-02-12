/*
  # Update Stripe test mode prices

  1. Changes
    - Update price IDs to match test mode prices
    - Clean up any existing data to avoid conflicts
    - Re-create prices with correct IDs
  
  2. Security
    - No changes to RLS policies
    - Maintains existing security model
*/

-- First, update all subscriptions to use NULL for stripe_subscription_id
UPDATE subscriptions 
SET stripe_subscription_id = NULL 
WHERE stripe_subscription_id IS NOT NULL;

-- Then delete data in correct order to respect foreign keys
DELETE FROM stripe_subscriptions;
DELETE FROM stripe_prices;

-- Insert new prices with correct IDs for test mode
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
    'price_1QrjxIQPROny1Uc1YbqPGgL9',  -- Free plan price
    (SELECT id FROM stripe_products WHERE product_id = 'prod_RlG2OrPzfx2qhZ'),
    'recurring',
    0,
    'brl',
    'month',
    true
  ),
  (
    'price_1QrjxIQPROny1Uc1r9MEWnpK',  -- Basic plan price
    (SELECT id FROM stripe_products WHERE product_id = 'prod_RlG2VAVuhPmnQ9'),
    'recurring',
    4700,
    'brl',
    'month',
    true
  ),
  (
    'price_1QrjxIQPROny1Uc1DvYwG8Ks',  -- Plus plan price
    (SELECT id FROM stripe_products WHERE product_id = 'prod_RlG2YipumdsH8P'),
    'recurring',
    9700,
    'brl',
    'month',
    true
  );

-- Ensure indexes are up to date
DROP INDEX IF EXISTS idx_stripe_prices_lookup;
CREATE INDEX idx_stripe_prices_lookup 
ON stripe_prices(price_id, active)
WHERE active = true;