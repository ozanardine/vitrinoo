/*
  # Add price fields and fix security policies

  1. Schema Changes
    - Add price fields to products table
    - Update products table structure
    
  2. Security Updates
    - Fix subscription policies
    - Add policies for store creation flow
    
  3. Data Consistency
    - Add NOT NULL constraints
    - Add price validation check
*/

-- Add price fields to products table
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS price decimal(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS promotional_price decimal(10,2);

-- Add constraint to ensure promotional price is less than regular price
ALTER TABLE products 
  ADD CONSTRAINT check_promotional_price 
  CHECK (promotional_price IS NULL OR promotional_price < price);

-- Fix products table columns
ALTER TABLE products 
  RENAME COLUMN name TO title;

-- Drop existing policies
DROP POLICY IF EXISTS "Store owners can manage their products" ON products;
DROP POLICY IF EXISTS "Public can view products" ON products;
DROP POLICY IF EXISTS "Store owners can view their subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Store owners can manage their ERP integrations" ON erp_integrations;

-- Create better policies
CREATE POLICY "Store owners can manage their products"
  ON products
  FOR ALL
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active products"
  ON products
  FOR SELECT
  TO anon
  USING (
    active = true AND
    store_id IN (
      SELECT id FROM stores WHERE true
    )
  );

-- Fix subscription policies
CREATE POLICY "Manage subscriptions for own stores"
  ON subscriptions
  FOR ALL
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "View subscriptions for own stores"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Fix ERP integration policies
CREATE POLICY "Manage ERP integrations for own stores"
  ON erp_integrations
  FOR ALL
  TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );