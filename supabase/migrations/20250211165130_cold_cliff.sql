-- Atualizar opções do atributo Tamanho
UPDATE product_attributes 
SET options = ARRAY['P', 'M', 'G', 'GG']
WHERE name = 'Tamanho';

-- Garantir que o atributo existe
INSERT INTO product_attributes (store_id, name, options)
SELECT 
  s.id,
  'Tamanho',
  ARRAY['P', 'M', 'G', 'GG']
FROM stores s
WHERE NOT EXISTS (
  SELECT 1 
  FROM product_attributes 
  WHERE store_id = s.id AND name = 'Tamanho'
);