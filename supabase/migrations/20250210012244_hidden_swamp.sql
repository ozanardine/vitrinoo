-- Primeiro desativa qualquer assinatura existente
UPDATE subscriptions
SET active = false
WHERE store_id IN (
  SELECT id FROM stores WHERE user_id = '0c1a7488-0070-4b76-8baa-d84376494251'
);

-- Insere uma nova assinatura Plus
INSERT INTO subscriptions (store_id, plan_type, active)
SELECT id, 'plus', true
FROM stores
WHERE user_id = '0c1a7488-0070-4b76-8baa-d84376494251'
AND NOT EXISTS (
  SELECT 1 FROM subscriptions 
  WHERE store_id = stores.id 
  AND plan_type = 'plus' 
  AND active = true
);