/*
  # Add public access policy for function keys

  1. Changes
    - Add policy to allow public read access to function keys
    - Only allow access to the tiny-token-exchange key
*/

-- Remove existing policy if it exists
DROP POLICY IF EXISTS "Allow read access to function keys" ON function_keys;

-- Create new policy for public access to specific key
CREATE POLICY "Allow public access to tiny-token-exchange key"
  ON function_keys
  FOR SELECT
  TO public
  USING (name = 'tiny-token-exchange');