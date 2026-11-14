-- Remove o legado da participação (ocorrências, propostas, consultas, apoios e
-- respostas), sem rota nem tela desde a 0013. As tabelas estavam vazias em
-- produção em 13/11/2026; o dump foi guardado antes de aplicar.
DROP TABLE IF EXISTS demo_engagement;
DROP TABLE IF EXISTS answers;
DROP TABLE IF EXISTS relations;
DROP TABLE IF EXISTS records;
DROP INDEX IF EXISTS idx_records_author;

-- Setor só existia para os perfis de gestão, removidos na 0013.
ALTER TABLE users DROP COLUMN IF EXISTS sector;

-- Os avatares de demonstração deixam de ser servidos pela API.
UPDATE users SET avatar = NULL WHERE avatar LIKE '/api/demo-media/%';
