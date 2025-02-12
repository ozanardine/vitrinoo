/*
  # Update Stripe prices with correct IDs

  1. Changes
    - Remove all existing price and subscription data
    - Add new prices with correct IDs for each plan
    
  2. Details
    - Free plan: price_1QrjW7KOdXEklortSTjCd56B
    - Basic plan: price_1QrjWNKOdXEklort1WzNdPIu
    - Plus plan: price_1QrjWaKOdXEklortFCkdku6t
*/

-- First, update all subscriptions to use NULL for stripe_subscription_id
UPDATE subscriptions 
SET stripe_subscription_id = NULL 
WHERE stripe_subscription_id IS NOT NULL;

-- Then delete data in correct order to respect foreign keys
DELETE FROM stripe_subscriptions;
DELETE FROM stripe_prices;

-- Insert new prices with correct IDs
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
    (SELECT id FROM stripe_products WHERE product_id = 'prod_RlG2OrPzfx2qhZ'),
    'recurring',
    0,
    'brl',
    'month',
    true
  ),
  (
    'price_1QrjWNKOdXEklort1WzNdPIu',
    (SELECT id FROM stripe_products WHERE product_id = 'prod_RlG2VAVuhPmnQ9'),
    'recurring',
    4700,
    'brl',
    'month',
    true
  ),
  (
    'price_1QrjWaKOdXEklortFCkdku6t',
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