-- Criar tabela para chaves de funções
CREATE TABLE IF NOT EXISTS function_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE function_keys ENABLE ROW LEVEL SECURITY;

-- Criar política para leitura
CREATE POLICY "Allow read access to function keys"
  ON function_keys
  FOR SELECT
  TO authenticated
  USING (true);

-- Criar função para gerar chave aleatória
CREATE OR REPLACE FUNCTION generate_function_key()
RETURNS text AS $$
DECLARE
  chars text[] := ARRAY['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
                       'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
                       '0','1','2','3','4','5','6','7','8','9'];
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..32 LOOP
    result := result || chars[1 + floor(random() * array_length(chars, 1))];
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Inserir chave para tiny-token-exchange
INSERT INTO function_keys (name, key)
VALUES ('tiny-token-exchange', generate_function_key())
ON CONFLICT (name) DO UPDATE
SET key = generate_function_key(), updated_at = now();