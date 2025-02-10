/*
  # Melhorias no sistema de categorias e produtos

  1. Alterações nas Tabelas
    - Adiciona coluna category_id na tabela products
    - Remove coluna category da tabela products
    - Adiciona função para contar apenas categorias pai
    - Adiciona função para validar limites de categorias

  2. Funções
    - get_root_categories_count: Conta apenas categorias pai
    - validate_category_limit: Valida limite de categorias pai
    - get_category_full_path: Retorna caminho completo da categoria

  3. Triggers
    - Validação automática de limites ao inserir categorias
    - Atualização automática de caminhos de categoria
*/

-- Remove a coluna category e adiciona category_id
ALTER TABLE products
  DROP COLUMN IF EXISTS category,
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES categories(id);

-- Função para contar apenas categorias pai
CREATE OR REPLACE FUNCTION get_root_categories_count(store_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM categories
    WHERE store_id = store_id_param
    AND parent_id IS NULL
  );
END;
$$;

-- Função para validar limite de categorias
CREATE OR REPLACE FUNCTION validate_category_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  store_plan text;
  category_limit integer;
  current_count integer;
BEGIN
  -- Só valida se for categoria pai
  IF NEW.parent_id IS NULL THEN
    -- Obtém o plano da loja
    SELECT plan_type INTO store_plan
    FROM subscriptions
    WHERE store_id = NEW.store_id
    AND active = true
    LIMIT 1;

    -- Define o limite baseado no plano
    category_limit := CASE store_plan
      WHEN 'free' THEN 5
      WHEN 'basic' THEN 20
      WHEN 'plus' THEN NULL -- Plano plus não tem limite
      ELSE 5 -- Padrão para plano free
    END;

    -- Se houver limite, valida
    IF category_limit IS NOT NULL THEN
      current_count := get_root_categories_count(NEW.store_id);
      
      IF current_count >= category_limit THEN
        RAISE EXCEPTION 'Limite de categorias pai atingido para o plano %', store_plan;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger para validar limite de categorias
DROP TRIGGER IF EXISTS validate_category_limit_trigger ON categories;
CREATE TRIGGER validate_category_limit_trigger
  BEFORE INSERT ON categories
  FOR EACH ROW
  EXECUTE FUNCTION validate_category_limit();

-- Função para obter caminho completo da categoria
CREATE OR REPLACE FUNCTION get_category_full_path(category_id_param uuid)
RETURNS TABLE (
  id uuid,
  name text,
  level integer
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY WITH RECURSIVE category_path AS (
    -- Base case: categoria atual
    SELECT c.id, c.name, 0 as level
    FROM categories c
    WHERE c.id = category_id_param

    UNION ALL

    -- Caso recursivo: busca os pais
    SELECT c.id, c.name, cp.level + 1
    FROM category_path cp
    JOIN categories c ON c.id = (
      SELECT parent_id 
      FROM categories 
      WHERE id = cp.id
    )
  )
  SELECT * FROM category_path
  ORDER BY level DESC;
END;
$$;