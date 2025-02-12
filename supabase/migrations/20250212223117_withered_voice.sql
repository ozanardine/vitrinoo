/*
  # Correção da Vinculação de Assinaturas com Lojas

  1. Ajustes
    - Adiciona coluna store_id na tabela stripe_subscriptions
    - Cria função para buscar store_id durante checkout
    - Atualiza triggers para usar store_id correto
    - Migra dados existentes

  2. Segurança
    - Atualiza políticas RLS para usar store_id
*/

-- Adicionar coluna store_id na tabela stripe_subscriptions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stripe_subscriptions' AND column_name = 'store_id'
  ) THEN
    ALTER TABLE stripe_subscriptions ADD COLUMN store_id uuid REFERENCES stores(id);
  END IF;
END $$;

-- Função para buscar store_id durante checkout
CREATE OR REPLACE FUNCTION get_store_from_checkout_session(session_id text)
RETURNS uuid AS $$
DECLARE
  store_id uuid;
BEGIN
  -- Buscar store_id do metadata da sessão
  SELECT s.id INTO store_id
  FROM stores s
  JOIN subscriptions sub ON sub.store_id = s.id
  JOIN stripe_subscriptions ss ON ss.id = sub.stripe_subscription_id
  WHERE ss.subscription_id = session_id;

  RETURN store_id;
END;
$$ LANGUAGE plpgsql;

-- Função para sincronizar store_id
CREATE OR REPLACE FUNCTION sync_subscription_store()
RETURNS trigger AS $$
BEGIN
  -- Atualizar store_id na stripe_subscription
  UPDATE stripe_subscriptions
  SET store_id = (
    SELECT store_id 
    FROM subscriptions 
    WHERE stripe_subscription_id = NEW.id
  )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sincronizar store_id
DROP TRIGGER IF EXISTS sync_subscription_store_trigger ON stripe_subscriptions;
CREATE TRIGGER sync_subscription_store_trigger
  AFTER INSERT
  ON stripe_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscription_store();

-- Atualizar store_id em stripe_subscriptions existentes
UPDATE stripe_subscriptions ss
SET store_id = s.store_id
FROM subscriptions s
WHERE s.stripe_subscription_id = ss.id;

-- Atualizar políticas RLS
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver suas próprias stripe_subscriptions" ON stripe_subscriptions;
CREATE POLICY "Usuários podem ver suas próprias stripe_subscriptions" ON stripe_subscriptions
  FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Função atualizada para sincronização de plano
CREATE OR REPLACE FUNCTION sync_subscription_plan()
RETURNS trigger AS $$
DECLARE
  plan_type text;
  product_name text;
BEGIN
  -- Buscar nome do produto
  SELECT sp.name INTO product_name
  FROM stripe_prices p
  JOIN stripe_products sp ON p.product_id = sp.id
  WHERE p.id = NEW.price_id;

  -- Determinar o tipo do plano do metadata
  SELECT sp.metadata->>'plan_type' INTO plan_type
  FROM stripe_prices p
  JOIN stripe_products sp ON p.product_id = sp.id
  WHERE p.id = NEW.price_id;

  -- Fallback para determinação por nome se metadata não existir
  IF plan_type IS NULL THEN
    plan_type := CASE 
      WHEN product_name ILIKE '%plus%' THEN 'plus'
      WHEN product_name ILIKE '%basic%' THEN 'basic'
      ELSE 'free'
    END;
  END IF;

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
  IF NEW.store_id IS NOT NULL THEN
    UPDATE stores
    SET 
      plan_type = COALESCE(plan_type, 'free'),
      updated_at = NOW()
    WHERE id = NEW.store_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger com função atualizada
DROP TRIGGER IF EXISTS sync_subscription_plan_trigger ON stripe_subscriptions;
CREATE TRIGGER sync_subscription_plan_trigger
  AFTER INSERT OR UPDATE OF status, price_id, current_period_end
  ON stripe_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscription_plan();