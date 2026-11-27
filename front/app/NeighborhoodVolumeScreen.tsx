import React from 'react';
import { ScrollView, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { ScreenState } from '@/components/ui/ScreenState';
import { RankingSection } from '@/features/city/RankingSection';
import { topByVolume } from '@/features/city/resultRankings';
import { useOfficialOverview } from '@/features/city/useOfficialCalls';
import { useTerritorySelection } from '@/stores/territoryStore';
import { useTheme, spacing } from '@/theme';
import { goBack } from '@/utils/navigation';

/** Volume de chamados por bairro: só contagem, sem julgar desempenho. Tocar num bairro muda o recorte. */
export default function NeighborhoodVolumeScreen() {
  const { colors } = useTheme();
  const overview = useOfficialOverview(undefined);
  const { setNeighborhood } = useTerritorySelection();
  const rows = topByVolume(overview.data?.neighborhoodRanking || []);

  return (
    <AppScreen>
      <AppHeader title="Bairros por volume" context="Chamados registrados no 1746" onBack={() => goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.contentPadding, paddingBottom: spacing.xxxl, gap: spacing.md }}>
        <ScreenState
          loading={overview.isLoading}
          error={overview.error}
          retry={() => { void overview.refetch(); }}
          empty={rows.length === 0 ? { description: 'Ainda não há chamados suficientes para mostrar os bairros.' } : undefined}
        >
          <RankingSection
            showPosition={false}
            title="Bairros com mais registros"
            rows={rows.map((row) => ({
              key: row.neighborhood,
              label: row.neighborhood,
              value: row.count.toLocaleString('pt-BR'),
              share: row.count / (rows[0]?.count || 1),
              tone: colors.primary,
              onPress: () => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setNeighborhood(row.neighborhood);
                goBack();
              },
            }))}
          />
          <View>
            <AppText variant="meta" color="muted">
              Toque em um bairro para ver seus dados. Fonte: Prefeitura do Rio (Data.Rio).
            </AppText>
          </View>
        </ScreenState>
      </ScrollView>
    </AppScreen>
  );
}
