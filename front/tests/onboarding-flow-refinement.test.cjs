const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

test('onboarding flow: photographic assets exist and meet quality threshold', () => {
  const imagesDir = path.join(ROOT_DIR, 'assets', 'images');
  const expectedImages = [
    'onboarding-territory.webp',
    'onboarding-follow.webp',
  ];

  for (const img of expectedImages) {
    const fullPath = path.join(imagesDir, img);
    assert.ok(fs.existsSync(fullPath), `Expected photographic asset ${img} to exist`);
    const stats = fs.statSync(fullPath);
    assert.ok(
      stats.size > 50000,
      `Image ${img} should be a high quality photographic asset (>50KB), got ${stats.size} bytes`,
    );
  }
});

test('onboarding flow: removes bureaucratic disclaimers and adopts user-centric value pillars', () => {
  const flowFile = path.join(ROOT_DIR, 'features', 'onboarding', 'OnboardingFlow.tsx');
  const content = fs.readFileSync(flowFile, 'utf8');

  // Must NOT contain negative or bureaucratic disclaimer text that confused users
  assert.ok(
    !content.includes('Escolher um bairro é opcional'),
    'Should not include "Escolher um bairro é opcional" disclaimer',
  );
  assert.ok(
    !content.includes('Não precisa de conta ou GPS'),
    'Should not include "Não precisa de conta ou GPS" disclaimer',
  );
  assert.ok(
    !content.includes('Encerrado no 1746 não significa resolução confirmada'),
    'Should not include cold "Encerrado no 1746 não significa" disclaimer',
  );
  assert.ok(
    !content.includes('O Fiscaliza aí é independente. Solicitações são feitas'),
    'Should not include legal disclaimer in main onboarding slide',
  );

  // Must use real photographic assets instead of vector illustrations
  assert.ok(
    content.includes('onboarding-territory.webp') &&
      content.includes('onboarding-follow.webp') &&
      !content.includes('onboarding-action.jpg'),
    'OnboardingFlow must reference the 2 photographic Rio de Janeiro assets',
  );

  // Must import expo-image and expo-linear-gradient
  assert.ok(
    content.includes("from 'expo-image'") && content.includes("from 'expo-linear-gradient'"),
    'OnboardingFlow must use expo-image and LinearGradient for photographic presentation',
  );

  // Must present inspiring, civic value propositions
  assert.ok(
    content.includes('Veja o que o 1746 publicou perto de você'),
    'Should highlight territorial map exploration',
  );
  assert.ok(
    content.includes('Situação e prazo publicados'),
    'Should highlight SLA and civic monitoring',
  );
  assert.ok(
    content.includes('Salve chamados e ache o canal oficial'),
    'Should point to the official channel instead of promising actions',
  );
  assert.ok(
    !content.includes('avisos automáticos') && !content.includes('Cobre melhorias'),
    'Must not promise automatic alerts or in-app action',
  );
  assert.ok(
    content.includes('Começar a explorar'),
    'Should keep empowering call to action',
  );
});
