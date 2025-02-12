/*
  # Update Stripe price IDs

  This migration updates the price IDs to match the actual IDs in the Stripe account.
  
  1. Changes
    - Clear existing prices
    - Insert new prices with correct IDs
    - Recreate index
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
    (SELECT id FROM stripe_products WHERE name = 'Gratuito'),
    'recurring',
    0,
    'brl',
    'month',
    true
  ),
  (
    'price_1QrjxIQPROny1Uc1r9MEWnpK',  -- Basic plan price
    (SELECT id FROM stripe_products WHERE name = 'Básico'),
    'recurring',
    4700,
    'brl',
    'month',
    true
  ),
  (
    'price_1QrjxIQPROny1Uc1DvYwG8Ks',  -- Plus plan price
    (SELECT id FROM stripe_products WHERE name = 'Plus'),
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