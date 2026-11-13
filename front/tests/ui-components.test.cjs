const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createRuntime, nodes, find, text } = require('./helpers/render.cjs');

const mocks = {
  './AppText': { AppText: 'AppText' },
  './AppErrorMessage': { AppErrorMessage: 'AppErrorMessage' },
  '@/features/onboarding/IllustratedEmptyState': { IllustratedEmptyState: 'IllustratedEmptyState' },
};

function ui() {
  const runtime = createRuntime(mocks);
  return { runtime, load: (name) => runtime.load(`components/ui/${name}.tsx`) };
}

test('Chip exposes selected state and calls onPress unless disabled', () => {
  const { load } = ui();
  const { Chip } = load('Chip');
  let pressed = 0;
  const selected = Chip({ label: 'Abertos', selected: true, onPress: () => pressed++ });
  const button = find(selected, (n) => n.type === 'Pressable');
  assert.equal(button.props.accessibilityRole, 'button');
  assert.equal(button.props.accessibilityLabel, 'Abertos');
  assert.equal(button.props.accessibilityState.selected, true);
  button.props.onPress();
  assert.equal(pressed, 1);
  const off = find(Chip({ label: 'Abertos', onPress: () => pressed++, disabled: true }), (n) => n.type === 'Pressable');
  assert.equal(off.props.disabled, true);
  assert.equal(off.props.accessibilityState.disabled, true);
});

test('IconButton always has an accessible name and a 48 touch target', () => {
  const { load } = ui();
  const { IconButton } = load('IconButton');
  let pressed = false;
  const tree = IconButton({ icon: 'menu', accessibilityLabel: 'Abrir menu', onPress: () => { pressed = true; } });
  const button = find(tree, (n) => n.type === 'Pressable');
  assert.equal(button.props.accessibilityLabel, 'Abrir menu');
  button.props.onPress();
  assert.ok(pressed);
  const style = button.props.style({ pressed: false }).flat(Infinity).filter(Boolean);
  assert.ok(style.some((s) => s.width === 48 && s.height === 48), 'IconButton must be 48x48');
  assert.equal(find(tree, (n) => n.type === 'Ionicons').props.name, 'menu');
});

test('ListRow is a button only when it has an action, and shows title, subtitle and chevron', () => {
  const { load } = ui();
  const { ListRow } = load('ListRow');
  let pressed = 0;
  const tree = ListRow({ title: 'Preferências', subtitle: 'Aparência e alertas', icon: 'options-outline', onPress: () => pressed++ });
  const row = find(tree, (n) => n.type === 'Pressable');
  assert.equal(row.props.accessibilityRole, 'button');
  assert.equal(row.props.accessibilityLabel, 'Preferências. Aparência e alertas');
  row.props.onPress();
  assert.equal(pressed, 1);
  assert.ok(find(tree, (n) => n.type === 'Ionicons' && n.props.name === 'chevron-forward'));
  assert.match(text(tree), /Preferências/);
  const passive = ListRow({ title: 'Somente leitura' });
  assert.equal(find(passive, (n) => n.type === 'Pressable'), undefined);
  assert.equal(find(passive, (n) => n.type === 'Ionicons' && n.props.name === 'chevron-forward'), undefined);
});

test('InsetGroup separates rows with a divider and skips empty children', () => {
  const { load } = ui();
  const { InsetGroup, ListRow } = load('ListRow');
  const tree = InsetGroup({ children: [ListRow({ title: 'A' }), null, ListRow({ title: 'B' })] });
  const views = nodes(tree).filter((n) => n.type === 'View');
  assert.ok(views.length >= 1);
  assert.match(text(tree), /A/);
  assert.match(text(tree), /B/);
});

test('ScreenState renders error with retry, then loading, then empty with action, then content', () => {
  const { load } = ui();
  const { ScreenState } = load('ScreenState');
  let retried = 0;
  const failed = ScreenState({ error: new Error('Sem conexão'), retry: () => retried++, loading: true, children: 'conteúdo' });
  const message = find(failed, (n) => n.type === 'AppErrorMessage');
  assert.equal(message.props.message, 'Sem conexão');
  message.props.onRetry();
  assert.equal(retried, 1);

  const loading = ScreenState({ loading: true, children: 'conteúdo' });
  assert.equal(find(loading, (n) => n.type === 'ActivityIndicator').props.accessibilityLabel, 'Carregando');

  let acted = false;
  const empty = ScreenState({ empty: { description: 'Nada aqui', action: { title: 'Limpar', onPress: () => { acted = true; } } } });
  const state = find(empty, (n) => n.type === 'IllustratedEmptyState');
  assert.equal(state.props.description, 'Nada aqui');
  state.props.action.onPress();
  assert.ok(acted);

  assert.equal(ScreenState({ children: 'conteúdo' }).props.children, 'conteúdo');
});

test('SectionHeader is a heading and only shows an action when one is given', () => {
  const { load } = ui();
  const { SectionHeader } = load('SectionHeader');
  const plain = SectionHeader({ title: 'Domicílio' });
  assert.equal(find(plain, (n) => n.type === 'AppText').props.accessibilityRole, 'header');
  assert.equal(find(plain, (n) => n.type === 'Pressable'), undefined);
  let pressed = false;
  const withAction = SectionHeader({ title: 'Salvos', action: { title: 'Ver todos', onPress: () => { pressed = true; } } });
  find(withAction, (n) => n.type === 'Pressable').props.onPress();
  assert.ok(pressed);
});

test('CallSummary shows category, status text, overdue deadline and protocol; trailing slot only with a divider', () => {
  const runtime = createRuntime({ '@/components/ui/AppText': { AppText: 'AppText' } });
  const { CallSummary, describeCall } = runtime.load('components/official/CallSummary.tsx');
  const call = {
    id: '1', externalId: '24002698', source: 'rio1746', municipalityId: '3304557',
    serviceType: 'Iluminação Pública', serviceSubtype: 'Reparo de luminária',
    officialStatus: 'Em Andamento', officialSituation: 'Aberto',
    streetName: 'Rua A', neighborhoodName: 'Santa Cruz', organizationName: 'RIOLUZ',
    openedAt: '2026-10-01T10:00:00.000Z', targetDate: '2026-10-10', timeRemaining: null,
  };
  const d = describeCall(call, runtime.colors);
  assert.equal(d.title, 'Reparo de luminária');
  assert.equal(d.locationText, 'Rua A · Santa Cruz');
  assert.equal(d.status.label, 'Em Andamento');
  assert.equal(d.isOverdue, true, 'open call past its date-only deadline is overdue');
  assert.equal(d.slaText, 'Prazo vencido');

  const plain = CallSummary({ call });
  assert.match(text(plain), /Reparo de luminária/);
  assert.match(text(plain), /#24002698/);
  assert.match(text(plain), /Prazo vencido/);
  assert.match(text(plain), /Em Andamento/);

  const withTrailing = CallSummary({ call, metaTrailing: 'AÇÃO' });
  assert.ok(nodes(withTrailing).some((n) => n.props?.children === 'AÇÃO'));
});
