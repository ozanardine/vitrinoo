-- Adicionar campos para descrição e redes sociais
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '[]'::jsonb;

-- Criar índice para busca em social_links
CREATE INDEX IF NOT EXISTS idx_stores_social_links ON stores USING gin(social_links);

-- Criar type para tipos de redes sociais
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'social_network_type') THEN
    CREATE TYPE social_network_type AS ENUM (
      'website',
      'instagram',
      'facebook',
      'twitter',
      'youtube',
      'tiktok',
      'linkedin',
      'whatsapp',
      'telegram',
      'pinterest',
      'email'
    );
  END IF;
END$$;

-- Criar função para validar formato de links sociais
CREATE OR REPLACE FUNCTION validate_social_links()
RETURNS trigger AS $$
BEGIN
  IF NOT (
    SELECT bool_and(
      (value->>'type') IS NOT NULL AND
      (value->>'url') IS NOT NULL AND
      (value->>'type')::social_network_type IS NOT NULL
    )
    FROM jsonb_array_elements(NEW.social_links)
  ) THEN
    RAISE EXCEPTION 'Invalid social links format';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para validar links sociais
DROP TRIGGER IF EXISTS validate_social_links_trigger ON stores;
CREATE TRIGGER validate_social_links_trigger
  BEFORE INSERT OR UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION validate_social_links();