const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(ROOT_DIR, ...parts), 'utf8');

test('pedido ao 1746: foto, revisão e confirmação, com envio pelo WhatsApp oficial', () => {
  const kit = read('features', 'city', 'QuickComplaintKit.tsx');
  assert.ok(kit.includes('export function QuickComplaintKit'));
  assert.ok(kit.includes('COMPLAINT_TOPICS'), 'assuntos do seletor');
  assert.ok(kit.includes('defaultLocation'), 'local sugerido pelo bairro');
  assert.ok(kit.includes('launchCameraAsync') && kit.includes('launchImageLibraryAsync'), 'câmera e galeria');
  assert.ok(kit.includes('Continuar sem foto'), 'a foto é opcional');
  assert.ok(kit.includes('analyzeComplaintPhoto'), 'sugestão de texto pela API');
  assert.ok(kit.includes('state.user?.municipality'), 'sugestão só com conta e município');
  assert.ok(kit.includes('Confira'), 'o texto sugerido é marcado para revisão');
  assert.ok(kit.includes('não registra nem acompanha'), 'o app não registra o pedido');

  const share = read('services', 'shareComplaint.ts');
  assert.ok(share.includes('OFFICIAL_WHATSAPP_URL'), 'link oficial como alternativa');
  assert.ok(share.includes('OFFICIAL_WHATSAPP_NUMBER'), 'conversa oficial do 1746');
  assert.ok(share.includes("import('react-native-share')"), 'carrega o módulo nativo sob demanda');
  assert.ok(share.includes('Share.share('), 'compartilhamento do sistema como último recurso');

  const channel = read('features', 'city', 'OfficialChannel.tsx');
  assert.ok(channel.includes("OFFICIAL_WHATSAPP_NUMBER = '552134601746'"), 'número em uma constante');
});

test('a chave do Gemini nunca vai para o app', () => {
  for (const file of ['.env.example', 'app.config.js', 'app.json'])
    assert.doesNotMatch(read(file), /GEMINI/i, file);
  assert.doesNotMatch(read('services', 'complaintDraft.ts'), /generativelanguage|GEMINI/i);
});

test('participate screen: integrates QuickComplaintKit with territory location', () => {
  const content = read('app', 'OfficialServicesScreen.tsx');
  assert.ok(content.includes('usePlacesStore'), 'Must use the active places selection for neighborhood context');
  assert.ok(content.includes('<QuickComplaintKit'), 'Must render QuickComplaintKit in the scroll tree');
});
