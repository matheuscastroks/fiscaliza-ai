import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { OfficialCallDates } from '@/features/city/call-details/OfficialCallDates';
import type { OfficialCall } from '@/shared/contracts';

it('mostra datas publicadas e omite diagnóstico e encerramento ausentes', async () => {
  const item = { openedAt: '2026-10-01T10:00:00Z', targetDate: null, closedAt: null, diagnosisTargetDate: null } as OfficialCall;
  await render(<OfficialCallDates item={item} slaLabel={null} deadlineInfo={null} />);
  expect(screen.getByText('Data de abertura')).toBeTruthy();
  expect(screen.getByText('Prazo estimado')).toBeTruthy();
  expect(screen.queryByText('Previsão de diagnóstico')).toBeNull();
  expect(screen.queryByText('Data de encerramento')).toBeNull();
  expect(screen.queryByText('Prazo da Carta de Serviços')).toBeNull();
});
