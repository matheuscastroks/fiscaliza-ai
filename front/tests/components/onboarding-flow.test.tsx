jest.mock('react-native-keyboard-controller', () => require('react-native-keyboard-controller/jest'));
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { OnboardingFlow } from '@/features/onboarding/OnboardingFlow';

jest.mock('@/components/ui/AppBrandGlyph', () => ({ AppBrandGlyph: () => null }));
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' } }));

it('avança, volta e conclui a apresentação apenas por ação explícita', async () => {
  const finish = jest.fn();
  await render(<OnboardingFlow onFinish={finish} />);
  expect(screen.getByText('Etapa 1 de 2')).toBeTruthy();
  expect(screen.getByRole('header', { name: 'Veja o que o 1746 publicou perto de você' })).toBeTruthy();
  expect(finish).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
  expect(screen.getByText('Etapa 2 de 2')).toBeTruthy();
  expect(screen.getByRole('header', { name: 'Salve chamados e ache o canal oficial' })).toBeTruthy();
  expect(screen.getByText('Situação e prazo')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Etapa anterior' }));
  expect(screen.getByText('Etapa 1 de 2')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Pular apresentação' }));
  expect(finish).toHaveBeenCalledTimes(1);
});

it('replay oferece fechar e voltar ao app', async () => {
  const finish = jest.fn();
  await render(<OnboardingFlow replay onFinish={finish} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Voltar ao app' }));
  expect(finish).toHaveBeenCalledTimes(1);
});
