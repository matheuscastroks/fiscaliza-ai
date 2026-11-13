import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ScreenState } from '@/components/ui/ScreenState';

it('troca erro por carregamento e conteúdo, preservando a ação de repetir', async () => {
  const retry = jest.fn();
  const view = await render(<ScreenState error={new Error('Sem conexão')} loading retry={retry}><Text>Conteúdo</Text></ScreenState>);
  expect(screen.getByText('Sem conexão')).toBeTruthy();
  expect(screen.queryByText('Conteúdo')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: /Tentar novamente|Tentar de novo/i }));
  expect(retry).toHaveBeenCalledTimes(1);
  await view.rerender(<ScreenState loading><Text>Conteúdo</Text></ScreenState>);
  expect(screen.getByLabelText('Carregando')).toBeTruthy();
  await view.rerender(<ScreenState><Text>Conteúdo</Text></ScreenState>);
  expect(screen.getByText('Conteúdo')).toBeTruthy();
  expect(screen.queryByLabelText('Carregando')).toBeNull();
});

it('estado vazio apresenta sua ação e deixa de aparecer quando chega conteúdo', async () => {
  const action = jest.fn();
  const view = await render(<ScreenState empty={{ description: 'Nada aqui', action: { title: 'Limpar', onPress: action } }} />);
  expect(screen.getByText('Nada aqui')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Limpar' }));
  expect(action).toHaveBeenCalledTimes(1);
  await view.rerender(<ScreenState><Text>Resultados</Text></ScreenState>);
  expect(screen.queryByText('Nada aqui')).toBeNull();
  expect(screen.getByText('Resultados')).toBeTruthy();
});

it('cabeçalho mostra ação apenas quando configurada', async () => {
  const { SectionHeader } = require('@/components/ui/SectionHeader');
  const action = jest.fn();
  const view = await render(<SectionHeader title="Salvos" />);
  expect(screen.getByRole('header', { name: 'Salvos' })).toBeTruthy();
  expect(screen.queryByRole('button')).toBeNull();
  await view.rerender(<SectionHeader title="Salvos" action={{ title: 'Ver todos', onPress: action }} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Ver todos' }));
  expect(action).toHaveBeenCalledTimes(1);
});
