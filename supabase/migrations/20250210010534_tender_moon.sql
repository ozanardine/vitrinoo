/*
  # Adicionar suporte a múltiplas imagens por produto

  1. Alterações
    - Adiciona coluna `images` para armazenar múltiplas URLs de imagens
    - Migra dados existentes da coluna `image_url` para o novo formato
*/

-- Adicionar nova coluna para múltiplas imagens
ALTER TABLE products
  ADD COLUMN images text[] NOT NULL DEFAULT '{}';

-- Migrar dados existentes
UPDATE products
SET images = ARRAY[image_url]
WHERE image_url IS NOT NULL AND image_url != '';

-- Remover coluna antiga
ALTER TABLE products DROP COLUMN image_url;