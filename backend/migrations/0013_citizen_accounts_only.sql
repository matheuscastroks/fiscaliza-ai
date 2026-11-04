-- Preserve accounts and their data; retire former privileged sessions and roles.
DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE role <> 'citizen');
UPDATE users SET role = 'citizen', sector = NULL WHERE role <> 'citizen';
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role = 'citizen');
