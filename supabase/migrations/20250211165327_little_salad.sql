-- Remove any default size options
UPDATE product_attributes 
SET options = '{}'
WHERE name = 'Tamanho';