-- Índices que faltavam para as chaves estrangeiras de contas, remoção de um
-- índice duplicado da restrição UNIQUE e vínculo do chamado ao município.
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_attachments_owner ON attachments(owner_id);
CREATE INDEX IF NOT EXISTS idx_records_author ON records(author_id);
-- official_calls_external_id_key (UNIQUE) já cobre as buscas por external_id.
DROP INDEX IF EXISTS idx_official_calls_external_id;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'official_calls_municipality_id_fkey'
  ) AND NOT EXISTS (
    SELECT 1 FROM official_calls oc
    WHERE NOT EXISTS (SELECT 1 FROM municipalities m WHERE m.id = oc.municipality_id)
  ) THEN
    ALTER TABLE official_calls
      ADD CONSTRAINT official_calls_municipality_id_fkey
      FOREIGN KEY (municipality_id) REFERENCES municipalities(id);
  END IF;
END $$;
