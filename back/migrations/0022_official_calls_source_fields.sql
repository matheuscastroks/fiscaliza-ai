-- Campos do 1746 ainda não gravados: data real do diagnóstico, marcação de
-- Ouvidoria e a data de atualização informada pela fonte (updated_at).
ALTER TABLE official_calls
  ADD COLUMN IF NOT EXISTS diagnosed_at timestamptz,
  ADD COLUMN IF NOT EXISTS via_ombudsman boolean,
  ADD COLUMN IF NOT EXISTS source_updated_at timestamptz;
