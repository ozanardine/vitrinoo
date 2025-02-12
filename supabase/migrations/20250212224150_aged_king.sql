/*
  # Recriação do Sistema de Assinaturas

  1. Tabelas
    - stripe_customers: Clientes do Stripe
    - stripe_products: Produtos/Planos no Stripe
    - stripe_prices: Preços dos planos no Stripe
    - stripe_subscriptions: Assinaturas no Stripe
    - subscriptions: Assinaturas das lojas
    - subscription_history: Histórico de mudanças
    - stripe_webhook_logs: Logs de webhooks

  2. Relacionamentos
    - Todas as tabelas têm chaves estrangeiras apropriadas
    - Relacionamentos são protegidos com ON DELETE/UPDATE

  3. Índices
    - Otimizados para consultas comuns
    - Cobertura para joins frequentes

  4. Segurança
    - RLS em todas as tabelas
    - Validações de integridade
*/

-- Drop tabelas existentes em ordem reversa de dependência
DROP TABLE IF EXISTS subscription_history CASCADE;
DROP TABLE IF EXISTS stripe_webhook_logs CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS stripe_subscriptions CASCADE;
DROP TABLE IF EXISTS stripe_prices CASCADE;
DROP TABLE IF EXISTS stripe_products CASCADE;
DROP TABLE IF EXISTS stripe_customers CASCADE;

-- Criar tabelas do zero

-- Clientes do Stripe
CREATE TABLE stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id text NOT NULL UNIQUE,
  email text NOT NULL,
  name text,
  phone text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Produtos/Planos no Stripe
CREATE TABLE stripe_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_metadata CHECK (
    metadata ? 'plan_type' AND 
    metadata->>'plan_type' IN ('free', 'basic', 'plus')
  )
);

-- Preços dos planos
CREATE TABLE stripe_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price_id text NOT NULL UNIQUE,
  product_id uuid NOT NULL REFERENCES stripe_products(id) ON DELETE CASCADE,
  unit_amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'brl',
  interval text NOT NULL DEFAULT 'month',
  interval_count integer NOT NULL DEFAULT 1,
  trial_period_days integer,
  active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_interval CHECK (interval IN ('day', 'week', 'month', 'year')),
  CONSTRAINT positive_amount CHECK (unit_amount >= 0),
  CONSTRAINT valid_trial CHECK (trial_period_days IS NULL OR trial_period_days > 0)
);

-- Assinaturas no Stripe
CREATE TABLE stripe_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id text NOT NULL UNIQUE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES stripe_customers(id) ON DELETE CASCADE,
  price_id uuid NOT NULL REFERENCES stripe_prices(id) ON DELETE RESTRICT,
  status text NOT NULL,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamptz,
  cancel_at timestamptz,
  ended_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (
    status IN ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid')
  ),
  CONSTRAINT valid_dates CHECK (
    current_period_start < current_period_end AND
    (trial_start IS NULL OR trial_end IS NULL OR trial_start < trial_end) AND
    (canceled_at IS NULL OR canceled_at <= ended_at)
  )
);

-- Assinaturas das lojas
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  stripe_subscription_id uuid REFERENCES stripe_subscriptions(id) ON DELETE SET NULL,
  plan_type text NOT NULL DEFAULT 'free',
  plan_name text NOT NULL DEFAULT 'Gratuito',
  plan_description text,
  price_id uuid REFERENCES stripe_prices(id),
  amount integer,
  currency text DEFAULT 'brl',
  status text NOT NULL DEFAULT 'active',
  active boolean NOT NULL DEFAULT true,
  trial_ends_at timestamptz,
  next_payment_at timestamptz,
  grace_period_end timestamptz,
  canceled_reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_plan_type CHECK (plan_type IN ('free', 'basic', 'plus')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'trialing', 'past_due', 'canceled')),
  CONSTRAINT valid_dates CHECK (
    (trial_ends_at IS NULL OR trial_ends_at > created_at) AND
    (next_payment_at IS NULL OR next_payment_at > created_at) AND
    (grace_period_end IS NULL OR grace_period_end > created_at)
  ),
  CONSTRAINT valid_amount CHECK (amount IS NULL OR amount >= 0)
);

-- Histórico de mudanças
CREATE TABLE subscription_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  previous_plan text,
  new_plan text,
  previous_status text,
  new_status text,
  changed_at timestamptz DEFAULT now(),
  reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT valid_plans CHECK (
    (previous_plan IS NULL OR previous_plan IN ('free', 'basic', 'plus')) AND
    (new_plan IS NULL OR new_plan IN ('free', 'basic', 'plus'))
  ),
  CONSTRAINT valid_statuses CHECK (
    (previous_status IS NULL OR previous_status IN ('active', 'trialing', 'past_due', 'canceled')) AND
    (new_status IS NULL OR new_status IN ('active', 'trialing', 'past_due', 'canceled'))
  )
);

-- Logs de webhooks
CREATE TABLE stripe_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  status text NOT NULL,
  error_message text,
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('processing', 'success', 'error'))
);

