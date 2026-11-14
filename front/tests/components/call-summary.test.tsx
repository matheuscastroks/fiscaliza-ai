import React from 'react';
import { Pressable, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
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
    await render(
      <CallSummary call={call} headerAccessory={<Text>SALVAR</Text>} metaTrailing={<Text>NO MAPA</Text>} />,
    );
    expect(screen.getByText('SALVAR')).toBeTruthy();
    expect(screen.getByText('NO MAPA')).toBeTruthy();
  });
});

// O conteúdo extenso conserva o texto acessível e as ações nos dois slots.
it('preserva textos extensos e ações sem substituir a situação publicada', async () => {
  const onSave = jest.fn();
  const onMap = jest.fn();
  const title = 'Manutenção de iluminação pública em passarela e acesso de pedestres';
  const agency = 'Secretaria Municipal de Conservação e Serviços Públicos';
  const status = 'Encerrado sem possibilidade de atendimento pelo órgão responsável';
  await render(<CallSummary call={{ ...call as object, serviceSubtype: title, organizationName: agency, officialStatus: status } as never}
    headerInset={36}
    headerAccessory={<Pressable accessibilityRole="button" accessibilityLabel="Salvar chamado" onPress={onSave}><Text>Salvar</Text></Pressable>}
    metaTrailing={<Pressable accessibilityRole="button" accessibilityLabel="Ver no mapa" onPress={onMap}><Text>No mapa</Text></Pressable>}
  />);
  expect(screen.getByLabelText(title)).toBeTruthy();
  expect(screen.getByLabelText(agency)).toBeTruthy();
  expect(screen.getByText(status)).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Salvar chamado' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Ver no mapa' }));
  expect(onSave).toHaveBeenCalledTimes(1);
  expect(onMap).toHaveBeenCalledTimes(1);
});
