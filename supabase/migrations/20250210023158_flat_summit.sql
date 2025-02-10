/*
  # Melhorias no Schema do Catálogo Digital

  1. Alterações
    - Remoção da coluna description da tabela categories
    - Adição de campos de status e ordem para categorias
    - Adição de campos de SEO
    - Melhorias nas constraints e índices
    - Funções para ordenação e busca

  2. Novas Funcionalidades
    - Suporte a ordenação personalizada de categorias
    - Campos para SEO
    - Status para produtos e categorias
    - Busca avançada de produtos
*/

-- Remover coluna description da tabela categories
ALTER TABLE categories DROP COLUMN IF EXISTS description;

-- Adicionar campos de status e ordem para categorias
ALTER TABLE categories 
  ADD COLUMN IF NOT EXISTS status boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS display_order integer;

-- Adicionar campos de SEO
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS status boolean NOT NULL DEFAULT true;

-- Melhorar constraints (verificando se já existem primeiro)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_price_positive'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT check_price_positive CHECK (price >= 0);
  END IF;
END $$;

-- Adicionar índices (verificando se já existem)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_categories_status'
  ) THEN
    CREATE INDEX idx_categories_status ON categories(status);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_categories_display_order'
  ) THEN
    CREATE INDEX idx_categories_display_order ON categories(display_order);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_products_status'
  ) THEN
    CREATE INDEX idx_products_status ON products(status);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_products_category_id'
  ) THEN
    CREATE INDEX idx_products_category_id ON products(category_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_products_created_at'
  ) THEN
    CREATE INDEX idx_products_created_at ON products(created_at);
  END IF;
END $$;

-- Função para atualizar a ordem de exibição das categorias
CREATE OR REPLACE FUNCTION update_category_order()
RETURNS trigger AS $$
BEGIN
  -- Se não foi especificada uma ordem, coloca no final
  IF NEW.display_order IS NULL THEN
    SELECT COALESCE(MAX(display_order), 0) + 1 
    INTO NEW.display_order 
    FROM categories 
    WHERE store_id = NEW.store_id 
    AND parent_id IS NOT DISTINCT FROM NEW.parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para manter a ordem das categorias
DROP TRIGGER IF EXISTS set_category_order ON categories;
CREATE TRIGGER set_category_order
  BEFORE INSERT ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_category_order();

-- Função para reordenar categorias
CREATE OR REPLACE FUNCTION reorder_categories(
  p_store_id uuid,
  p_category_ids uuid[]
)
RETURNS void AS $$
DECLARE
  v_order integer := 1;
  v_id uuid;
BEGIN
  FOREACH v_id IN ARRAY p_category_ids
  LOOP
    UPDATE categories 
    SET display_order = v_order 
    WHERE id = v_id AND store_id = p_store_id;
    v_order := v_order + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar produtos com filtros
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