-- Índices
CREATE INDEX idx_stripe_customers_user ON stripe_customers(user_id);
CREATE INDEX idx_stripe_customers_customer ON stripe_customers(customer_id);
CREATE INDEX idx_stripe_products_active ON stripe_products(active);
CREATE INDEX idx_stripe_prices_product ON stripe_prices(product_id);
CREATE INDEX idx_stripe_prices_active ON stripe_prices(active);
CREATE INDEX idx_stripe_subscriptions_store ON stripe_subscriptions(store_id);
CREATE INDEX idx_stripe_subscriptions_customer ON stripe_subscriptions(customer_id);
CREATE INDEX idx_stripe_subscriptions_status ON stripe_subscriptions(status);
CREATE INDEX idx_subscriptions_store ON subscriptions(store_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_plan_type ON subscriptions(plan_type);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscription_history_subscription ON subscription_history(subscription_id);
CREATE INDEX idx_subscription_history_changed_at ON subscription_history(changed_at);
CREATE INDEX idx_webhook_logs_event ON stripe_webhook_logs(event_id);
CREATE INDEX idx_webhook_logs_status ON stripe_webhook_logs(status);

-- Habilitar RLS
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver seus próprios dados" ON stripe_customers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Usuários podem ver produtos ativos" ON stripe_products
  FOR SELECT USING (active = true);

CREATE POLICY "Usuários podem ver preços ativos" ON stripe_prices
  FOR SELECT USING (active = true);

CREATE POLICY "Usuários podem ver suas próprias assinaturas Stripe" ON stripe_subscriptions
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem ver suas próprias assinaturas" ON subscriptions
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem ver histórico de suas assinaturas" ON subscription_history
  FOR SELECT USING (
    subscription_id IN (
      SELECT id FROM subscriptions WHERE store_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
      )
    )
  );

-- Funções e Triggers

-- Função para registrar mudanças de plano
CREATE OR REPLACE FUNCTION log_subscription_change()
RETURNS trigger AS $$
BEGIN
  IF (NEW.plan_type != OLD.plan_type OR NEW.status != OLD.status) THEN
    INSERT INTO subscription_history (
      subscription_id,
      previous_plan,
      new_plan,
      previous_status,
      new_status,
      reason,
      metadata
    ) VALUES (
      NEW.id,
      OLD.plan_type,
      NEW.plan_type,
      OLD.status,
      NEW.status,
      CASE 
        WHEN NEW.status = 'canceled' THEN NEW.canceled_reason
        ELSE NULL
      END,
      jsonb_build_object(
        'changed_by', current_user,
        'changed_at', now(),
        'previous_active', OLD.active,
        'new_active', NEW.active
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para logging
CREATE TRIGGER log_subscription_change_trigger
  AFTER UPDATE OF plan_type, status
  ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION log_subscription_change();

-- Função para atualizar plano da loja
CREATE OR REPLACE FUNCTION update_store_plan()
RETURNS trigger AS $$
BEGIN
  UPDATE stores 
  SET 
    plan_type = NEW.plan_type,
    updated_at = NOW()
  WHERE id = NEW.store_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar plano da loja
CREATE TRIGGER update_store_plan_trigger
  AFTER INSERT OR UPDATE OF plan_type
  ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_store_plan();

-- Função para validar transições de status
CREATE OR REPLACE FUNCTION validate_subscription_transition()
RETURNS trigger AS $$
BEGIN
  -- Validar transições de status permitidas
  IF OLD.status = 'active' AND NEW.status NOT IN ('active', 'canceled', 'past_due') THEN
    RAISE EXCEPTION 'Transição de status inválida: % -> %', OLD.status, NEW.status;
  END IF;

  IF OLD.status = 'canceled' AND NEW.status != 'canceled' THEN
    RAISE EXCEPTION 'Não é possível reativar uma assinatura cancelada';
  END IF;

  -- Validar datas
  IF NEW.next_payment_at IS NOT NULL AND NEW.next_payment_at <= now() THEN
    RAISE EXCEPTION 'Data de próximo pagamento deve ser futura';
  END IF;

  IF NEW.grace_period_end IS NOT NULL AND NEW.grace_period_end <= now() THEN
    RAISE EXCEPTION 'Data de fim do período de carência deve ser futura';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validação
CREATE TRIGGER validate_subscription_transition_trigger
  BEFORE UPDATE OF status, next_payment_at, grace_period_end
  ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION validate_subscription_transition();

-- Comentários nas tabelas
COMMENT ON TABLE stripe_customers IS 'Clientes do Stripe vinculados aos usuários';
COMMENT ON TABLE stripe_products IS 'Produtos/Planos cadastrados no Stripe';
COMMENT ON TABLE stripe_prices IS 'Preços dos planos no Stripe';
COMMENT ON TABLE stripe_subscriptions IS 'Assinaturas ativas no Stripe';
COMMENT ON TABLE subscriptions IS 'Assinaturas das lojas';
COMMENT ON TABLE subscription_history IS 'Histórico de mudanças em assinaturas';
COMMENT ON TABLE stripe_webhook_logs IS 'Logs de webhooks do Stripe';

-- Criar assinatura gratuita para lojas existentes
INSERT INTO subscriptions (
  store_id,
  plan_type,
  plan_name,
  status,
  active
)
SELECT 
  id as store_id,
  'free' as plan_type,
  'Gratuito' as plan_name,
  'active' as status,
  true as active
FROM stores s
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions sub WHERE sub.store_id = s.id
);