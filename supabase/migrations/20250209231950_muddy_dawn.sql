/*
  # Initial Schema Setup for Digital Catalog Platform

  1. New Tables
    - `stores`
      - Basic store information and customization
    - `products`
      - Product catalog items
    - `subscriptions`
      - Store subscription plans
    - `erp_integrations`
      - ERP integration settings

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Stores table
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  primary_color text DEFAULT '#000000',
  secondary_color text DEFAULT '#ffffff',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  image_url text,
  sku text,
  stock integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  plan_type text NOT NULL CHECK (plan_type IN ('free', 'basic', 'plus')),
  active boolean DEFAULT true,
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- ERP integrations table
CREATE TABLE IF NOT EXISTS erp_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'tiny',
  api_key text,
  api_token text,
  active boolean DEFAULT false,
  last_sync timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_integrations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own stores"
  ON stores
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view active stores"
  ON stores
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Store owners can manage their products"
  ON products
  FOR ALL
  TO authenticated
  USING (store_id IN (
    SELECT id FROM stores WHERE user_id = auth.uid()
  ));

CREATE POLICY "Public can view products"
  ON products
  FOR SELECT
  TO anon
  USING (active = true);

CREATE POLICY "Store owners can view their subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (store_id IN (
    SELECT id FROM stores WHERE user_id = auth.uid()
  ));

CREATE POLICY "Store owners can manage their ERP integrations"
  ON erp_integrations
  FOR ALL
  TO authenticated
  USING (store_id IN (
    SELECT id FROM stores WHERE user_id = auth.uid()
  ));