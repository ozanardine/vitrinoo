/*
  # Melhorias no Sistema de Assinaturas

  1. Estrutura
    - Adiciona campos de auditoria
    - Melhora rastreamento de status
    - Adiciona campos para gestão de ciclo de vida

  2. Segurança
    - Reforça políticas RLS
    - Adiciona validações de integridade

  3. Performance
    - Índices otimizados
    - Cache de plano ativo

  4. Monitoramento
    - Logs de mudança de status
    - Histórico de transições
*/

-- Tabela para histórico de mudanças de plano
CREATE TABLE IF NOT EXISTS subscription_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id),
  previous_plan text,
  new_plan text,
  previous_status text,
  new_status text,
  changed_at timestamptz DEFAULT now(),
  reason text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Adicionar campos de auditoria e gestão
DO $$ 
BEGIN
  -- Campos de auditoria
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;

  -- Campos de ciclo de vida
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'canceled_reason'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN canceled_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'grace_period_end'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN grace_period_end timestamptz;
  END IF;

  -- Cache de plano ativo
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stores' AND column_name = 'active_subscription_id'
  ) THEN
    ALTER TABLE stores ADD COLUMN active_subscription_id uuid REFERENCES subscriptions(id);
  END IF;
END $$;

-- Índices otimizados
CREATE INDEX IF NOT EXISTS idx_subscriptions_store_status ON subscriptions(store_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_type ON subscriptions(plan_type);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_store ON stripe_subscriptions(store_id);

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
DROP TRIGGER IF EXISTS log_subscription_change_trigger ON subscriptions;
CREATE TRIGGER log_subscription_change_trigger
  AFTER UPDATE OF plan_type, status
  ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION log_subscription_change();

-- Função para atualizar subscription ativa da loja
CREATE OR REPLACE FUNCTION update_store_active_subscription()
RETURNS trigger AS $$
BEGIN
  -- Se a subscription foi ativada, atualiza a store
  IF NEW.active = true AND (OLD.active = false OR OLD.active IS NULL) THEN
    UPDATE stores
    SET active_subscription_id = NEW.id
    WHERE id = NEW.store_id;
  
  -- Se a subscription foi desativada, remove referência se for a ativa
  ELSIF NEW.active = false AND OLD.active = true THEN
    UPDATE stores
    SET 
      active_subscription_id = (
        SELECT id 
        FROM subscriptions 
        WHERE store_id = NEW.store_id 
          AND active = true 
          AND id != NEW.id
        ORDER BY created_at DESC 
        LIMIT 1
      )
    WHERE id = NEW.store_id 
      AND active_subscription_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para subscription ativa
DROP TRIGGER IF EXISTS update_store_active_subscription_trigger ON subscriptions;
CREATE TRIGGER update_store_active_subscription_trigger
  AFTER INSERT OR UPDATE OF active
  ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_store_active_subscription();

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
DROP TRIGGER IF EXISTS validate_subscription_transition_trigger ON subscriptions;
CREATE TRIGGER validate_subscription_transition_trigger
  BEFORE UPDATE OF status, next_payment_at, grace_period_end
  ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION validate_subscription_transition();

-- Políticas RLS aprimoradas
DROP POLICY IF EXISTS "Usuários podem ver suas próprias assinaturas" ON subscriptions;
CREATE POLICY "Usuários podem ver suas próprias assinaturas" ON subscriptions
  FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuários podem ver histórico de suas assinaturas" ON subscription_history;
CREATE POLICY "Usuários podem ver histórico de suas assinaturas" ON subscription_history
  FOR SELECT
  USING (
    subscription_id IN (
      SELECT id FROM subscriptions WHERE store_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
      )
    )
  );

-- Atualizar cache de subscription ativa
UPDATE stores s
SET active_subscription_id = (
  SELECT id
  FROM subscriptions sub
  WHERE sub.store_id = s.id
    AND sub.active = true
  ORDER BY sub.created_at DESC
  LIMIT 1
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription_id ON subscription_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_changed_at ON subscription_history(changed_at);

-- Adicionar comentários nas tabelas
COMMENT ON TABLE subscription_history IS 'Histórico de mudanças em assinaturas';
COMMENT ON TABLE subscriptions IS 'Assinaturas ativas e inativas das lojas';
COMMENT ON COLUMN stores.active_subscription_id IS 'ID da assinatura ativa atual da loja';
COMMENT ON COLUMN subscriptions.grace_period_end IS 'Data limite do período de carência após falha de pagamento';
COMMENT ON COLUMN subscriptions.canceled_reason IS 'Motivo do cancelamento da assinatura';