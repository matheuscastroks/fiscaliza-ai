import { KeyboardAwareScrollView } from '@/components/ui/KeyboardAwareScrollView';
import React, { useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppSelect } from '@/components/ui/AppSelect';
import { QueryState, createCityStyles } from '@/features/city/CityUI';
import { NeighborhoodOverview } from '@/features/territory/NeighborhoodOverview';
import {
  useNeighborhoodOverview,
  useNeighborhoods,
} from '@/features/territory/usePublicData';
import { initialPeriod } from '@/features/territory/evidence';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import { goBack } from '@/utils/navigation';
export default function NeighborhoodScreen() {
  const { neighborhoodId } = useLocalSearchParams<{
    neighborhoodId?: string;
  }>();
  return (
    <NeighborhoodContent
      key={neighborhoodId || 'choose'}
      initialId={neighborhoodId}
    />
  );
}
function NeighborhoodContent({ initialId }: { initialId?: string }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createCityStyles);
  const [id, setId] = useState(initialId);
  const [dates, setDates] = useState(initialPeriod);
  const [refreshing, setRefreshing] = useState(false);
  const options = useNeighborhoods();
  const overview = useNeighborhoodOverview(id, dates);
  return (
    <AppScreen keyboardAvoiding>
      <AppHeader
        title="Meu bairro"
        context="Rio de Janeiro"
        onBack={() => goBack()}
      />
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.ink}
            onRefresh={() => {
              setRefreshing(true);
              void Promise.all([
                options.refetch(),
                ...(id ? [overview.refetch()] : []),
              ]).finally(() => setRefreshing(false));
            }}
          />
        }
      >
        <AppSelect
          label="Escolher bairro"
          placeholder="Buscar bairro"
          value={id || ''}
          onChange={setId}
          options={(options.data || []).map((n) => ({
            value: n.id,
            label: n.name,
          }))}
        />
        <QueryState
          loading={options.isLoading || Boolean(id && overview.isLoading)}
          error={options.error || overview.error}
          retry={() => {
            void options.refetch();
            if (id) void overview.refetch();
          }}
        />
        {!id && (
          <AppText color="muted">
            Escolha um bairro para conhecer seus serviços e demandas.
          </AppText>
        )}
        {id && overview.data && (
          <NeighborhoodOverview
            key={id}
            data={overview.data}
            onDates={setDates}
          />
        )}
        {!options.isLoading && options.data?.length === 0 && (
          <View>
            <AppText color="muted">
              Limites de bairro ainda não publicados. Tente atualizar mais
              tarde.
            </AppText>
          </View>
        )}
      </KeyboardAwareScrollView>
    </AppScreen>
  );
}
