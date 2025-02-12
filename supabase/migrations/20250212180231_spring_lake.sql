/*
  # Update Stripe prices with type column

  1. Changes
    - Remove all existing price and subscription data
    - Add new prices with correct IDs and type for each plan
    
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
SELECT 
  'price_1QrjW7KOdXEklortSTjCd56B' as price_id,
  id as product_id,
  'recurring' as type,
  0 as unit_amount,
  'brl' as currency,
  'month' as interval,
  true as active
FROM stripe_products 
WHERE product_id = 'prod_RlG2OrPzfx2qhZ' -- Free plan
UNION ALL
SELECT 
  'price_1QrjWNKOdXEklort1WzNdPIu' as price_id,
  id as product_id,
  'recurring' as type,
  4700 as unit_amount,
  'brl' as currency,
  'month' as interval,
  true as active
FROM stripe_products 
WHERE product_id = 'prod_RlG2VAVuhPmnQ9' -- Basic plan
UNION ALL
SELECT 
  'price_1QrjWaKOdXEklortFCkdku6t' as price_id,
  id as product_id,
  'recurring' as type,
  9700 as unit_amount,
  'brl' as currency,
  'month' as interval,
  true as active
FROM stripe_products 
WHERE product_id = 'prod_RlG2YipumdsH8P'; -- Plus plan

-- Ensure indexes are up to date
DROP INDEX IF EXISTS idx_stripe_prices_lookup;
CREATE INDEX idx_stripe_prices_lookup 
ON stripe_prices(price_id, active)
WHERE active = true;