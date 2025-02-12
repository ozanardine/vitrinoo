/*
  # Correção da Sincronização de Assinaturas

  1. Funções
    - Função para determinar tipo do plano baseado no nome do produto
    - Função de sincronização de assinaturas
    - Trigger para atualização automática

  2. Colunas
    - Adicionada coluna updated_at na tabela subscriptions
    - Adicionada coluna next_payment_at na tabela subscriptions

  3. Triggers
    - Trigger para sincronização automática de assinaturas
*/

-- Adicionar colunas necessárias
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN updated_at timestamptz DEFAULT NOW();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'next_payment_at'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN next_payment_at timestamptz;
  END IF;
END $$;

-- Função para determinar o tipo do plano baseado no nome do produto
CREATE OR REPLACE FUNCTION get_plan_type_from_name(product_name text)
RETURNS text AS $$
BEGIN
  RETURN CASE 
    WHEN product_name ILIKE '%plus%' THEN 'plus'
    WHEN product_name ILIKE '%basic%' THEN 'basic'
    ELSE 'free'
  END;
END;
$$ LANGUAGE plpgsql;

-- Função principal de sincronização
CREATE OR REPLACE FUNCTION sync_subscription_plan()
RETURNS trigger AS $$
DECLARE
  plan_type text;
  store_id text;
  product_name text;
BEGIN
  -- Buscar nome do produto
  SELECT sp.name INTO product_name
  FROM stripe_prices p
  JOIN stripe_products sp ON p.product_id = sp.id
  WHERE p.id = NEW.price_id;

  -- Determinar o tipo do plano
  plan_type := get_plan_type_from_name(product_name);

  -- Buscar store_id da subscription
  SELECT s.store_id INTO store_id
  FROM subscriptions s
  WHERE s.stripe_subscription_id = NEW.id;

  -- Atualizar subscription
  UPDATE subscriptions
  SET 
    plan_type = COALESCE(plan_type, 'free'),
    active = NEW.status = 'active',
    status = NEW.status,
    next_payment_at = NEW.current_period_end,
    updated_at = NOW()
  WHERE stripe_subscription_id = NEW.id;

  -- Atualizar store
  IF store_id IS NOT NULL THEN
    UPDATE stores
    SET 
      plan_type = COALESCE(plan_type, 'free'),
      updated_at = NOW()
    WHERE id = store_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sincronização automática
DROP TRIGGER IF EXISTS sync_subscription_plan_trigger ON stripe_subscriptions;
CREATE TRIGGER sync_subscription_plan_trigger
  AFTER INSERT OR UPDATE OF status, price_id, current_period_end
  ON stripe_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscription_plan();

-- Função para sincronização periódica
CREATE OR REPLACE FUNCTION sync_all_subscriptions()
RETURNS void AS $$
DECLARE
  sub record;
  product_name text;
BEGIN
  FOR sub IN 
    SELECT ss.*, sp.name as product_name
    FROM stripe_subscriptions ss
    JOIN stripe_prices p ON ss.price_id = p.id
    JOIN stripe_products sp ON p.product_id = sp.id
    WHERE ss.status = 'active'
  LOOP
    -- Atualizar subscription usando o nome do produto
    UPDATE subscriptions
    SET 
      plan_type = get_plan_type_from_name(sub.product_name),
      active = sub.status = 'active',
      status = sub.status,
      next_payment_at = sub.current_period_end
    WHERE stripe_subscription_id = sub.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Criar função para agendar sincronização periódica
CREATE OR REPLACE FUNCTION schedule_subscription_sync()
RETURNS void AS $$
BEGIN
  PERFORM sync_all_subscriptions();
END;
$$ LANGUAGE plpgsql;

-- Criar extensão para agendamento se não existir
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar sincronização periódica
SELECT cron.schedule('sync-subscriptions', '0 * * * *', 'SELECT schedule_subscription_sync()');

-- Executar sincronização inicial
SELECT sync_all_subscriptions();