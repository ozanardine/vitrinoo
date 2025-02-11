-- Enum para tipos de produtos
CREATE TYPE product_type AS ENUM (
  'simple',      -- Produto simples
  'variable',    -- Produto com variações
  'kit',         -- Kit/Combo de produtos
  'manufactured' -- Produto fabricado/montado
);

-- Enum para tipos de componentes
CREATE TYPE component_type AS ENUM (
  'kit_item',        -- Item de um kit
  'raw_material',    -- Matéria prima
  'manufactured_part' -- Parte fabricada
);

-- Tabela de atributos de produtos
CREATE TABLE IF NOT EXISTS product_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  options text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(store_id, name)
);

-- Adicionar colunas na tabela products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS type product_type NOT NULL DEFAULT 'simple',
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES products(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS attributes jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS variation_attributes text[] DEFAULT '{}';

-- Tabela de componentes de produtos
CREATE TABLE IF NOT EXISTS product_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  component_id uuid REFERENCES products(id) ON DELETE RESTRICT,
  component_type component_type NOT NULL,
  quantity numeric(10,3) NOT NULL DEFAULT 1,
  unit text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, component_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_parent_id ON products(parent_id);
CREATE INDEX IF NOT EXISTS idx_products_attributes ON products USING gin(attributes);
CREATE INDEX IF NOT EXISTS idx_product_components_product_id ON product_components(product_id);
CREATE INDEX IF NOT EXISTS idx_product_components_component_id ON product_components(component_id);
CREATE INDEX IF NOT EXISTS idx_product_attributes_store_id ON product_attributes(store_id);

-- Enable RLS
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_components ENABLE ROW LEVEL SECURITY;

-- Policies para product_attributes
CREATE POLICY "Store owners can manage their product attributes"
  ON product_attributes
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

CREATE POLICY "Public can view product attributes"
  ON product_attributes
  FOR SELECT
  TO anon
  USING (true);

-- Policies para product_components
CREATE POLICY "Store owners can manage their product components"
  ON product_components
  FOR ALL
  TO authenticated
  USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN stores s ON s.id = p.store_id
      WHERE s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    product_id IN (
      SELECT p.id FROM products p
      JOIN stores s ON s.id = p.store_id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view product components"
  ON product_components
  FOR SELECT
  TO anon
  USING (true);

-- Função para validar componentes de produtos
CREATE OR REPLACE FUNCTION validate_product_components()
RETURNS trigger AS $$
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
    SELECT component_id, 1 as level
    FROM product_components
    WHERE product_id = NEW.component_id
    
    UNION ALL
    
    -- Caso recursivo
    SELECT pc.component_id, ct.level + 1
    FROM product_components pc
    JOIN component_tree ct ON pc.product_id = ct.component_id
    WHERE ct.level < 10 -- Limite de profundidade para evitar loops infinitos
  )
  SELECT 1 FROM component_tree WHERE component_id = NEW.product_id
  LIMIT 1
  INTO STRICT;
  
  RETURN NEW;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    -- Se não encontrou ciclos, está ok
    RETURN NEW;
  WHEN TOO_MANY_ROWS THEN
    -- Se encontrou ciclo
    RAISE EXCEPTION 'Referência circular detectada nos componentes';
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar componentes
DROP TRIGGER IF EXISTS validate_product_components_trigger ON product_components;
CREATE TRIGGER validate_product_components_trigger
  BEFORE INSERT OR UPDATE ON product_components
  FOR EACH ROW
  EXECUTE FUNCTION validate_product_components();

-- Função para validar atributos de produtos
CREATE OR REPLACE FUNCTION validate_product_attributes()
RETURNS trigger AS $$
BEGIN
  -- Validar atributos para produtos variáveis
  IF NEW.type = 'variable' AND array_length(NEW.variation_attributes, 1) IS NULL THEN
    RAISE EXCEPTION 'Produtos variáveis precisam ter pelo menos um atributo de variação';
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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar atributos
DROP TRIGGER IF EXISTS validate_product_attributes_trigger ON products;
CREATE TRIGGER validate_product_attributes_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION validate_product_attributes();

-- Função para calcular preço de kits e produtos fabricados
CREATE OR REPLACE FUNCTION calculate_product_cost(product_id uuid)
RETURNS numeric AS $$
DECLARE
  total_cost numeric := 0;
  component record;
BEGIN
  FOR component IN
    SELECT pc.quantity, p.price
    FROM product_components pc
    JOIN products p ON p.id = pc.component_id
    WHERE pc.product_id = product_id
  LOOP
    total_cost := total_cost + (component.quantity * component.price);
  END LOOP;

  RETURN total_cost;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar preço de custo quando componentes mudam
CREATE OR REPLACE FUNCTION update_product_cost()
RETURNS trigger AS $$
BEGIN
  -- Atualizar preço de custo do produto
  UPDATE products
  SET attributes = jsonb_set(
    attributes,
    '{cost_price}',
    to_jsonb(calculate_product_cost(NEW.product_id))
  )
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar preço de custo
DROP TRIGGER IF EXISTS update_product_cost_trigger ON product_components;
CREATE TRIGGER update_product_cost_trigger
  AFTER INSERT OR UPDATE OR DELETE ON product_components
  FOR EACH ROW
  EXECUTE FUNCTION update_product_cost();