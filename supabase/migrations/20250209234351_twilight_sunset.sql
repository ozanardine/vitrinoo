/*
  # Add category management system

  1. New Tables
    - categories
      - id (uuid, primary key)
      - store_id (uuid, references stores)
      - name (text)
      - slug (text)
      - parent_id (uuid, self-reference)
      - description (text)
      - created_at (timestamp)
      - updated_at (timestamp)

  2. Changes
    - Modify products table to reference categories table
    - Add RLS policies for categories
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  parent_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(store_id, slug),
  UNIQUE(store_id, name, parent_id)
);

-- Add index for faster hierarchical queries
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON categories(store_id);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Store owners can manage their categories"
  ON categories
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

CREATE POLICY "Public can view categories"
  ON categories
  FOR SELECT
  TO anon
  USING (
    store_id IN (
      SELECT id FROM stores WHERE true
    )
  );

-- Create function to generate category path
CREATE OR REPLACE FUNCTION get_category_path(category_id uuid)
RETURNS text[]
LANGUAGE plpgsql
AS $$
DECLARE
    path text[];
    current_id uuid := category_id;
    current_name text;
BEGIN
    WHILE current_id IS NOT NULL LOOP
        SELECT name, parent_id 
        INTO current_name, current_id
        FROM categories 
        WHERE id = current_id;
        
        path := array_prepend(current_name, path);
    END LOOP;
    
    RETURN path;
END;
$$;