/*
  # Adicionar coluna brand na tabela products

  1. Alterações
    - Adiciona coluna `brand` na tabela `products`
    - Cria índice para melhorar performance de busca por marca
*/

-- Adicionar coluna brand
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS brand text NOT NULL DEFAULT '';

-- Criar índice para busca por marca
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);