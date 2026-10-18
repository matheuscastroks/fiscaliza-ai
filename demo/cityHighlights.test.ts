import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cityHighlights,
  isHomeOccurrence,
  consultationIsOpen,
} from '../shared/city-highlights.ts';
import type {
  Consultation,
  Occurrence,
  PublicAction,
} from '../shared/contracts.ts';
const now = new Date('2026-10-18T12:00:00Z').getTime();
const occurrence = (patch: Partial<Occurrence> = {}): Occurrence => ({
  id: 'mine',
  municipalityId: '3304557',
  title: 'Poste apagado',
  description: 'Perto da escola',
  category: 'lighting',
  status: 'resolved',
  priority: 'medium',
  location: {
    latitude: -22.9,
    longitude: -43.2,
    address: 'Rua A',
    neighborhood: 'Centro',
  },
  images: [],
  reportedBy: 'ana',
  reportedAt: '2026-10-10T12:00:00Z',
  resolvedAt: '2026-10-17T12:00:00Z',
  votes: 1,
  comments: [],
  statusHistory: [
    {
      status: 'resolved',
      at: '2026-10-17T12:00:00Z',
      actor: 'Iluminação',
      justification: 'Luminária substituída.',
    },
  ],
  ...patch,
});
const base = {
  municipalityId: '3304557',
  title: 'Travessia escolar',
  summary: 'Acessibilidade',
  body: 'Travessia perto da escola',
  neighborhood: 'Centro',
  createdBy: 'staff',
  createdAt: '2026-10-15T12:00:00Z',
  responsible: 'Mobilidade',
  comments: [],
  supports: 0,
  linkedIds: [],
};
const consultation = (patch: Partial<Consultation> = {}): Consultation => ({
  ...base,
  id: 'consultation',
  kind: 'consultation',
  status: 'open',
  closesAt: '2026-10-19T12:00:00Z',
  options: ['Travessia', 'Calçada'],
  answerCounts: [0, 0],
  ...patch,
});
const action = (patch: Partial<PublicAction> = {}): PublicAction => ({
  ...base,
  id: 'action',
  kind: 'action',
  status: 'completed',
  progress: 100,
  dueAt: '2026-10-17T12:00:00Z',
  evidence: [],
  updates: [
    {
      at: '2026-10-17T12:00:00Z',
      actor: 'Mobilidade',
      text: 'Travessia concluída.',
    },
  ],
  ...patch,
});

test('highlights ask only the author to evaluate and do not repeat the same occurrence', () => {
  const highlights = cityHighlights(
    [occurrence(), occurrence({ id: 'other', reportedBy: 'vizinho' })],
    [],
    'ana',
    now,
  );
  assert.equal(highlights[0].kind, 'evaluation');
  assert.equal(
    highlights.filter((h) => 'occurrence' in h && h.occurrence.id === 'mine')
      .length,
    1,
  );
  assert.equal(
    highlights.some(
      (h) => h.kind === 'evaluation' && h.occurrence.id === 'other',
    ),
    false,
  );
});
test('expired, closed, answered and distant consultations do not create false urgency', () => {
  const items = [
    consultation(),
    consultation({ id: 'expired', closesAt: '2026-10-18T12:00:00Z' }),
    consultation({ id: 'closed', status: 'closed' }),
    consultation({ id: 'answered', myAnswer: 0 }),
    consultation({ id: 'distant', closesAt: '2026-11-01T12:00:00Z' }),
  ];
  assert.deepEqual(
    cityHighlights([], items, 'ana', now).map((h) => 'item' in h && h.item.id),
    ['consultation'],
  );
  assert.equal(consultationIsOpen(items[1], now), false);
});
test('completed actions need a real recent date; old and future results are omitted', () => {
  const items = [
    action(),
    action({ id: 'old', createdAt: '2026-01-01T00:00:00Z', updates: [] }),
    action({ id: 'future', createdAt: '2026-11-01T00:00:00Z', updates: [] }),
  ];
  assert.deepEqual(
    cityHighlights([], items, 'ana', now).map((h) => 'item' in h && h.item.id),
    ['action'],
  );
});
test('institutional response uses newest recorded justification without mutating history', () => {
  const item = occurrence({
    status: 'in_progress',
    statusHistory: [
      {
        status: 'in_progress',
        at: '2026-10-16T00:00:00Z',
        justification: 'Equipe a caminho.',
      },
      {
        status: 'in_progress',
        at: '2026-10-17T00:00:00Z',
        justification: 'Serviço agendado.',
      },
    ],
  });
  const highlight = cityHighlights([item], [], 'ana', now)[0];
  assert.equal(highlight.kind, 'response');
  if (highlight.kind === 'response')
    assert.equal(highlight.text, 'Serviço agendado.');
  assert.equal(item.statusHistory[0].justification, 'Equipe a caminho.');
});

test('citizen revisions are not attributed to municipal management', () => {
  const item = occurrence({
    evaluation: {
      satisfied: false,
      reason: 'Ainda apagado.',
      at: '2026-10-18T10:00:00Z',
    },
    statusHistory: [
      {
        status: 'resolved',
        at: '2026-10-17T00:00:00Z',
        justification: 'Luminária substituída.',
        source: 'management',
      },
      {
        status: 'resolved',
        at: '2026-10-18T10:00:00Z',
        justification: 'Revisão solicitada pelo autor: Ainda apagado.',
        source: 'citizen',
      },
    ],
  });
  const highlight = cityHighlights([item], [], 'ana', now)[0];
  assert.equal(highlight.kind, 'response');
  if (highlight.kind === 'response') {
    assert.equal(highlight.institutional, true);
    assert.equal(highlight.text, 'Luminária substituída.');
  }
});
test('legacy updates without origin remain neutral instead of claiming management authorship', () => {
  const highlight = cityHighlights(
    [occurrence({ reportedBy: 'vizinho' })],
    [],
    'ana',
    now,
  )[0];
  assert.equal(highlight.kind, 'response');
  if (highlight.kind === 'response')
    assert.equal(highlight.institutional, false);
});

test('a rated resolved occurrence leaves the author home but remains visible to the territory', () => {
  for (const rating of [1, 2, 3, 4, 5]) {
    const item = occurrence({
      evaluation: {
        rating,
        satisfied: rating >= 3,
        reason: '',
        at: '2026-10-18T10:00:00Z',
      },
    });
    assert.equal(isHomeOccurrence(item, 'ana'), false);
    assert.equal(isHomeOccurrence(item, 'outro'), true);
    assert.deepEqual(cityHighlights([item], [], 'ana', now), []);
  }
  assert.equal(
    isHomeOccurrence(occurrence({ evaluation: undefined }), 'ana'),
    true,
  );
});
