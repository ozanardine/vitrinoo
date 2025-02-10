/*
  # Labels System

  1. New Tables
    - `label_templates`
      - Standard templates for common label sizes and formats
    - `custom_labels`
      - User-created label designs
    - `label_fields`
      - Dynamic fields that can be added to labels

  2. Security
    - Enable RLS on all tables
    - Add policies for Plus plan users only
*/

-- Label Templates table (predefined formats)
CREATE TABLE IF NOT EXISTS label_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  width_mm numeric(10,2) NOT NULL,
  height_mm numeric(10,2) NOT NULL,
  margin_top_mm numeric(10,2) DEFAULT 0,
  margin_bottom_mm numeric(10,2) DEFAULT 0,
  margin_left_mm numeric(10,2) DEFAULT 0,
  margin_right_mm numeric(10,2) DEFAULT 0,
  paper_type text NOT NULL,
  columns integer DEFAULT 1,
  rows integer DEFAULT 1,
  gap_horizontal_mm numeric(10,2) DEFAULT 0,
  gap_vertical_mm numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Custom Labels table
CREATE TABLE IF NOT EXISTS custom_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  template_id uuid REFERENCES label_templates(id),
  design jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Label Fields table
CREATE TABLE IF NOT EXISTS label_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label_id uuid REFERENCES custom_labels(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('text', 'price', 'barcode', 'qrcode', 'image')),
  settings jsonb NOT NULL DEFAULT '{}',
  position_x numeric(10,2) NOT NULL,
  position_y numeric(10,2) NOT NULL,
  width numeric(10,2),
  height numeric(10,2),
  rotation numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE label_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE label_fields ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Everyone can view label templates"
  ON label_templates
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Plus users can manage their custom labels"
  ON custom_labels
  FOR ALL
  TO authenticated
  USING (
    store_id IN (
      SELECT s.id 
      FROM stores s
      JOIN subscriptions sub ON sub.store_id = s.id
      WHERE s.user_id = auth.uid()
      AND sub.plan_type = 'plus'
      AND sub.active = true
    )
  )
  WITH CHECK (
    store_id IN (
      SELECT s.id 
      FROM stores s
      JOIN subscriptions sub ON sub.store_id = s.id
      WHERE s.user_id = auth.uid()
      AND sub.plan_type = 'plus'
      AND sub.active = true
    )
  );

CREATE POLICY "Plus users can manage their label fields"
  ON label_fields
  FOR ALL
  TO authenticated
  USING (
    label_id IN (
      SELECT cl.id
      FROM custom_labels cl
      JOIN stores s ON s.id = cl.store_id
      JOIN subscriptions sub ON sub.store_id = s.id
      WHERE s.user_id = auth.uid()
      AND sub.plan_type = 'plus'
      AND sub.active = true
    )
  )
  WITH CHECK (
    label_id IN (
      SELECT cl.id
      FROM custom_labels cl
      JOIN stores s ON s.id = cl.store_id
      JOIN subscriptions sub ON sub.store_id = s.id
      WHERE s.user_id = auth.uid()
      AND sub.plan_type = 'plus'
      AND sub.active = true
    )
  );

-- Insert common label templates
INSERT INTO label_templates 
  (name, description, width_mm, height_mm, paper_type, columns, rows, gap_horizontal_mm, gap_vertical_mm)
VALUES
  ('Pimaco 6180', 'Etiqueta Pimaco 6180 (66,7 x 25,4mm)', 66.7, 25.4, 'A4', 3, 10, 2.5, 0),
  ('Pimaco 6181', 'Etiqueta Pimaco 6181 (84,7 x 101,6mm)', 84.7, 101.6, 'A4', 2, 7, 2.5, 0),
  ('Pimaco 6182', 'Etiqueta Pimaco 6182 (33,9 x 101,6mm)', 33.9, 101.6, 'A4', 2, 14, 2.5, 0),
  ('Pimaco 6183', 'Etiqueta Pimaco 6183 (38,1 x 63,5mm)', 38.1, 63.5, 'A4', 3, 10, 2.5, 0),
  ('Pimaco 6184', 'Etiqueta Pimaco 6184 (84,7 x 139,7mm)', 84.7, 139.7, 'A4', 2, 5, 2.5, 0),
  ('Pimaco 6185', 'Etiqueta Pimaco 6185 (25,4 x 66,7mm)', 25.4, 66.7, 'A4', 3, 10, 2.5, 0),
  ('Pimaco 6187', 'Etiqueta Pimaco 6187 (33,9 x 101,6mm)', 33.9, 101.6, 'A4', 2, 14, 2.5, 0),
  ('Térmica 40x25', 'Etiqueta Térmica 40x25mm (Rolo)', 40, 25, 'Térmica', 1, 1, 0, 0),
  ('Térmica 60x40', 'Etiqueta Térmica 60x40mm (Rolo)', 60, 40, 'Térmica', 1, 1, 0, 0),
  ('Térmica 100x50', 'Etiqueta Térmica 100x50mm (Rolo)', 100, 50, 'Térmica', 1, 1, 0, 0);