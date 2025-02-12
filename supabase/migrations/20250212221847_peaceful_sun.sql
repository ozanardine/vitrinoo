/*
  # Ajuste nas tabelas de assinatura

  1. Alterações
    - Adiciona coluna `plan_type` na tabela `subscriptions`
    - Adiciona coluna `active` na tabela `subscriptions`
    - Adiciona coluna `status` na tabela `subscriptions`
    - Adiciona coluna `metadata` na tabela `stripe_products`
    - Atualiza políticas RLS

  2. Atualizações
    - Atualiza registros existentes com valores padrão
    - Sincroniza planos entre Stripe e Supabase
*/

-- Adiciona novas colunas na tabela subscriptions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'plan_type'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN plan_type text NOT NULL DEFAULT 'free';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'active'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN active boolean NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'status'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN status text NOT NULL DEFAULT 'active';
  END IF;
END $$;

-- Adiciona coluna metadata na tabela stripe_products
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stripe_products' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE stripe_products ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Atualiza políticas RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver suas próprias assinaturas" ON subscriptions;
CREATE POLICY "Usuários podem ver suas próprias assinaturas" ON subscriptions
  FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Função para atualizar plano da loja
CREATE OR REPLACE FUNCTION update_store_plan()
RETURNS trigger AS $$
BEGIN
  -- Atualiza o plano da loja quando a assinatura muda
  UPDATE stores 
  SET 
    plan_type = NEW.plan_type,
    updated_at = NOW()
  WHERE id = NEW.store_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar plano da loja
DROP TRIGGER IF EXISTS update_store_plan_trigger ON subscriptions;
CREATE TRIGGER update_store_plan_trigger
  AFTER INSERT OR UPDATE OF plan_type
  ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_store_plan();

-- Atualiza os metadados dos produtos Stripe com os tipos de plano
UPDATE stripe_products
SET metadata = jsonb_build_object(
  'plan_type',
  CASE 
    WHEN name ILIKE '%basic%' THEN 'basic'
    WHEN name ILIKE '%plus%' THEN 'plus'
    ELSE 'free'
  END
);

-- Atualiza registros existentes baseado no status da assinatura
UPDATE subscriptions s
SET 
  plan_type = CASE
    WHEN ss.status = 'active' THEN 
      CASE 
        WHEN p.name ILIKE '%plus%' THEN 'plus'
        WHEN p.name ILIKE '%basic%' THEN 'basic'
        ELSE 'free'
      END
    ELSE 'free'
  END,
  active = CASE 
    WHEN ss.status = 'active' THEN true
    ELSE false
  END,
  status = ss.status
FROM stripe_subscriptions ss
JOIN stripe_prices sp ON ss.price_id = sp.id
JOIN stripe_products p ON sp.product_id = p.id
WHERE s.stripe_subscription_id = ss.id;

-- Atualiza planos que não têm assinatura Stripe para free
UPDATE subscriptions
SET 
  plan_type = 'free',
  active = true,
  status = 'active'
WHERE stripe_subscription_id IS NULL;