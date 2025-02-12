/*
  # Add Missing Database Structure

  1. New Tables
    - `product_attributes`: Store product variation attributes and options
    - `product_components`: Store components for kits and manufactured products
    - `erp_integrations`: Store ERP integration credentials and settings
    - `function_keys`: Store function keys for edge functions
    - `stripe_customers`: Store Stripe customer data
    - `stripe_products`: Store Stripe product data
    - `stripe_prices`: Store Stripe price data
    - `stripe_subscriptions`: Store Stripe subscription data

  2. Missing Columns
    - `stores`: Add social settings and header visibility
    - `products`: Add meta fields and service-specific fields
    - `subscriptions`: Add payment and trial fields

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add policies for store owners
*/

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  -- Drop policies for product_attributes if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_attributes') THEN
    DROP POLICY IF EXISTS "Users can view their store's attributes" ON product_attributes;
    DROP POLICY IF EXISTS "Users can create attributes for their stores" ON product_attributes;
    DROP POLICY IF EXISTS "Users can update their store's attributes" ON product_attributes;
    DROP POLICY IF EXISTS "Users can delete their store's attributes" ON product_attributes;
  END IF;

  -- Drop policies for product_components if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_components') THEN
    DROP POLICY IF EXISTS "Users can view their store's components" ON product_components;
    DROP POLICY IF EXISTS "Users can create components for their products" ON product_components;
    DROP POLICY IF EXISTS "Users can update their product components" ON product_components;
    DROP POLICY IF EXISTS "Users can delete their product components" ON product_components;
  END IF;

  -- Drop policies for erp_integrations if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'erp_integrations') THEN
    DROP POLICY IF EXISTS "Users can view their store's integrations" ON erp_integrations;
    DROP POLICY IF EXISTS "Users can create integrations for their stores" ON erp_integrations;
    DROP POLICY IF EXISTS "Users can update their store's integrations" ON erp_integrations;
    DROP POLICY IF EXISTS "Users can delete their store's integrations" ON erp_integrations;
  END IF;

  -- Drop policies for stripe tables if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stripe_customers') THEN
    DROP POLICY IF EXISTS "Users can view their own customer data" ON stripe_customers;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stripe_products') THEN
    DROP POLICY IF EXISTS "Everyone can view active products" ON stripe_products;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stripe_prices') THEN
    DROP POLICY IF EXISTS "Everyone can view active prices" ON stripe_prices;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stripe_subscriptions') THEN
    DROP POLICY IF EXISTS "Users can view their own subscriptions" ON stripe_subscriptions;
  END IF;
END $$;

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS product_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  options text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(store_id, name)
);

CREATE TABLE IF NOT EXISTS product_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  component_id uuid REFERENCES products(id) ON DELETE SET NULL,
  component_type text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS erp_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  provider text NOT NULL,
  client_id text NOT NULL,
  client_secret text NOT NULL,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(store_id, provider)
);

CREATE TABLE IF NOT EXISTS function_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create Stripe tables
CREATE TABLE IF NOT EXISTS stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id text NOT NULL UNIQUE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stripe_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  active boolean DEFAULT true,
  features jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stripe_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price_id text NOT NULL UNIQUE,
  product_id uuid NOT NULL REFERENCES stripe_products(id) ON DELETE CASCADE,
  unit_amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'brl',
  interval text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id text NOT NULL UNIQUE,
  customer_id uuid NOT NULL REFERENCES stripe_customers(id) ON DELETE CASCADE,
  price_id uuid NOT NULL REFERENCES stripe_prices(id) ON DELETE CASCADE,
  status text NOT NULL,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  cancel_at timestamptz,
  canceled_at timestamptz,
  ended_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add missing columns to stores
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS social_settings jsonb DEFAULT jsonb_build_object(
    'contacts_position', 'above',
    'display_format', 'username'
  ),
  ADD COLUMN IF NOT EXISTS header_visibility jsonb DEFAULT jsonb_build_object(
    'logo', true,
    'title', true,
    'description', true,
    'socialLinks', true
  );

-- Add missing columns to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS meta_keywords text[],
  ADD COLUMN IF NOT EXISTS meta_image text;

-- Add missing columns to subscriptions
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS next_payment_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Enable RLS on all tables
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for product_attributes
CREATE POLICY "Users can view their store's attributes"
  ON product_attributes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stores s
    WHERE s.id = product_attributes.store_id
    AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can create attributes for their stores"
  ON product_attributes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM stores s
    WHERE s.id = product_attributes.store_id
    AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their store's attributes"
  ON product_attributes FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stores s
    WHERE s.id = product_attributes.store_id
    AND s.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM stores s
    WHERE s.id = product_attributes.store_id
    AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their store's attributes"
  ON product_attributes FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stores s
    WHERE s.id = product_attributes.store_id
    AND s.user_id = auth.uid()
  ));

