/*
  # Fix Product Types Structure

  1. Fixes
    - Corrige a função validate_product_components
    - Adiciona validações adicionais
    - Melhora a detecção de ciclos

  2. Improvements
    - Adiciona campos para controle de estoque
    - Melhora constraints e validações
    - Adiciona índices para melhor performance
*/

-- Corrigir a função de validação de componentes
CREATE OR REPLACE FUNCTION validate_product_components()
RETURNS trigger AS $$
DECLARE
  has_cycle boolean;
BEGIN
  -- Validar tipo do produto
  IF NOT EXISTS (
    SELECT 1 FROM products
    WHERE id = NEW.product_id
    AND type IN ('kit', 'manufactured')
  ) THEN
    RAISE EXCEPTION 'Apenas produtos do tipo kit ou fabricado podem ter componentes';
  END IF;

  -- Validar quantidade
  IF NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'A quantidade deve ser maior que zero';
  END IF;

  -- Validar ciclos (evitar referência circular)
  WITH RECURSIVE component_tree AS (
    -- Base case: componentes diretos
    SELECT component_id, ARRAY[NEW.product_id] as path
    FROM product_components
    WHERE product_id = NEW.component_id
    
    UNION ALL
    
    -- Caso recursivo
    SELECT pc.component_id, ct.path || pc.product_id
    FROM product_components pc
    JOIN component_tree ct ON pc.product_id = ct.component_id
    WHERE NOT pc.component_id = ANY(ct.path)
    AND array_length(ct.path, 1) < 10
  )
  SELECT EXISTS (
    SELECT 1 FROM component_tree 
    WHERE component_id = NEW.product_id
  ) INTO has_cycle;

  IF has_cycle THEN
    RAISE EXCEPTION 'Referência circular detectada nos componentes';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Adicionar campos para controle de estoque
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock_control boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS min_stock numeric(10,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_stock numeric(10,3),
  ADD COLUMN IF NOT EXISTS stock_unit text,
  ADD COLUMN IF NOT EXISTS weight numeric(10,3),
  ADD COLUMN IF NOT EXISTS weight_unit text,
  ADD COLUMN IF NOT EXISTS dimensions jsonb;

-- Adicionar constraint para garantir min_stock <= max_stock
ALTER TABLE products
  ADD CONSTRAINT check_stock_limits 
  CHECK (max_stock IS NULL OR min_stock <= max_stock);

-- Melhorar a função de validação de atributos
CREATE OR REPLACE FUNCTION validate_product_attributes()
RETURNS trigger AS $$
BEGIN
  -- Validar atributos para produtos variáveis
  IF NEW.type = 'variable' THEN
    IF array_length(NEW.variation_attributes, 1) IS NULL THEN
      RAISE EXCEPTION 'Produtos variáveis precisam ter pelo menos um atributo de variação';
    END IF;

    -- Verificar se os atributos existem
    IF NOT EXISTS (
      SELECT 1 FROM product_attributes
      WHERE store_id = NEW.store_id
      AND name = ANY(NEW.variation_attributes)
    ) THEN
      RAISE EXCEPTION 'Um ou mais atributos de variação não existem';
    END IF;
  END IF;

  -- Validar que produtos simples não têm variações
  IF NEW.type = 'simple' AND NEW.parent_id IS NOT NULL THEN
    RAISE EXCEPTION 'Produtos simples não podem ser variações';
  END IF;

  -- Validar que apenas produtos variáveis podem ter variações
  IF NEW.parent_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM products
      WHERE id = NEW.parent_id
      AND type = 'variable'
    ) THEN
      RAISE EXCEPTION 'Apenas produtos variáveis podem ter variações';
    END IF;

    -- Validar que variação tem todos os atributos do pai
    IF NOT EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = NEW.parent_id
      AND NOT EXISTS (
        SELECT unnest(p.variation_attributes) EXCEPT
        SELECT key FROM jsonb_object_keys(NEW.attributes::jsonb) k(key)
      )
    ) THEN
      RAISE EXCEPTION 'A variação deve ter todos os atributos definidos no produto pai';
    END IF;
  END IF;

  -- Validar dimensões
  IF NEW.dimensions IS NOT NULL AND NOT (
    NEW.dimensions ? 'length' AND 
    NEW.dimensions ? 'width' AND 
    NEW.dimensions ? 'height' AND
    NEW.dimensions ? 'unit'
  ) THEN
    RAISE EXCEPTION 'Dimensões devem incluir comprimento, largura, altura e unidade';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Melhorar a função de cálculo de custo
CREATE OR REPLACE FUNCTION calculate_product_cost(product_id uuid)
RETURNS numeric AS $$
DECLARE
  total_cost numeric := 0;
  component record;
  base_cost numeric;
BEGIN
  -- Primeiro pega o custo base do produto (se houver)
  SELECT (attributes->>'base_cost')::numeric INTO base_cost
  FROM products
  WHERE id = product_id;

  -- Soma o custo dos componentes
  FOR component IN
    SELECT 
      pc.quantity,
      p.price,
      COALESCE((p.attributes->>'cost_price')::numeric, p.price) as cost_price
    FROM product_components pc
    JOIN products p ON p.id = pc.component_id
    WHERE pc.product_id = product_id
  LOOP
    -- Usa o preço de custo se disponível, senão usa o preço de venda
    total_cost := total_cost + (component.quantity * COALESCE(component.cost_price, component.price));
  END LOOP;

  -- Adiciona o custo base
  RETURN COALESCE(base_cost, 0) + total_cost;
END;
$$ LANGUAGE plpgsql;

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_products_stock_control ON products(stock_control) WHERE stock_control = true;
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock) WHERE stock_control = true;
CREATE INDEX IF NOT EXISTS idx_products_weight ON products(weight) WHERE weight IS NOT NULL;

-- Adicionar função para validar estoque
CREATE OR REPLACE FUNCTION validate_stock()
RETURNS trigger AS $$
BEGIN
  -- Se controle de estoque está ativado
  IF NEW.stock_control THEN
    -- Validar unidade
    IF NEW.stock_unit IS NULL THEN
      RAISE EXCEPTION 'Unidade de estoque é obrigatória quando controle de estoque está ativado';
    END IF;

    -- Validar limites
    IF NEW.stock < NEW.min_stock THEN
      RAISE EXCEPTION 'Estoque não pode ser menor que o mínimo';
    END IF;

    IF NEW.max_stock IS NOT NULL AND NEW.stock > NEW.max_stock THEN
      RAISE EXCEPTION 'Estoque não pode ser maior que o máximo';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Adicionar trigger para validação de estoque
DROP TRIGGER IF EXISTS validate_stock_trigger ON products;
CREATE TRIGGER validate_stock_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION validate_stock();