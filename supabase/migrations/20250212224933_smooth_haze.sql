/*
  # Configuração dos Planos e Assinatura de Demonstração

  1. Planos
    - Plano Demonstração (7 dias de trial com recursos Plus)
    - Plano Gratuito
    - Plano Básico
    - Plano Plus

  2. Configurações
    - Preços e IDs do Stripe
    - Metadados dos planos
    - Políticas de trial
*/

-- Limpar dados existentes
TRUNCATE TABLE stripe_products CASCADE;
TRUNCATE TABLE stripe_prices CASCADE;

-- Inserir produtos/planos
INSERT INTO stripe_products (product_id, name, description, metadata) VALUES
  (
    'prod_RlGWhI7e3WkYzs',
    'Plano Demonstração',
    'Experimente todos os recursos do plano Plus gratuitamente por 7 dias',
    jsonb_build_object(
      'plan_type', 'plus',
      'is_trial', true,
      'trial_days', 7
    )
  ),
  (
    'prod_RlG2OrPzfx2qhZ',
    'Plano Gratuito',
    'Comece gratuitamente com recursos básicos',
    jsonb_build_object(
      'plan_type', 'free',
      'is_trial', false
    )
  ),
  (
    'prod_RlG2VAVuhPmnQ9',
    'Plano Básico',
    'Ideal para pequenos negócios',
    jsonb_build_object(
      'plan_type', 'basic',
      'is_trial', false
    )
  ),
  (
    'prod_RlG2YipumdsH8P',
    'Plano Plus',
    'Recursos completos para seu negócio crescer',
    jsonb_build_object(
      'plan_type', 'plus',
      'is_trial', false
    )
  );

-- Inserir preços
INSERT INTO stripe_prices (price_id, product_id, unit_amount, currency, interval, trial_period_days) VALUES
  (
    'price_1QrjzJKOdXEklortWB5gBFDo',
    (SELECT id FROM stripe_products WHERE product_id = 'prod_RlGWhI7e3WkYzs'),
    0,
    'brl',
    'month',
    7
  ),
  (
    'price_1QrjW7KOdXEklortSTjCd56B',
    (SELECT id FROM stripe_products WHERE product_id = 'prod_RlG2OrPzfx2qhZ'),
    0,
    'brl',
    'month',
    NULL
  ),
  (
    'price_1QrjWNKOdXEklort1WzNdPIu',
    (SELECT id FROM stripe_products WHERE product_id = 'prod_RlG2VAVuhPmnQ9'),
    4700,
    'brl',
    'month',
    NULL
  ),
  (
    'price_1QrjWaKOdXEklortFCkdku6t',
    (SELECT id FROM stripe_products WHERE product_id = 'prod_RlG2YipumdsH8P'),
    9700,
    'brl',
    'month',
    NULL
  );

-- Função para criar assinatura de demonstração
CREATE OR REPLACE FUNCTION create_trial_subscription()
RETURNS trigger AS $$
DECLARE
  trial_product_id uuid;
  trial_price_id uuid;
  trial_end_date timestamptz;
BEGIN
  -- Buscar produto de demonstração
  SELECT id INTO trial_product_id
  FROM stripe_products
  WHERE product_id = 'prod_RlGWhI7e3WkYzs';

  -- Buscar preço do trial
  SELECT id INTO trial_price_id
  FROM stripe_prices
  WHERE product_id = trial_product_id;

  -- Calcular data de fim do trial
  trial_end_date := now() + interval '7 days';

  -- Criar assinatura de demonstração
  INSERT INTO subscriptions (
    store_id,
    plan_type,
    plan_name,
    plan_description,
    price_id,
    amount,
    currency,
    status,
    active,
    trial_ends_at
  ) VALUES (
    NEW.id, -- store_id
    'plus',  -- plano plus durante o trial
    'Plano Demonstração',
    'Experimente todos os recursos do plano Plus gratuitamente por 7 dias',
    trial_price_id,
    0,
    'brl',
    'trialing',
    true,
    trial_end_date
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar assinatura de demonstração
DROP TRIGGER IF EXISTS create_trial_subscription_trigger ON stores;
CREATE TRIGGER create_trial_subscription_trigger
  AFTER INSERT
  ON stores
  FOR EACH ROW
  EXECUTE FUNCTION create_trial_subscription();

-- Função para finalizar trial
CREATE OR REPLACE FUNCTION check_trial_expiration()
RETURNS void AS $$
BEGIN
  -- Atualizar assinaturas com trial expirado
  UPDATE subscriptions
  SET
    plan_type = 'free',
    plan_name = 'Plano Gratuito',
    plan_description = 'Comece gratuitamente com recursos básicos',
    status = 'active',
    price_id = (
      SELECT id 
      FROM stripe_prices 
      WHERE product_id = (
        SELECT id 
        FROM stripe_products 
        WHERE product_id = 'prod_RlG2OrPzfx2qhZ'
      )
    ),
    amount = 0,
    trial_ends_at = NULL,
    updated_at = now()
  WHERE 
    status = 'trialing' 
    AND trial_ends_at <= now();

  -- Atualizar plano das lojas
  UPDATE stores s
  SET 
    plan_type = 'free',
    updated_at = now()
  FROM subscriptions sub
  WHERE 
    sub.store_id = s.id
    AND sub.status = 'active'
    AND sub.plan_type = 'free';
END;
$$ LANGUAGE plpgsql;

-- Agendar verificação de trial expirado
SELECT cron.schedule(
  'check-trials',
  '*/5 * * * *',  -- A cada 5 minutos
  'SELECT check_trial_expiration()'
);

-- Executar verificação inicial
SELECT check_trial_expiration();