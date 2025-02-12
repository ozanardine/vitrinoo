/*
  # Fix Stripe Prices Migration
  
  1. Changes
    - Update existing prices to have valid currency
    - Add prices for each plan with correct IDs
    - Add currency constraint
    - Add price lookup index
    
  2. Details
    - All prices are recurring subscription prices
    - Currency is standardized to BRL
    - Prices are in cents (e.g. 4700 = R$ 47,00)
*/

-- First update any existing prices to have valid currency
UPDATE stripe_prices 
SET currency = 'brl' 
WHERE currency IS NULL OR currency NOT IN ('brl', 'usd', 'eur');

-- Add constraint for currency
ALTER TABLE stripe_prices
  DROP CONSTRAINT IF EXISTS stripe_prices_currency_check,
  ADD CONSTRAINT stripe_prices_currency_check 
  CHECK (currency IN ('brl', 'usd', 'eur'));

-- Insert prices for products
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
  'price_RlG2OrPzfx2qhZ' as price_id,
  id as product_id,
  'recurring' as type,
  0 as unit_amount,
  'brl' as currency,
  'month' as interval,
  true as active
FROM stripe_products 
WHERE product_id = 'prod_RlG2OrPzfx2qhZ'
ON CONFLICT (price_id) DO UPDATE
SET 
  product_id = EXCLUDED.product_id,
  type = EXCLUDED.type,
  unit_amount = EXCLUDED.unit_amount,
  currency = EXCLUDED.currency,
  interval = EXCLUDED.interval,
  active = EXCLUDED.active;

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
  'price_RlG2VAVuhPmnQ9' as price_id,
  id as product_id,
  'recurring' as type,
  4700 as unit_amount,
  'brl' as currency,
  'month' as interval,
  true as active
FROM stripe_products 
WHERE product_id = 'prod_RlG2VAVuhPmnQ9'
ON CONFLICT (price_id) DO UPDATE
SET 
  product_id = EXCLUDED.product_id,
  type = EXCLUDED.type,
  unit_amount = EXCLUDED.unit_amount,
  currency = EXCLUDED.currency,
  interval = EXCLUDED.interval,
  active = EXCLUDED.active;

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
  'price_RlG2YipumdsH8P' as price_id,
  id as product_id,
  'recurring' as type,
  9700 as unit_amount,
  'brl' as currency,
  'month' as interval,
  true as active
FROM stripe_products 
WHERE product_id = 'prod_RlG2YipumdsH8P'
ON CONFLICT (price_id) DO UPDATE
SET 
  product_id = EXCLUDED.product_id,
  type = EXCLUDED.type,
  unit_amount = EXCLUDED.unit_amount,
  currency = EXCLUDED.currency,
  interval = EXCLUDED.interval,
  active = EXCLUDED.active;

-- Add index for price lookups
CREATE INDEX IF NOT EXISTS idx_stripe_prices_lookup 
ON stripe_prices(price_id, active)
WHERE active = true;