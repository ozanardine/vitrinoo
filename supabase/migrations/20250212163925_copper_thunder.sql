/*
  # Stripe Products and Prices Setup
  
  1. New Data
    - Add initial Stripe products and prices
    - Set up proper features and limits for each plan
  
  2. Changes
    - Add missing indexes for better performance
    - Add validation triggers
*/

-- Insert Stripe products if they don't exist
INSERT INTO stripe_products (product_id, name, description, features, active)
VALUES
  ('prod_Rkajxcxdu9nt47', 'Gratuito', 'Plano gratuito para começar', jsonb_build_object(
    'products', 100,
    'categories', 10,
    'images_per_product', 3,
    'custom_domain', false,
    'analytics', false,
    'support', 'email',
    'erp_integration', false
  ), true),
  ('prod_RkakSor8vTIbWN', 'Básico', 'Plano ideal para pequenos negócios', jsonb_build_object(
    'products', 1000,
    'categories', 50,
    'images_per_product', 5,
    'custom_domain', true,
    'analytics', true,
    'support', 'priority',
    'erp_integration', false
  ), true),
  ('prod_Rkak9EXhC1cITX', 'Plus', 'Plano completo para negócios em crescimento', jsonb_build_object(
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

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stripe_products_active ON stripe_products(active);
CREATE INDEX IF NOT EXISTS idx_stripe_prices_active ON stripe_prices(active);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_status ON stripe_subscriptions(status);

-- Add trigger to validate subscription status changes
CREATE OR REPLACE FUNCTION validate_subscription_status()
RETURNS trigger AS $$
BEGIN
  -- Validate status transitions
  IF NEW.status NOT IN ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid') THEN
    RAISE EXCEPTION 'Invalid subscription status: %', NEW.status;
  END IF;

  -- Set ended_at when status changes to canceled
  IF NEW.status = 'canceled' AND OLD.status != 'canceled' THEN
    NEW.ended_at = CURRENT_TIMESTAMP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_subscription_status_trigger ON stripe_subscriptions;
CREATE TRIGGER validate_subscription_status_trigger
  BEFORE INSERT OR UPDATE ON stripe_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION validate_subscription_status();

-- Add function to sync subscription limits
CREATE OR REPLACE FUNCTION sync_subscription_limits()
RETURNS trigger AS $$
BEGIN
  -- Get product features
  WITH product_info AS (
    SELECT sp.features
    FROM stripe_subscriptions ss
    JOIN stripe_prices spr ON ss.price_id = spr.id
    JOIN stripe_products sp ON spr.product_id = sp.id
    WHERE ss.id = NEW.stripe_subscription_id
  )
  UPDATE subscriptions
  SET limits = (SELECT features FROM product_info)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_subscription_limits_trigger ON subscriptions;
CREATE TRIGGER sync_subscription_limits_trigger
  AFTER INSERT OR UPDATE OF stripe_subscription_id ON subscriptions
  FOR EACH ROW
  WHEN (NEW.stripe_subscription_id IS NOT NULL)
  EXECUTE FUNCTION sync_subscription_limits();