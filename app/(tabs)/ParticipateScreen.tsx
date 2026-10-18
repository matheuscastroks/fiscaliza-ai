import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { CivicRow, QueryState, cityStyles } from '@/features/city/CityUI';
import { useCityQuery } from '@/features/city/useCityQuery';
import type { CivicItem } from '@/shared/contracts';
import { useAuthStore } from '@/stores/authStore';
export default function ParticipateScreen() {
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
        <View style={cityStyles.section}>
          <AppButton
            title="Registrar ocorrência"
            onPress={() => router.push('/(tabs)/ReportScreen')}
          />
          <AppButton
            title="Propor uma melhoria"
            variant="secondary"
            onPress={() => router.push('/ProposalScreen')}
          />
        </View>
        <View style={cityStyles.controls}>
          {(
            [
              ['all', 'Tudo'],
              ['consultation', 'Consultas'],
              ['proposal', 'Propostas'],
              ['action', 'Ações'],
            ] as const
          ).map(([value, label]) => (
            <AppButton
              key={value}
              title={label}
              variant={kind === value ? 'primary' : 'quiet'}
              accessibilityState={{ selected: kind === value }}
              onPress={() => setKind(value)}
            />
          ))}
        </View>
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
