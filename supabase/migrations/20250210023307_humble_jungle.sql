/*
  # Correção da Restrição de Chave Estrangeira para Categorias

  1. Alterações
    - Modificar a restrição de chave estrangeira products_category_id_fkey
    - Adicionar ON DELETE SET NULL para permitir exclusão de categorias
    - Garantir que produtos não fiquem órfãos

  2. Segurança
    - Mantém a integridade referencial
    - Permite exclusão segura de categorias
    - Preserva os produtos existentes
*/

-- Primeiro removemos a restrição existente
ALTER TABLE products 
  DROP CONSTRAINT IF EXISTS products_category_id_fkey;

-- Adicionamos a nova restrição com ON DELETE SET NULL
ALTER TABLE products
  ADD CONSTRAINT products_category_id_fkey 
  FOREIGN KEY (category_id) 
  REFERENCES categories(id) 
  ON DELETE SET NULL;

-- Criar um trigger para atualizar a data de modificação do produto quando a categoria mudar
CREATE OR REPLACE FUNCTION update_product_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Adicionar o trigger para atualização automática do timestamp
DROP TRIGGER IF EXISTS update_product_timestamp ON products;
CREATE TRIGGER update_product_timestamp
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_timestamp();