-- Create policies for product_components
CREATE POLICY "Users can view their store's components"
  ON product_components FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM products p
    JOIN stores s ON s.id = p.store_id
    WHERE p.id = product_components.product_id
    AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can create components for their products"
  ON product_components FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM products p
    JOIN stores s ON s.id = p.store_id
    WHERE p.id = product_components.product_id
    AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their product components"
  ON product_components FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM products p
    JOIN stores s ON s.id = p.store_id
    WHERE p.id = product_components.product_id
    AND s.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM products p
    JOIN stores s ON s.id = p.store_id
    WHERE p.id = product_components.product_id
    AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their product components"
  ON product_components FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM products p
    JOIN stores s ON s.id = p.store_id
    WHERE p.id = product_components.product_id
    AND s.user_id = auth.uid()
  ));

-- Create policies for erp_integrations
CREATE POLICY "Users can view their store's integrations"
  ON erp_integrations FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stores s
    WHERE s.id = erp_integrations.store_id
    AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can create integrations for their stores"
  ON erp_integrations FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM stores s
    WHERE s.id = erp_integrations.store_id
    AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their store's integrations"
  ON erp_integrations FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stores s
    WHERE s.id = erp_integrations.store_id
    AND s.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM stores s
    WHERE s.id = erp_integrations.store_id
    AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their store's integrations"
  ON erp_integrations FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stores s
    WHERE s.id = erp_integrations.store_id
    AND s.user_id = auth.uid()
  ));

-- Create policies for stripe tables
CREATE POLICY "Users can view their own customer data"
  ON stripe_customers FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Everyone can view active products"
  ON stripe_products FOR SELECT TO authenticated
  USING (active = true);

CREATE POLICY "Everyone can view active prices"
  ON stripe_prices FOR SELECT TO authenticated
  USING (active = true);

CREATE POLICY "Users can view their own subscriptions"
  ON stripe_subscriptions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stripe_customers c
    WHERE c.id = stripe_subscriptions.customer_id
    AND c.user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_attributes_store_id ON product_attributes(store_id);
CREATE INDEX IF NOT EXISTS idx_product_components_product_id ON product_components(product_id);
CREATE INDEX IF NOT EXISTS idx_erp_integrations_store_id ON erp_integrations(store_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_customer_id ON stripe_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_prices_product_id ON stripe_prices(product_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_product_attributes_updated_at ON product_attributes;
CREATE TRIGGER update_product_attributes_updated_at
  BEFORE UPDATE ON product_attributes
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_components_updated_at ON product_components;
CREATE TRIGGER update_product_components_updated_at
  BEFORE UPDATE ON product_components
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_erp_integrations_updated_at ON erp_integrations;
CREATE TRIGGER update_erp_integrations_updated_at
  BEFORE UPDATE ON erp_integrations
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_function_keys_updated_at ON function_keys;
CREATE TRIGGER update_function_keys_updated_at
  BEFORE UPDATE ON function_keys
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_stripe_customers_updated_at ON stripe_customers;
CREATE TRIGGER update_stripe_customers_updated_at
  BEFORE UPDATE ON stripe_customers
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_stripe_products_updated_at ON stripe_products;
CREATE TRIGGER update_stripe_products_updated_at
  BEFORE UPDATE ON stripe_products
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_stripe_prices_updated_at ON stripe_prices;
CREATE TRIGGER update_stripe_prices_updated_at
  BEFORE UPDATE ON stripe_prices
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_stripe_subscriptions_updated_at ON stripe_subscriptions;
CREATE TRIGGER update_stripe_subscriptions_updated_at
  BEFORE UPDATE ON stripe_subscriptions
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Create function to search products
CREATE OR REPLACE FUNCTION search_products(
  p_store_id uuid,
  p_search text DEFAULT NULL,
  p_category_id uuid DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_has_promotion boolean DEFAULT NULL,
  p_tags text[] DEFAULT NULL,
  p_brand text DEFAULT NULL
)
RETURNS SETOF products AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM products p
  WHERE p.store_id = p_store_id
    AND p.status = true
    AND (
      p_search IS NULL
      OR p.title ILIKE '%' || p_search || '%'
      OR p.description ILIKE '%' || p_search || '%'
      OR p.brand ILIKE '%' || p_search || '%'
      OR p.sku ILIKE '%' || p_search || '%'
      OR EXISTS (
        SELECT 1 FROM unnest(p.tags) tag
        WHERE tag ILIKE '%' || p_search || '%'
      )
    )
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (
      p_has_promotion IS NULL
      OR (p_has_promotion = true AND p.promotional_price IS NOT NULL)
      OR (p_has_promotion = false AND p.promotional_price IS NULL)
    )
    AND (
      p_tags IS NULL
      OR EXISTS (
        SELECT 1 FROM unnest(p.tags) tag
        WHERE tag = ANY(p_tags)
      )
    )
    AND (p_brand IS NULL OR p.brand = p_brand)
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;