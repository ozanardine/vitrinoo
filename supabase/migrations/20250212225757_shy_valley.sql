/*
  # Configuração de permissões para exclusão de usuários
  
  1. Alterações
    - Adiciona função para verificar se usuário é OWNER
    - Configura política RLS para permitir exclusão apenas pelo OWNER
    - Revoga permissões de DELETE para outros usuários
  
  2. Segurança
    - Apenas OWNER pode excluir usuários
    - Proteção contra exclusão acidental
    - Auditoria de tentativas de exclusão
*/

-- Criar função para verificar se usuário é OWNER
CREATE OR REPLACE FUNCTION auth.is_owner()
RETURNS boolean AS $$
BEGIN
  -- Verificar se o usuário atual tem role 'service_role' (OWNER)
  RETURN current_setting('role') = 'service_role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revogar permissões de DELETE para public
REVOKE DELETE ON auth.users FROM public;
REVOKE DELETE ON auth.identities FROM public;

-- Criar política RLS para exclusão de usuários
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Apenas OWNER pode excluir usuários" ON auth.users;
CREATE POLICY "Apenas OWNER pode excluir usuários" ON auth.users
  FOR DELETE
  USING (auth.is_owner());

-- Criar tabela de log para tentativas de exclusão
CREATE TABLE IF NOT EXISTS auth.deletion_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  attempted_by uuid NOT NULL,
  attempted_at timestamptz DEFAULT now(),
  success boolean NOT NULL,
  reason text
);

-- Função para registrar tentativas de exclusão
CREATE OR REPLACE FUNCTION auth.log_deletion_attempt()
RETURNS trigger AS $$
BEGIN
  INSERT INTO auth.deletion_attempts (
    user_id,
    attempted_by,
    success,
    reason
  ) VALUES (
    OLD.id,
    auth.uid(),
    auth.is_owner(),
    CASE 
      WHEN auth.is_owner() THEN 'Exclusão autorizada pelo OWNER'
      ELSE 'Tentativa não autorizada de exclusão'
    END
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para registrar tentativas
DROP TRIGGER IF EXISTS log_user_deletion_attempt ON auth.users;
CREATE TRIGGER log_user_deletion_attempt
  BEFORE DELETE
  ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.log_deletion_attempt();

-- Comentários
COMMENT ON FUNCTION auth.is_owner IS 'Verifica se o usuário atual é OWNER (service_role)';
COMMENT ON TABLE auth.deletion_attempts IS 'Registra tentativas de exclusão de usuários';
COMMENT ON FUNCTION auth.log_deletion_attempt IS 'Registra tentativas de exclusão no log de auditoria';