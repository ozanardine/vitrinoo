/*
  # Add SKU field and update search function

  1. Changes
    - Add SKU column to products table
    - Create index for SKU searches
    - Add unique constraint per store
    - Update search function to include SKU
*/

-- Adicionar coluna SKU
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sku text;

-- Criar índice para busca por SKU
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Adicionar constraint de unicidade por loja
ALTER TABLE products
  ADD CONSTRAINT unique_sku_per_store UNIQUE (store_id, sku);

-- Primeiro remover a função existente
DROP FUNCTION IF EXISTS search_products(
  p_store_id uuid,
  p_search text,
  p_category_id uuid,
  p_min_price decimal,
  p_max_price decimal,
  p_has_promotion boolean,
  p_tags text[],
  p_brand text,
  p_limit integer,
  p_offset integer
);

-- Recriar a função com o novo retorno incluindo SKU
CREATE OR REPLACE FUNCTION search_products(
  p_store_id uuid,
  p_search text DEFAULT NULL,
  p_category_id uuid DEFAULT NULL,
  p_min_price decimal DEFAULT NULL,
  p_max_price decimal DEFAULT NULL,
  p_has_promotion boolean DEFAULT NULL,
  p_tags text[] DEFAULT NULL,
  p_brand text DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  price decimal,
  promotional_price decimal,
  images text[],
  brand text,
  category_id uuid,
  sku text,
  tags text[],
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.price,
    p.promotional_price,
    p.images,
    p.brand,
    p.category_id,
    p.sku,
    p.tags,
    p.created_at
  FROM products p
  WHERE p.store_id = p_store_id
    AND p.status = true
    AND (
      p_search IS NULL OR 
      p.title ILIKE '%' || p_search || '%' OR
      p.description ILIKE '%' || p_search || '%' OR
      p.brand ILIKE '%' || p_search || '%' OR
      p.sku ILIKE '%' || p_search || '%' OR
      EXISTS (
        SELECT 1 FROM unnest(p.tags) t
        WHERE t ILIKE '%' || p_search || '%'
      )
    )
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (
      p_has_promotion IS NULL OR
      (p_has_promotion = true AND p.promotional_price IS NOT NULL) OR
      (p_has_promotion = false AND p.promotional_price IS NULL)
    )
    AND (p_tags IS NULL OR p.tags && p_tags)
    AND (p_brand IS NULL OR p.brand ILIKE '%' || p_brand || '%')
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;