const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

test('Agir abre o WhatsApp do 1746 sem mensagem pronta', () => {
  const start = fs.readFileSync(path.join(ROOT_DIR, 'app', '(tabs)', 'ParticipateScreen.tsx'), 'utf8');
  // O atendimento do 1746 no WhatsApp é um menu numerado e ignora texto livre.
  assert.ok(start.includes('openExternal(OFFICIAL_WHATSAPP_URL)'));
  assert.ok(!start.includes('QuickComplaintKit'));
  assert.ok(!fs.existsSync(path.join(ROOT_DIR, 'features', 'city', 'QuickComplaintKit.tsx')));
  const details = fs.readFileSync(path.join(ROOT_DIR, 'features', 'city', 'call-details', 'OfficialCallDetailsScreen.tsx'), 'utf8');
  assert.ok(details.includes('openExternal(OFFICIAL_WHATSAPP_URL)'), 'reabertura só abre a conversa');
  assert.ok(!/[?&]text=/.test(fs.readFileSync(path.join(ROOT_DIR, 'features', 'city', 'OfficialChannel.tsx'), 'utf8')));
});

test('Agir separates protocol lookup from requesting a service', () => {
  const readApp = (...parts) => fs.readFileSync(path.join(ROOT_DIR, 'app', ...parts), 'utf8');
  const start = readApp('(tabs)', 'ParticipateScreen.tsx');
  const services = readApp('OfficialServicesScreen.tsx');
  assert.ok(start.includes("router.push('/OfficialServicesScreen')"));
  assert.ok(start.includes("lookup: 'protocol'"));
  assert.ok(start.includes('OFFICIAL_PROTOCOL_LOOKUP'));
  assert.ok(services.includes('OFFICIAL_SERVICES'));
});
