const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function render(call) {
  const module = { exports: {} };
  const jsx = (type, props) => ({ type, props });
  const code = ts.transpileModule(fs.readFileSync('components/official/OfficialCallTimeline.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports,
    require(name) {
      if (name === 'react') return { memo: (component) => component };
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'react-native') return { View: 'View', StyleSheet: { create: (s) => s } };
      if (name === '@expo/vector-icons') return { Ionicons: 'Icon' };
      if (name === '@/components/ui/AppText') return { AppText: 'Text' };
      if (name === '@/theme/useTheme') return { useTheme: () => ({ colors: {} }), useThemedStyles: () => ({}) };
      if (name === '@/theme') return { spacing: {} };
      if (name === '@/features/city/formatDates' || name === '@/theme/typography' || name === '@/theme/layout') return require(name);
      if (name === '@/shared/official-call-state') {
        const stateModule = { exports: {} };
        const stateCode = ts.transpileModule(fs.readFileSync('../shared/official-call-state.ts', 'utf8'), {
          compilerOptions: { module: ts.ModuleKind.CommonJS },
        }).outputText;
        vm.runInNewContext(stateCode, { module: stateModule, exports: stateModule.exports });
        return stateModule.exports;
      }
      throw new Error(name);
    },
  });
  return module.exports.OfficialCallTimeline({ call });
}

function texts(node) {
  if (Array.isArray(node)) return node.flatMap(texts);
  if (!node || typeof node !== 'object') return typeof node === 'string' ? [node] : [];
  return texts(node.props?.children);
}

test('an open call does not fabricate inspections or treat deadlines as completed events', () => {
  const tree = render({ openedAt: '2026-09-15T12:00:00Z', officialSituation: 'Não Encerrado', targetDate: '2026-10-01', diagnosisTargetDate: '2026-09-20' });
  const content = texts(tree).join(' ');
  assert.doesNotMatch(content, /Encaminhamento e análise técnica|Execução do serviço|Em análise pela secretaria/);
  assert.match(content, /Ainda sem encerramento/);
  assert.doesNotMatch(content, /01\/10\/2026|20\/09\/2026/);
});

test('administrative closure never certifies that field work was executed', () => {
  const content = texts(render({ openedAt: '2026-09-15', closedAt: '2026-09-17', officialSituation: 'Encerrado' })).join(' ');
  assert.match(content, /Encerrado no 1746/);
  assert.doesNotMatch(content, /Execução do serviço|Processamento administrativo concluído pelo órgão/);
});

test('closed calls without a published closure date do not invent one', () => {
  const content = texts(render({ openedAt: '2026-09-15', officialSituation: 'Encerrado', statusJustification: 'Duplicidade de protocolo' })).join(' ');
  assert.match(content, /Data de encerramento não informada/);
  assert.match(content, /Duplicidade de protocolo/);
});

test('calendar dates retain their published day in the Brazil time zone', () => {
  const content = texts(render({ openedAt: '2026-09-15', closedAt: '2026-09-17' })).join(' ');
  assert.match(content, /15\/09\/2026/);
  assert.match(content, /17\/09\/2026/);
});

test('published diagnosis appears as an event without certifying the service', () => {
  const content = texts(render({ openedAt: '2026-09-15', deadlineType: 'D', diagnosedAt: '2026-09-18', officialSituation: 'Não Encerrado' })).join(' ');
  assert.match(content, /Diagnóstico registrado/);
  assert.match(content, /18\/09\/2026/);
  assert.match(content, /não confirma que o serviço foi feito/);
});

test('open diagnosis-type call without diagnosis shows it as pending, without the forecast date', () => {
  const content = texts(render({ openedAt: '2026-09-15', deadlineType: 'D', diagnosisTargetDate: '2026-09-20', officialSituation: 'Não Encerrado' })).join(' ');
  assert.match(content, /Diagnóstico ainda não registrado/);
  assert.doesNotMatch(content, /20\/09\/2026/);
});

test('calls without a diagnosis requirement get no diagnosis step', () => {
  const open = texts(render({ openedAt: '2026-09-15', deadlineType: 'F', officialSituation: 'Não Encerrado' })).join(' ');
  const closed = texts(render({ openedAt: '2026-09-15', deadlineType: 'D', closedAt: '2026-09-17', officialSituation: 'Encerrado' })).join(' ');
  assert.doesNotMatch(open, /Diagnóstico/);
  assert.doesNotMatch(closed, /Diagnóstico/);
});
