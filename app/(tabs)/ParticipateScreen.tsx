import { IllustratedEmptyState } from '@/features/onboarding/IllustratedEmptyState';
import { useThemedStyles } from '@/theme/useTheme';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { ContributionActions } from '@/features/city/ContributionActions';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { CivicRow, QueryState, createCityStyles } from '@/features/city/CityUI';
import { CityCarousel } from '@/features/city/CityCarousel';
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

  const items = query.data || [];
  const consultations = items.filter((i) => i.kind === 'consultation');
  const proposals = items.filter((i) => i.kind === 'proposal');
  const actions = items.filter((i) => i.kind === 'action');

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

        {kind === 'all' ? (
          <>
            {consultations.length > 0 && (
              <View style={cityStyles.section}>
                <AppText variant="sectionTitle">Consultas públicas</AppText>
                <CityCarousel
                  items={consultations}
                  label="Consultas públicas"
                  renderItem={(item) => <CivicRow item={item} />}
                />
              </View>
            )}

            {proposals.length > 0 && (
              <View style={cityStyles.section}>
                <AppText variant="sectionTitle">Propostas da comunidade</AppText>
                <CityCarousel
                  items={proposals}
                  label="Propostas da comunidade"
                  renderItem={(item) => <CivicRow item={item} />}
                />
              </View>
            )}

            {actions.length > 0 && (
              <View style={cityStyles.section}>
                <AppText variant="sectionTitle">Ações públicas</AppText>
                <CityCarousel
                  items={actions}
                  label="Ações públicas"
                  renderItem={(item) => <CivicRow item={item} />}
                />
              </View>
            )}
          </>
        ) : (
          items
            .filter((i) => i.kind === kind)
            .map((i) => <CivicRow key={i.id} item={i} />)
        )}

        {query.data &&
          !query.error &&
          !query.data.some((i) => kind === 'all' || i.kind === kind) && (
            <IllustratedEmptyState
              kind="participation"
              title="Nenhuma participação neste filtro"
              description="Consultas, propostas e ações publicadas aparecem aqui. Você também pode escolher outro filtro."
            />
          )}
      </ScrollView>
    </AppScreen>
  );
}
