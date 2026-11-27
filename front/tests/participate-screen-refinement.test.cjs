const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

test('quick complaint kit: incorporates bottom sheet topic selector, select, location-filled address and photo-first steps', () => {
  const kitPath = path.join(ROOT_DIR, 'features', 'city', 'QuickComplaintKit.tsx');
  assert.ok(fs.existsSync(kitPath), 'QuickComplaintKit.tsx must exist');

  const sheetPath = path.join(ROOT_DIR, 'features', 'city', 'ComplaintTopicSheet.tsx');
  assert.ok(fs.existsSync(sheetPath), 'ComplaintTopicSheet.tsx must exist');

  const content = fs.readFileSync(kitPath, 'utf8');
  assert.ok(content.includes('export function QuickComplaintKit'), 'Must export QuickComplaintKit');
  assert.ok(content.includes('COMPLAINT_TOPICS'), 'Must define COMPLAINT_TOPICS');
  assert.ok(content.includes('defaultLocation'), 'Must support defaultLocation prop');
  assert.ok(content.includes('photoThumb'), 'A foto acompanha a revisão do pedido');
  assert.ok(content.includes('<AppButton title="Enviar pelo WhatsApp do 1746"'), 'A ação principal usa o botão com contraste do design system');
  assert.ok(content.includes('Haptics'), 'Must provide haptic feedback on user actions');

  assert.ok(content.includes('multiline'), 'Details field must be multiline');
  assert.ok(content.includes('<AppSelect'), 'Assunto é um select, sem card em volta dos campos');
  assert.ok(content.includes('reverseGeocodeAsync'), 'Endereço preenchido pela localização do aparelho');
  assert.ok(!content.includes('insetTable'), 'Sem card envolvendo os campos');


  const appInputPath = path.join(ROOT_DIR, 'components', 'ui', 'AppInput.tsx');
  const appInputContent = fs.readFileSync(appInputPath, 'utf8');
  assert.ok(appInputContent.includes('layout.radius'), 'AppInput multiline style must use theme radius tokens');
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
