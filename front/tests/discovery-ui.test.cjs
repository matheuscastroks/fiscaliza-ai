const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function component(file, mocks = {}) {
  let cursor = 0;
  const state = [];
  const jsx = (type, props) => ({ type, props });
  const theme = { colors: {}, isDark: false };
  const spacing = {};
  const layout = { radius: {} };
  const hooks = {
    memo: (fn) => fn,
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [
        state[index],
        (next) => {
          state[index] = next;
        },
      ];
    },
  };
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require(name) {
      if (mocks[name]) return mocks[name];
      if (name === '@/features/city/officialCallStatus') {
        const statusModule = { exports: {} };
        vm.runInNewContext(ts.transpileModule(fs.readFileSync('features/city/officialCallStatus.ts', 'utf8'), {
          compilerOptions: { module: ts.ModuleKind.CommonJS },
        }).outputText, { exports: statusModule.exports, module: statusModule, require: (dep) => require(dep === './formatDates' ? '@/features/city/formatDates' : dep) });
        return statusModule.exports;
      }
      if (name === 'react') return hooks;
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'react-native')
        return {
          View: 'View',
          ScrollView: 'ScrollView',
          Pressable: 'Pressable',
          StyleSheet: { create: (x) => x, absoluteFill: {}, hairlineWidth: 1 },
        };
      if (name === 'react-native-safe-area-context')
        return { SafeAreaView: 'SafeAreaView' };
      if (name === 'zustand') return { create: () => () => ({}) };
      if (name === '@expo/vector-icons') return { Ionicons: 'Ionicons' };
      if (name === 'expo-image') return { Image: 'Image' };
      if (name === 'expo-linear-gradient')
        return { LinearGradient: 'LinearGradient' };
      if (name === '@/theme/useTheme' || name === '@/theme')
        return {
          useTheme: () => theme,
          useThemedStyles: (factory) => factory(theme.colors),
          spacing,
          layout,
        };
      if (name === '@/shared/official-call-state')
        return { isOfficialCallClosed: () => false };
      if (name === '@/features/city/officialCategoryThemes')
        return {
          resolveServiceCategoryTheme: () => ({
            label: 'Iluminação',
            icon: 'bulb-outline',
            imageUrl: 'fixture.jpg',
          }),
        };
      if (name.endsWith('/AppText')) return { AppText: 'AppText' };
      if (name.endsWith('/AppButton')) return { AppButton: 'AppButton' };
      if (name.endsWith('/AppBrandGlyph'))
        return {
          AppBrandGlyph: 'AppBrandGlyph',
          AppBrandLockup: 'AppBrandLockup',
        };
      if (name.endsWith('/ThemeToggleButton'))
        return { ThemeToggleButton: 'ThemeToggleButton' };
      if (name.endsWith('/UserAvatar')) return { UserAvatar: 'UserAvatar' };
      if (name.endsWith('/SignOutSheet')) return {};
      if (name === '@/features/city/formatDates') return require(name);
      throw Error(name);
    },
  });
  return {
    exports: module.exports,
    render(name, props) {
      cursor = 0;
      return module.exports[name](props);
    },
  };
}

function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  const children = tree.props?.children;
  return [
    tree,
    ...(Array.isArray(children) ? children.flat(Infinity) : [children]).flatMap(
      nodes,
    ),
  ];
}
const fixture = {
  id: 'call-1',
  externalId: '123456',
  serviceType: 'Iluminação',
  serviceSubtype: 'Lâmpada apagada',
  openedAt: '2026-11-02',
  officialSituation: 'Em andamento',
};

test('map preview separates saving, closing and opening, and clears stale errors on another call', async () => {
  let opened = 0;
  let closed = 0;
  const store = { savedCalls: [], hydrated: true, busy: false, toggleSavedCall: async () => false };
  const ui = component('components/territory/TerritoryPreviewCard.tsx', {
    './FacilityRow': { FacilityRow: 'FacilityRow', facilityTitle: () => 'Facility' },
    '@/features/territory/selectors': { facilityColors: {} },
    '@/features/city/CityUI': { kindLabel: {}, statusLabel: {} },
    '@/stores/followStore': { useFollowStore: (select) => select(store) },
  });
  const props = { entry: { type: 'official', item: fixture }, onOpen: () => opened++, onClose: () => closed++ };
  let tree = nodes(ui.render('TerritoryCardContent', props));
  tree.find((n) => n.props?.accessibilityRole === 'checkbox').props.onPress();
  await new Promise(setImmediate);
  tree = nodes(ui.render('TerritoryCardContent', props));
  assert.ok(tree.some((n) => n.props?.accessibilityRole === 'alert'));
  assert.equal(opened, 0);
  tree.find((n) => n.props?.onPress === props.onClose).props.onPress();
  assert.equal(closed, 1);
  assert.equal(opened, 0);
  tree.find((n) => n.props?.accessibilityLabel?.startsWith('Ver detalhes de')).props.onPress();
  assert.equal(opened, 1);
  tree = nodes(ui.render('TerritoryCardContent', { ...props, entry: { type: 'official', item: { ...fixture, id: 'call-2' } }, hideClose: true }));
  assert.ok(!tree.some((n) => n.props?.accessibilityRole === 'alert'));
  assert.ok(!tree.some((n) => n.props?.onPress === props.onClose));
  const facility = { id: 'facility-1' };
  tree = nodes(ui.render('TerritoryCardContent', { ...props, entry: { type: 'facility', item: facility } }));
  assert.equal(tree.find((n) => n.type === 'FacilityRow').props.item, facility);
  assert.ok(!tree.some((n) => n.props?.accessibilityRole === 'checkbox'));
});

