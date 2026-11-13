import { renderHook } from '@testing-library/react-native';
import { useTerritoryEntries } from '@/features/territory/useTerritoryEntries';

const call = (id: string, located: boolean) => ({ id, externalId: id, latitude: located ? -22.9 : null, longitude: located ? -43.2 : null, serviceType: 'Luz', serviceSubtype: 'Lâmpada', officialSituation: 'Aberto' });
const fixture = (areaOnly = false) => ({
  layers: ['official'], neighborhood: '', neighborhoodId: undefined, areaOnly,
  officialCalls: { data: { calls: [call('visible', true), call('unlocated', false)], total: 2 }, hasNextPage: false },
  schools: {}, health: {}, squares: {}, facilityQueries: {}, selectedId: 'focus', selectedCluster: null,
  focusedCallQuery: { data: call('focus', true) },
}) as unknown as Parameters<typeof useTerritoryEntries>[0];

it('área do mapa omite chamados sem coordenadas e preserva detalhe focado fora da página', async () => {
  const { result } = await renderHook(() => useTerritoryEntries(fixture(true)));
  expect(result.current.listed.map(e => e.item.id)).toEqual(['visible']);
  expect(result.current.unlocated.map(e => e.item.id)).toEqual(['unlocated']);
  expect(result.current.selectedEntry?.item.id).toBe('focus');
  expect(result.current.allMapMarkers.map(m => m.id)).toEqual(['visible', 'focus']);
});

it('consulta por bairro mantém chamados sem ponto na lista', async () => {
  const { result } = await renderHook(() => useTerritoryEntries(fixture(false)));
  expect(result.current.listed.map(e => e.item.id)).toEqual(['visible', 'unlocated']);
  expect(result.current.totalCalls).toBe(2);
});
