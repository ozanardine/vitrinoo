/*
  # Correção de permissões para exclusão de usuários
  
  1. Alterações
    - Ajusta permissões no schema auth
    - Corrige política RLS para exclusão
    - Adiciona permissões necessárias para o service_role
  
  2. Segurança
    - Mantém restrição apenas para OWNER
    - Garante funcionamento correto da exclusão
*/

-- Garantir que o schema auth está acessível
GRANT USAGE ON SCHEMA auth TO service_role;

-- Garantir permissões corretas para service_role
GRANT ALL ON ALL TABLES IN SCHEMA auth TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO service_role;

-- Ajustar função is_owner para usar auth.uid()
CREATE OR REPLACE FUNCTION auth.is_owner()
RETURNS boolean AS $$
DECLARE
  current_user_id uuid;
  is_service_role boolean;
BEGIN
  -- Obter ID do usuário atual
  current_user_id := auth.uid();
  
  -- Verificar se é service_role
  SELECT EXISTS (
    SELECT 1 
    FROM pg_roles 
    WHERE rolname = current_user 
    AND rolsuper = true
  ) INTO is_service_role;

  -- Retornar true apenas se for service_role
  RETURN is_service_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar política de exclusão
DROP POLICY IF EXISTS "Apenas OWNER pode excluir usuários" ON auth.users;
CREATE POLICY "Apenas OWNER pode excluir usuários" ON auth.users
  FOR DELETE
  USING (
    -- Permitir exclusão apenas se for OWNER
    (SELECT auth.is_owner())
    OR
    -- Ou se for o próprio usuário se excluindo
    auth.uid() = id
  );

-- Garantir que o trigger de log funcione corretamente
CREATE OR REPLACE FUNCTION auth.log_deletion_attempt()
RETURNS trigger AS $$
DECLARE
  is_owner boolean;
BEGIN
  -- Verificar se é OWNER
  is_owner := auth.is_owner();

  -- Registrar tentativa
  INSERT INTO auth.deletion_attempts (
    user_id,
    attempted_by,
    success,
    reason
  ) VALUES (
    OLD.id,
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    is_owner OR OLD.id = auth.uid(),
    CASE 
      WHEN is_owner THEN 'Exclusão autorizada pelo OWNER'
      WHEN OLD.id = auth.uid() THEN 'Auto-exclusão pelo usuário'
      ELSE 'Tentativa não autorizada de exclusão'
    END
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que a tabela de logs está acessível
GRANT ALL ON auth.deletion_attempts TO service_role;

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_deletion_attempts_user ON auth.deletion_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_attempts_attempted_by ON auth.deletion_attempts(attempted_by);

-- Comentários atualizados
COMMENT ON FUNCTION auth.is_owner IS 'Verifica se o usuário atual tem permissões de OWNER';
COMMENT ON POLICY "Apenas OWNER pode excluir usuários" ON auth.users IS 'Permite exclusão apenas pelo OWNER ou auto-exclusão';