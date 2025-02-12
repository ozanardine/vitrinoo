/*
  # Add Missing Store Columns

  1. New Columns
    - accent_color: Cor de destaque para botões e elementos importantes
    - header_overlay_opacity: Opacidade da sobreposição do cabeçalho
    - header_alignment: Alinhamento do conteúdo do cabeçalho
    - title_font: Fonte usada para títulos
    - body_font: Fonte usada para textos
    - product_card_style: Estilo dos cards de produto
    - grid_columns: Número de colunas na grade de produtos
    - grid_gap: Espaçamento entre os produtos
    - container_width: Largura máxima do conteúdo

  2. Changes
    - Adiciona valores padrão para todas as colunas
    - Adiciona comentários explicativos
    - Cria índices para otimização
*/

-- Add missing columns with defaults
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#0066FF',
  ADD COLUMN IF NOT EXISTS header_overlay_opacity text DEFAULT '50',
  ADD COLUMN IF NOT EXISTS header_alignment text DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS title_font text DEFAULT 'sans',
  ADD COLUMN IF NOT EXISTS body_font text DEFAULT 'sans',
  ADD COLUMN IF NOT EXISTS product_card_style text DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS grid_columns text DEFAULT '4',
  ADD COLUMN IF NOT EXISTS grid_gap text DEFAULT '24',
  ADD COLUMN IF NOT EXISTS container_width text DEFAULT 'max-w-7xl';

-- Add comments
COMMENT ON COLUMN stores.accent_color IS 'Cor de destaque para botões e elementos importantes';
COMMENT ON COLUMN stores.header_overlay_opacity IS 'Opacidade da sobreposição do cabeçalho (0-100)';
COMMENT ON COLUMN stores.header_alignment IS 'Alinhamento do conteúdo do cabeçalho (left, center, right)';
COMMENT ON COLUMN stores.title_font IS 'Fonte usada para títulos (sans, serif, display)';
COMMENT ON COLUMN stores.body_font IS 'Fonte usada para textos (sans, serif, mono)';
COMMENT ON COLUMN stores.product_card_style IS 'Estilo dos cards de produto (default, compact, minimal)';
COMMENT ON COLUMN stores.grid_columns IS 'Número de colunas na grade de produtos (2-5)';
COMMENT ON COLUMN stores.grid_gap IS 'Espaçamento entre os produtos em pixels';
COMMENT ON COLUMN stores.container_width IS 'Largura máxima do conteúdo (max-w-5xl, max-w-6xl, max-w-7xl, max-w-full)';

-- Create indexes for commonly queried columns
CREATE INDEX IF NOT EXISTS idx_stores_product_card_style ON stores(product_card_style);
CREATE INDEX IF NOT EXISTS idx_stores_header_alignment ON stores(header_alignment);

-- Add check constraints for valid values
DO $$ 
BEGIN
  -- Header alignment
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stores_header_alignment_check'
  ) THEN
    ALTER TABLE stores
      ADD CONSTRAINT stores_header_alignment_check
      CHECK (header_alignment IN ('left', 'center', 'right'));
  END IF;

  -- Product card style
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stores_product_card_style_check'
  ) THEN
    ALTER TABLE stores
      ADD CONSTRAINT stores_product_card_style_check
      CHECK (product_card_style IN ('default', 'compact', 'minimal'));
  END IF;

  -- Grid columns
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stores_grid_columns_check'
  ) THEN
    ALTER TABLE stores
      ADD CONSTRAINT stores_grid_columns_check
      CHECK (grid_columns IN ('2', '3', '4', '5'));
  END IF;

  -- Container width
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stores_container_width_check'
  ) THEN
    ALTER TABLE stores
      ADD CONSTRAINT stores_container_width_check
      CHECK (container_width IN ('max-w-5xl', 'max-w-6xl', 'max-w-7xl', 'max-w-full'));
  END IF;
END $$;