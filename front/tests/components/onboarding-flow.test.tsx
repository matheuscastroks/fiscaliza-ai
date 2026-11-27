jest.mock('react-native-keyboard-controller', () => require('react-native-keyboard-controller/jest'));
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { OnboardingFlow } from '@/features/onboarding/OnboardingFlow';
import { OnboardingGate } from '@/features/onboarding/OnboardingGate';
import { useOnboardingStore } from '@/stores/onboardingStore';

jest.mock('@/components/ui/AppBrandGlyph', () => ({ AppBrandGlyph: () => null }));
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' } }));

it('avança, volta e conclui a apresentação apenas por ação explícita', async () => {
  const finish = jest.fn();
  await render(<OnboardingFlow onFinish={finish} />);
  expect(screen.getByText('Etapa 1 de 3')).toBeTruthy();
  expect(screen.getByRole('header', { name: 'Conheça melhor seu bairro' })).toBeTruthy();
  expect(screen.getByText(/Chamados do 1746 e serviços públicos/)).toBeTruthy();
  expect(finish).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
  expect(screen.getByText('Etapa 2 de 3')).toBeTruthy();
  expect(screen.getByRole('header', { name: 'O que é o 1746?' })).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Etapa anterior' }));
  expect(screen.getByText('Etapa 1 de 3')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Pular apresentação' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Começar a explorar' })).toBeNull();
  expect(finish).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Começar a explorar' }));
  expect(finish).toHaveBeenCalledTimes(1);
});

it('replay oferece voltar ao app ao final', async () => {
  const finish = jest.fn();
  await render(<OnboardingFlow replay onFinish={finish} />);
  expect(screen.queryByRole('button', { name: 'Fechar apresentação' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
  expect(screen.getByRole('header', { name: 'Salve e acompanhe chamados' })).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Voltar ao app' }));
  expect(finish).toHaveBeenCalledTimes(1);
});

it('o botão Voltar do sistema mantém a apresentação inicial aberta', async () => {
  const previous = useOnboardingStore.getState();
  const complete = jest.fn(async () => true);
  useOnboardingStore.setState({ hydrated: true, completed: false, complete });
  try {
    const { container } = await render(<OnboardingGate />);
    const [modal] = container.queryAll((node) => typeof node.props.onRequestClose === 'function');
    expect(modal).toBeDefined();
    await fireEvent(modal, 'requestClose');
    expect(complete).not.toHaveBeenCalled();
    expect(screen.getByText('Etapa 1 de 3')).toBeTruthy();
  } finally {
    await act(() => { useOnboardingStore.setState(previous); });
  }
});
