/*
  # Add product metadata columns

  1. New Columns
    - Add category column to products table
    - Add tags array column to products table
    
  2. Changes
    - Make category required with default value
    - Initialize tags as empty array by default
*/

-- Add category and tags columns
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Geral',
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

-- Add index on category for better query performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Add index on tags for better array operations
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);