-- Atualizar o plano do usuário para Plus
UPDATE subscriptions
SET plan_type = 'plus'
WHERE store_id IN (
  SELECT id FROM stores WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'ozanardine@gmail.com'
  )
);