import { useThemedStyles } from '@/theme/useTheme';
import { goBack } from '@/utils/navigation';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { QueryState, createCityStyles } from '@/features/city/CityUI';
import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';
import { useTerritorySelection } from '@/stores/territoryStore';
import {
  useOfficialCalls,
  useOfficialFilters,
} from '@/features/city/useOfficialCalls';
import { OfficialCallRow } from '@/components/official/OfficialCallRow';
import { IllustratedEmptyState } from '@/features/onboarding/IllustratedEmptyState';
import { spacing } from '@/theme/spacing';

export default function ResultsScreen() {
  const cityStyles = useThemedStyles(createCityStyles);
  const { neighborhood, setNeighborhood } = useTerritorySelection();

  const officialFilters = useOfficialFilters();
  const closedCallsQuery = useOfficialCalls({
    bairro: neighborhood || undefined,
    situacao: 'Encerrado',
    limit: 50,
  });

  const bairroOptions = officialFilters.data?.bairros || [];
  const closedCalls = closedCallsQuery.data?.calls || [];
  const totalClosed = closedCallsQuery.data?.total ?? 0;

  return (
    <AppScreen>
      <AppHeader title="Resultados · Central 1746" onBack={() => goBack()} />
      <ScrollView contentContainerStyle={cityStyles.content}>
        <AppText variant="screenTitle">
          {neighborhood || 'Todo o Rio de Janeiro'}
        </AppText>
        <NeighborhoodPicker
          options={bairroOptions}
          value={neighborhood}
          onChange={setNeighborhood}
        />
        <AppText color="muted">
          Chamados oficiais da Central 1746 encerrados pelos órgãos executores da
          Prefeitura do Rio de Janeiro.
        </AppText>

        <QueryState
          loading={closedCallsQuery.isPending}
          error={closedCallsQuery.error}
          retry={() => {
            void closedCallsQuery.refetch();
          }}
        />

        {!closedCallsQuery.isPending &&
        !closedCallsQuery.error &&
        closedCalls.length === 0 ? (
          <IllustratedEmptyState
            kind="target"
            title="Nenhum chamado encerrado neste recorte"
            description={
              neighborhood
                ? 'Não há chamados encerrados sincronizados para este bairro no momento.'
                : 'Chamados encerrados pela prefeitura aparecerão aqui.'
            }
            action={
              neighborhood
                ? {
                    title: 'Ver todo o município',
                    onPress: () => setNeighborhood(''),
                  }
                : undefined
            }
          />
        ) : (
          closedCalls.length > 0 && (
            <View style={cityStyles.section}>
              <AppText variant="sectionTitle">
                Atendimentos 1746 encerrados ({totalClosed.toLocaleString('pt-BR')})
              </AppText>
              <View style={{ gap: spacing.xs }}>
                {closedCalls.map((call) => (
                  <OfficialCallRow
                    key={call.id}
                    call={call}
                    onPress={() =>
                      router.push({
                        pathname: '/OfficialCallDetailsScreen',
                        params: { id: call.id },
                      })
                    }
                  />
                ))}
              </View>
            </View>
          )
        )}
      </ScrollView>
    </AppScreen>
  );
}
