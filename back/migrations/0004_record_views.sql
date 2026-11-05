ALTER TABLE relations DROP CONSTRAINT IF EXISTS relations_kind_check;
ALTER TABLE relations ADD CONSTRAINT relations_kind_check CHECK(kind IN ('support', 'follow', 'view'));
