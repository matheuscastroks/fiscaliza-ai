import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCivicUpdate } from '../src/civic.js';
import type { Proposal, PublicAction } from '../../shared/contracts.js';
const base = {
  id: 'p',
  title: 'Praça acessível',
  summary: 'Travessias acessíveis',
  body: 'Ajustar travessias.',
  neighborhood: 'Centro',
  createdBy: 'ana',
  createdAt: '2026-10-17T00:00:00Z',
  responsible: 'Obras',
  comments: [],
  supports: 0,
  linkedIds: [],
};
test('mudança de proposta exige resposta e preserva decisões anteriores', () => {
  const proposal: Proposal = { ...base, kind: 'proposal', status: 'submitted' };
  assert.throws(
    () => applyCivicUpdate(proposal, { status: 'under_review' }, 'Gestão'),
    /justificativa/,
  );
  applyCivicUpdate(
    proposal,
    { status: 'under_review', decision: 'Equipe verificará acessibilidade.' },
    'Gestão',
  );
  applyCivicUpdate(
    proposal,
    { status: 'accepted', decision: 'Melhoria incluída na ação de calçadas.' },
    'Obras',
  );
  assert.equal(proposal.history?.length, 2);
  assert.equal(proposal.history?.[0].actor, 'Gestão');
  assert.throws(
    () =>
      applyCivicUpdate(
        proposal,
        { status: 'submitted', decision: 'Voltar' },
        'Gestão',
      ),
    /Transição/,
  );
});
test('progresso de ação exige atualização pública e registra histórico', () => {
  const action: PublicAction = {
    ...base,
    kind: 'action',
    status: 'planned',
    progress: 0,
    dueAt: '2027-01-01',
    evidence: [],
    updates: [],
  };
  assert.throws(
    () => applyCivicUpdate(action, { progress: 40 }, 'Obras'),
    /justificativa/,
  );
  applyCivicUpdate(
    action,
    {
      status: 'in_progress',
      progress: 40,
      update: 'Primeiro trecho executado.',
    },
    'Obras',
  );
  assert.equal(action.updates[0].text, 'Primeiro trecho executado.');
  applyCivicUpdate(
    action,
    { status: 'completed', update: 'Trechos vistoriados.' },
    'Obras',
  );
  assert.equal(action.progress, 100);
  assert.equal(action.history?.length, 2);
});
test('responsável, prazo e evidências exigem justificativa auditável', () => {
  const action: PublicAction = {
    ...base,
    kind: 'action',
    status: 'planned',
    progress: 0,
    dueAt: '2027-01-01',
    evidence: [],
    updates: [],
  };
  for (const change of [
    { responsible: 'Iluminação' },
    { dueAt: '2027-02-01' },
    { evidence: ['/api/attachments/example'] },
  ])
    assert.throws(
      () => applyCivicUpdate(action, change, 'Gestão'),
      /justificativa/,
    );
  applyCivicUpdate(
    action,
    {
      responsible: 'Iluminação',
      justification: 'Encaminhado ao setor responsável.',
    },
    'Gestão',
  );
  assert.equal(action.history?.[0].actor, 'Gestão');
  assert.equal(action.responsible, 'Iluminação');
});
