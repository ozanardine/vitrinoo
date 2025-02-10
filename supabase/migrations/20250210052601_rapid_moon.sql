/*
  # Insert Tiny token exchange function key
  
  1. Changes
    - Insert the function key for tiny-token-exchange if it doesn't exist
*/

-- Insert the function key if it doesn't exist
INSERT INTO function_keys (name, key)
SELECT 'tiny-token-exchange', generate_function_key()
WHERE NOT EXISTS (
  SELECT 1 FROM function_keys WHERE name = 'tiny-token-exchange'
);