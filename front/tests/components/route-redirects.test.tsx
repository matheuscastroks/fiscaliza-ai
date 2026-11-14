import React from 'react';
import { render, screen } from '@testing-library/react-native';
import CallRedirect from '@/app/OfficialCallDetailsScreen';
import FacilityRedirect from '@/app/FacilityDetailsScreen';
import NeighborhoodRedirect from '@/app/NeighborhoodScreen';
let mockParams: Record<string, unknown> = {};
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  Redirect: ({ href }: { href: unknown }) => {
    const { Text } = require('react-native');
    return <Text>{JSON.stringify(href)}</Text>;
  },
}));

it.each([
  [CallRedirect, 'id', '/calls/[id]'],
  [FacilityRedirect, 'id', '/facilities/[id]'],
  [NeighborhoodRedirect, 'neighborhoodId', '/neighborhoods/[id]'],
] as const)('redireciona rota legada preservando identificador', async (Component, param, pathname) => {
  mockParams = { [param]: 'record-123' };
  await render(<Component />);
  expect(screen.getByText(JSON.stringify({ pathname, params: { id: 'record-123' } }))).toBeTruthy();
});

it('não escolhe arbitrariamente entre parâmetros duplicados', async () => {
  mockParams = { id: ['first', 'second'] };
  await render(<CallRedirect />);
  expect(screen.getByText(JSON.stringify('/+not-found'))).toBeTruthy();
});

it('mantém a escolha de bairro quando o link antigo não contém id', async () => {
  mockParams = {};
  await render(<NeighborhoodRedirect />);
  expect(screen.getByText(JSON.stringify('/neighborhoods'))).toBeTruthy();
});
