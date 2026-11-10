const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

test('app header: supports hideUserAvatar to prevent duplicate avatars', () => {
  const headerFile = path.join(ROOT_DIR, 'components', 'ui', 'AppHeader.tsx');
  const content = fs.readFileSync(headerFile, 'utf8');

  assert.ok(
    content.includes('hideUserAvatar?: boolean'),
    'AppHeaderProps must accept hideUserAvatar prop',
  );
  assert.ok(
    content.includes('user && !hideUserAvatar'),
    'AppHeader must respect hideUserAvatar when rendering left circle button',
  );
});

test('profile screen: configures clean header without duplicate avatar and reaches settings from the menu', () => {
  const profileFile = path.join(ROOT_DIR, 'app', '(tabs)', 'ProfileScreen.tsx');
  const content = fs.readFileSync(profileFile, 'utf8');

  assert.ok(
    content.includes('hideUserAvatar'),
    'ProfileScreen must pass hideUserAvatar to AppHeader',
  );
  assert.ok(
    content.includes('/SettingsScreen') && !content.includes('rightElement='),
    'ProfileScreen reaches Preferências from the menu, without a duplicate header action',
  );
});
