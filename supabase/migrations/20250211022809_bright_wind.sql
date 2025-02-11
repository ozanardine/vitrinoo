-- Adicionar campos para controle de estoque
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock_control boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS min_stock numeric(10,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_stock numeric(10,3),
  ADD COLUMN IF NOT EXISTS stock_unit text,
  ADD COLUMN IF NOT EXISTS weight numeric(10,3),
  ADD COLUMN IF NOT EXISTS weight_unit text,
  ADD COLUMN IF NOT EXISTS dimensions jsonb;

-- Adicionar constraint para garantir min_stock <= max_stock (com IF NOT EXISTS)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_stock_limits'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT check_stock_limits 
      CHECK (max_stock IS NULL OR min_stock <= max_stock);
  END IF;
END $$;

-- Rest of the file remains the same...