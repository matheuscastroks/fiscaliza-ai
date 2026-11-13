import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { TerritoryFilterModal, type TerritoryFilterModalProps } from '@/components/territory/TerritoryFilterModal';

jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('react-native-gesture-handler', () => ({ ScrollView: jest.requireActual<typeof import('react-native')>('react-native').ScrollView }));
jest.mock('@/components/ui/AppBottomSheetModal', () => ({
  AppBottomSheetModal: ({ children }: { children: React.ReactNode }) => children,
  BottomSheetScrollView: jest.requireActual<typeof import('react-native')>('react-native').ScrollView,
}));
jest.mock('@/stores/territoryStore', () => ({ useTerritoryDomain: () => ({
  territoryDomain: 'calls', setTerritoryDomain: jest.fn(), savedFacilityLayers: [], setFacilityLayers: jest.fn(),
}) }));
// O seletor é uma fronteira independente; aqui verificamos as opções e os efeitos do filtro.
jest.mock('@/components/ui/AppSelect', () => ({ AppSelect: ({ label, options, onChange }: {
  label: string; options: { value: string; label: string }[]; onChange: (value: string) => void;
}) => {
  const { Pressable, Text, View } = jest.requireActual<typeof import('react-native')>('react-native');
  return <View>{options.map(option => <Pressable key={option.value} accessibilityRole="button"
    accessibilityLabel={`${label}: ${option.label}`} onPress={() => onChange(option.value)}>
    <Text>{option.label}</Text></Pressable>)}</View>;
} }));

const props = (): TerritoryFilterModalProps => ({
  visible: true, onClose: jest.fn(), onReset: jest.fn(), macroTheme: 'all', onMacroThemeChange: jest.fn(),
  serviceType: 'Tapa-buraco', serviceTypeOptions: [{ value: 'all', label: 'Todos os serviços' },
    { value: 'Tapa-buraco', label: 'Tapa-buraco' }, { value: 'Iluminação Pública', label: 'Iluminação Pública' }],
  onServiceTypeChange: jest.fn(), status: 'all', onStatusChange: jest.fn(), period: 'all',
  periodOptions: [{ value: 'all', label: 'Todo o período' }, { value: '7d', label: 'Últimos 7 dias' }],
  onPeriodChange: jest.fn(), totalCalls: 100,
});

it('selecionar um tema limpa somente o subtipo incompatível', async () => {
  const p = props();
  await render(<TerritoryFilterModal {...p} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Tema cívico: Iluminação' }));
  expect(p.onMacroThemeChange).toHaveBeenCalledWith('lighting');
  expect(p.onServiceTypeChange).toHaveBeenCalledWith('all');
});

it('um tema preserva subtipo compatível e oferece só seus serviços', async () => {
  const p = { ...props(), macroTheme: 'lighting', serviceType: 'Iluminação Pública' };
  await render(<TerritoryFilterModal {...p} />);
  expect(screen.queryByRole('button', { name: 'Tipo de serviço 1746: Tapa-buraco' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Tipo de serviço 1746: Iluminação Pública' })).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Tema cívico: Iluminação' }));
  expect(p.onServiceTypeChange).not.toHaveBeenCalled();
});

it('as pills de período indicam a seleção e aplicam a opção tocada', async () => {
  const p = props();
  await render(<TerritoryFilterModal {...p} />);
  expect(screen.getByRole('button', { name: 'Todo o período' }).props.accessibilityState.selected).toBe(true);
  await fireEvent.press(screen.getByRole('button', { name: 'Últimos 7 dias' }));
  expect(p.onPeriodChange).toHaveBeenCalledWith('7d');
});
