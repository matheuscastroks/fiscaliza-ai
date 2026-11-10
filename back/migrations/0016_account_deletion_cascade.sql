-- Exclusão de conta (LGPD): os registros do titular saem junto com a conta.
-- Antes, attachments.owner_id e records.author_id não tinham ON DELETE e a
-- exclusão falhava com erro 500 para quem já tinha enviado foto.
DO $$
DECLARE
  item record;
BEGIN
  FOR item IN
    SELECT c.conname, c.conrelid::regclass AS tabela
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
    WHERE c.contype = 'f'
      AND c.confrelid = 'users'::regclass
      AND c.confdeltype <> 'c'
      AND (
        (c.conrelid = 'attachments'::regclass AND a.attname = 'owner_id')
        OR (c.conrelid = 'records'::regclass AND a.attname = 'author_id')
      )
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', item.tabela, item.conname);
  END LOOP;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'attachments_owner_id_cascade_fkey'
  ) THEN
    ALTER TABLE attachments
      ADD CONSTRAINT attachments_owner_id_cascade_fkey
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'records_author_id_cascade_fkey'
  ) THEN
    ALTER TABLE records
      ADD CONSTRAINT records_author_id_cascade_fkey
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;
