/*
  # Correção de funções e políticas de assinatura
  
  1. Alterações
    - Recria função get_store_subscription com drop prévio
    - Ajusta políticas RLS
    - Mantém permissões e índices
  
  2. Segurança
    - Mantém políticas RLS
    - Garante permissões corretas
*/

-- Ajustar políticas RLS para subscriptions
DROP POLICY IF EXISTS "Usuários podem ver suas próprias assinaturas" ON subscriptions;
CREATE POLICY "Usuários podem ver suas próprias assinaturas" ON subscriptions
  FOR ALL
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Ajustar políticas RLS para stores
DROP POLICY IF EXISTS "Usuários podem ver suas próprias lojas" ON stores;
CREATE POLICY "Usuários podem ver suas próprias lojas" ON stores
  FOR ALL
  USING (user_id = auth.uid());

-- Dropar função existente antes de recriar
DROP FUNCTION IF EXISTS get_store_subscription(uuid);

-- Recriar função com tipo de retorno correto
CREATE OR REPLACE FUNCTION get_store_subscription(store_id uuid)
RETURNS jsonb AS $$
DECLARE
  sub_data jsonb;
BEGIN
  SELECT jsonb_build_object(
    'plan_type', s.plan_type,
    'active', s.active,
    'status', s.status,
    'trial_ends_at', s.trial_ends_at,
    'next_payment_at', s.next_payment_at
  ) INTO sub_data
  FROM subscriptions s
  WHERE s.store_id = get_store_subscription.store_id
  AND s.active = true
  ORDER BY s.created_at DESC
  LIMIT 1;

  RETURN COALESCE(sub_data, jsonb_build_object(
    'plan_type', 'free',
    'active', true,
    'status', 'active',
    'trial_ends_at', null,
    'next_payment_at', null
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar assinatura de demonstração
CREATE OR REPLACE FUNCTION create_trial_subscription()
RETURNS trigger AS $$
DECLARE
  trial_price_id uuid;
BEGIN
  -- Buscar preço do trial
  SELECT id INTO trial_price_id
  FROM stripe_prices
  WHERE price_id = 'price_1QrjzJKOdXEklortWB5gBFDo'
  LIMIT 1;

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
    NEW.id,
    'plus',
    'Plano Demonstração',
    'Experimente todos os recursos do plano Plus gratuitamente por 7 dias',
    trial_price_id,
    0,
    'brl',
    'trialing',
    true,
    now() + interval '7 days'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar assinatura de demonstração
DROP TRIGGER IF EXISTS create_trial_subscription_trigger ON stores;
CREATE TRIGGER create_trial_subscription_trigger
  AFTER INSERT
  ON stores
  FOR EACH ROW
  EXECUTE FUNCTION create_trial_subscription();

-- Garantir permissões corretas
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_store_active ON subscriptions(store_id, active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_ends ON subscriptions(trial_ends_at) 
  WHERE status = 'trialing';

-- Comentários
COMMENT ON FUNCTION get_store_subscription IS 'Retorna dados da assinatura ativa de uma loja';
COMMENT ON FUNCTION create_trial_subscription IS 'Cria assinatura de demonstração para nova loja';