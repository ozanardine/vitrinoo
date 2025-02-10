-- Adicionar colunas para armazenar credenciais do Tiny ERP
ALTER TABLE erp_integrations
  ADD COLUMN IF NOT EXISTS client_id text,
  ADD COLUMN IF NOT EXISTS client_secret text,
  ADD COLUMN IF NOT EXISTS access_token text,
  ADD COLUMN IF NOT EXISTS refresh_token text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_erp_integrations_store_provider 
  ON erp_integrations(store_id, provider);

-- Função para validar credenciais antes de salvar
CREATE OR REPLACE FUNCTION validate_erp_credentials()
RETURNS trigger AS $$
BEGIN
  -- Se a integração estiver ativa, todos os campos são obrigatórios
  IF NEW.active = true THEN
    IF NEW.client_id IS NULL OR 
       NEW.client_secret IS NULL OR 
       NEW.access_token IS NULL OR 
       NEW.refresh_token IS NULL OR 
       NEW.expires_at IS NULL THEN
      RAISE EXCEPTION 'Todos os campos são obrigatórios para uma integração ativa';
    END IF;
  END IF;

  -- Verificar se a loja tem plano Plus
  IF NOT EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE store_id = NEW.store_id 
    AND plan_type = 'plus' 
    AND active = true
  ) THEN
    RAISE EXCEPTION 'Apenas lojas com plano Plus podem ter integrações com ERP';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para validação
DROP TRIGGER IF EXISTS validate_erp_credentials_trigger ON erp_integrations;
CREATE TRIGGER validate_erp_credentials_trigger
  BEFORE INSERT OR UPDATE ON erp_integrations
  FOR EACH ROW
  EXECUTE FUNCTION validate_erp_credentials();

-- Função para desativar edição manual de produtos quando houver integração
CREATE OR REPLACE FUNCTION check_erp_integration()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM erp_integrations
    WHERE store_id = NEW.store_id
    AND provider = 'tiny'
    AND active = true
  ) THEN
    RAISE EXCEPTION 'Não é possível modificar produtos manualmente quando há integração com ERP ativa';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para produtos
DROP TRIGGER IF EXISTS check_erp_integration_trigger ON products;
CREATE TRIGGER check_erp_integration_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION check_erp_integration();