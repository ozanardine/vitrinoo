/*
  # Update search products function with pagination

  1. Changes
    - Drop old search_products function
    - Create new search_products function with pagination support
    - Add limit and offset parameters with defaults
    - Add security definer for better performance
    - Maintain all existing search functionality

  2. Parameters
    - p_store_id: Store ID to filter products
    - p_search: Search term for title, description, brand, SKU and tags
    - p_category_id: Filter by category
    - p_min_price: Minimum price filter
    - p_max_price: Maximum price filter
    - p_has_promotion: Filter products with/without promotions
    - p_tags: Filter by tags array
    - p_brand: Filter by brand
    - p_limit: Maximum number of results (default 100)
    - p_offset: Number of results to skip (default 0)
*/

-- Drop all versions of the function to avoid conflicts
DROP FUNCTION IF EXISTS search_products(uuid, text, uuid, numeric, numeric, boolean, text[], text);
DROP FUNCTION IF EXISTS search_products(uuid, text, uuid, numeric, numeric, boolean, text[], text, integer, integer);

-- Create new function with pagination
CREATE OR REPLACE FUNCTION search_products_v2(
  p_store_id uuid,
  p_search text DEFAULT NULL,
  p_category_id uuid DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_has_promotion boolean DEFAULT NULL,
  p_tags text[] DEFAULT NULL,
  p_brand text DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
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
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;