-- Corrigir a função de validação de componentes
CREATE OR REPLACE FUNCTION validate_product_components()
RETURNS trigger AS $$
DECLARE
  cycle_exists boolean;
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
  ) INTO cycle_exists;

  IF cycle_exists THEN
    RAISE EXCEPTION 'Referência circular detectada nos componentes';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Rest of the file remains the same...