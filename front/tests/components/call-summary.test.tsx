import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { CallSummary } from '@/components/official/CallSummary';

const call = {
  id: '1', externalId: '24002698', source: 'rio1746', municipalityId: '3304557',
  serviceType: 'Iluminação Pública', serviceSubtype: 'Reparo de luminária',
  officialStatus: 'Em Andamento', officialSituation: 'Aberto',
  streetName: 'Rua A', neighborhoodName: 'Santa Cruz', organizationName: 'RIOLUZ',
  openedAt: '2026-10-01T10:00:00.000Z', targetDate: '2026-10-10', timeRemaining: null,
} as never;

describe('CallSummary', () => {
  it('mostra assunto, local, situação, prazo vencido e protocolo', async () => {
    await render(<CallSummary call={call} />);
    expect(screen.getByText('Reparo de luminária')).toBeTruthy();
    expect(screen.getByText('Rua A · Santa Cruz')).toBeTruthy();
    expect(screen.getByText('Em Andamento')).toBeTruthy();
    expect(screen.getByText('Prazo vencido')).toBeTruthy();
    expect(screen.getByText('#24002698')).toBeTruthy();
  });

  it('mostra os controles recebidos nos espaços do cabeçalho e do rodapé', async () => {
    const { Text } = require('react-native');
    await render(
      <CallSummary call={call} headerAccessory={<Text>SALVAR</Text>} metaTrailing={<Text>NO MAPA</Text>} />,
    );
    expect(screen.getByText('SALVAR')).toBeTruthy();
    expect(screen.getByText('NO MAPA')).toBeTruthy();
  });
});
