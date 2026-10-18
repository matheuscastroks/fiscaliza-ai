import { useThemedStyles } from '@/theme/useTheme';
import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { ContributionActions } from '@/features/city/ContributionActions';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { CivicRow, QueryState, createCityStyles } from '@/features/city/CityUI';
import { useCityQuery } from '@/features/city/useCityQuery';
import type { CivicItem } from '@/shared/contracts';
import { useAuthStore } from '@/stores/authStore';
import { SlidingTabs } from '@/components/ui/SlidingTabs';
export default function ParticipateScreen() {
  const cityStyles = useThemedStyles(createCityStyles);

  const municipality = useAuthStore((state) => state.user?.municipality);
  const query = useCityQuery<CivicItem[]>('/civic-items');
  const [kind, setKind] = useState<
    'all' | 'proposal' | 'consultation' | 'action'
  >('all');
  return (
    <AppScreen>
      <AppHeader
        title="Participar"
        context={
          municipality
            ? `${municipality.name} · ${municipality.state}`
            : 'Seu município'
        }
      />
      <ScrollView contentContainerStyle={cityStyles.content}>
        <ContributionActions />
        <SlidingTabs
          label="Filtrar participações"
          options={[
            { value: 'all', label: 'Tudo' },
            { value: 'consultation', label: 'Consultas' },
            { value: 'proposal', label: 'Propostas' },
            { value: 'action', label: 'Ações' },
          ]}
          value={kind}
          onChange={(value) => setKind(value as typeof kind)}
        />
        <QueryState
          loading={query.isPending}
          error={query.error}
          retry={query.refetch}
        />
        {query.data
          ?.filter((i) => kind === 'all' || i.kind === kind)
          .map((i) => (
            <CivicRow key={i.id} item={i} />
          ))}
        {query.data &&
          !query.data.some((i) => kind === 'all' || i.kind === kind) && (
            <AppText color="muted">
              Nenhuma participação disponível neste filtro.
            </AppText>
          )}
      </ScrollView>
    </AppScreen>
  );
}