test('heart failure keeps the saved state and does not open the call details', async () => {
  for (const saved of [false, true]) {
    let navigated = 0;
    const store = {
      savedCalls: saved ? [fixture] : [],
      hydrated: true,
      busy: false,
      toggleSavedCall: async () => false,
    };
    const ui = component('components/official/OfficialCallRow.tsx', {
      '@/stores/followStore': { useFollowStore: (select) => select(store) },
    });
    const props = {
      call: fixture,
      onPress: () => {
        navigated++;
      },
    };
    const heart = nodes(ui.render('OfficialCallRow', props)).find(
      (n) => n.props?.accessibilityRole === 'checkbox',
    );
    heart.props.onPress();
    await new Promise(setImmediate);
    const after = nodes(ui.render('OfficialCallRow', props));
    assert.equal(
      after.find((n) => n.props?.accessibilityRole === 'checkbox').props
        .accessibilityState.checked,
      saved,
    );
    assert.ok(after.some((n) => n.props?.accessibilityRole === 'alert'));
    assert.equal(navigated, 0);
  }
});

test('heart reflects confirmed persistence, and unavailable storage disables it', async () => {
  const store = {
    savedCalls: [],
    hydrated: true,
    busy: false,
    toggleSavedCall: async () => {
      store.savedCalls = [fixture];
      return true;
    },
  };
  const ui = component('components/official/OfficialCallRow.tsx', {
    '@/stores/followStore': { useFollowStore: (select) => select(store) },
  });
  const props = { call: fixture, onPress() {} };
  nodes(ui.render('OfficialCallRow', props))
    .find((n) => n.props?.accessibilityRole === 'checkbox')
    .props.onPress();
  await new Promise(setImmediate);
  assert.equal(
    nodes(ui.render('OfficialCallRow', props)).find(
      (n) => n.props?.accessibilityRole === 'checkbox',
    ).props.accessibilityState.checked,
    true,
  );
  store.hydrated = false;
  assert.equal(
    nodes(ui.render('OfficialCallRow', props)).find(
      (n) => n.props?.accessibilityRole === 'checkbox',
    ).props.disabled,
    true,
  );
});

test('sidebar preserves destinations, closes before navigating, and disables its hidden theme control', () => {
  const visits = [];
  const ui = component('components/ui/SideMenu.tsx', {
    'expo-router': {
      usePathname: () => '/',
      router: { push: (path) => visits.push(path) },
    },
    '@/stores/authStore': {
      useAuthStore: (select) => select({ user: null, isAuthenticated: false }),
    },
    '@/stores/themeStore': {
      useThemeStore: (select) => select({ persistenceError: null }),
    },
    '@/stores/territoryStore': {
      useTerritoryStore: (select) => select({ preferredNeighborhood: '' }),
    },
    '@/stores/followStore': {
      useFollowStore: (select) => select({ savedCalls: [] }),
    },
  });
  assert.equal(ui.exports.citizenDestinations.length, 10);
  assert.equal(
    new Set(ui.exports.citizenDestinations.map((x) => x.path)).size,
    10,
  );
  let afterClose;
  const tree = ui.render('SideMenu', {
    visible: true,
    onClose: (action) => {
      afterClose = action;
    },
  });
  const explore = nodes(tree).find(
    (n) =>
      n.type === 'Pressable' &&
      nodes(n).some((child) => child.props?.children === 'Explorar'),
  );
  explore.props.onPress();
  assert.equal(visits.length, 0);
  afterClose();
  assert.equal(visits[0], '/(tabs)/TerritoryScreen');
  const hidden = ui.render('SideMenu', { visible: false, onClose() {} });
  assert.equal(
    nodes(hidden).some((n) => n.type === 'ThemeToggleButton'),
    false,
  );
});
