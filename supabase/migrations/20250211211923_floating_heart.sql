/*
  # Add Missing Store Customization Columns

  1. New Columns
    - `description_size` for storing the description text size
    - `header_style` for storing the header style type
    - `header_image` for storing the header background image URL
    - `header_gradient` for storing the gradient direction
    - `logo_size` for storing the logo size
    - `title_size` for storing the title size

  2. Changes
    - Add default values for all new columns
    - Add comments for better documentation
*/

-- Add missing columns with defaults
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS description_size text DEFAULT '18px',
  ADD COLUMN IF NOT EXISTS header_style text DEFAULT 'solid',
  ADD COLUMN IF NOT EXISTS header_image text,
  ADD COLUMN IF NOT EXISTS header_gradient text DEFAULT 'to bottom',
  ADD COLUMN IF NOT EXISTS header_height text DEFAULT '400px',
  ADD COLUMN IF NOT EXISTS logo_size text DEFAULT '160px',
  ADD COLUMN IF NOT EXISTS title_size text DEFAULT '48px';

-- Add comments
COMMENT ON COLUMN stores.description_size IS 'Size of the store description text in pixels';
COMMENT ON COLUMN stores.header_style IS 'Header style type: solid, gradient, or image';
COMMENT ON COLUMN stores.header_image IS 'URL of the header background image';
COMMENT ON COLUMN stores.header_gradient IS 'Direction of the header gradient';
COMMENT ON COLUMN stores.header_height IS 'Height of the header in pixels';
COMMENT ON COLUMN stores.logo_size IS 'Size of the store logo in pixels';
COMMENT ON COLUMN stores.title_size IS 'Size of the store title in pixels';

-- Create index for header style for faster queries
CREATE INDEX IF NOT EXISTS idx_stores_header_style ON stores(header_style);