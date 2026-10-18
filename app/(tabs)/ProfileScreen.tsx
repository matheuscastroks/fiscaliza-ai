import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { useAuthStore } from '@/stores/authStore';
import { useCityQuery } from '@/features/city/useCityQuery';
import { QueryState } from '@/features/city/CityUI';
import type { Occurrence, CivicItem } from '@/shared/contracts';
export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const activity = useCityQuery<{
    occurrences: Occurrence[];
    items: CivicItem[];
  }>('/activity');
  return (
    <AppScreen>
      <AppHeader title="Meu perfil" onBack={() => router.back()} />
      <AppScreen scroll>
        <View style={{ gap: 20 }}>
          <AppText variant="screenTitle">{user?.name}</AppText>
          <AppText color="muted">{user?.email}</AppText>
          <AppText variant="sectionTitle">Meu município</AppText>
          <AppText>
            {user?.municipality
              ? `${user.municipality.name} · ${user.municipality.state}`
              : 'Município ainda não confirmado'}
          </AppText>
          {user?.postalCode && (
            <AppText color="muted">
              CEP {user.postalCode.replace(/^(\d{5})(\d{3})$/, '$1-$2')}
              {user.neighborhood ? ` · ${user.neighborhood}` : ''}
            </AppText>
          )}
          {user?.role === 'citizen' && (
            <AppButton
              title="Atualizar CEP e município"
              variant="secondary"
              onPress={() => router.push('/MunicipalityScreen')}
            />
          )}
          <QueryState
            loading={activity.isPending}
            error={activity.error}
            retry={activity.refetch}
          />
          {activity.data && (
            <>
              <AppText variant="sectionTitle">Minha contribuição</AppText>
              <AppText>
                {
                  activity.data.occurrences.filter(
                    (p) => p.reportedBy === user?.id,
                  ).length
                }{' '}
                ocorrências registradas
              </AppText>
              <AppText>
                {
                  activity.data.items.filter(
                    (p) => p.createdBy === user?.id && p.kind === 'proposal',
                  ).length
                }{' '}
                propostas apresentadas
              </AppText>
              <AppText>
                {
                  activity.data.items.filter(
                    (p) =>
                      p.kind === 'consultation' && p.myAnswer !== undefined,
                  ).length
                }{' '}
                consultas respondidas
              </AppText>
            </>
          )}
          <AppButton
            title="Ver acompanhamentos"
            onPress={() => router.push('/(tabs)/FollowScreen')}
          />
          <AppButton
            title="Preferências"
            variant="secondary"
            onPress={() => router.push('/SettingsScreen')}
          />
          <AppButton
            title="Sair da conta"
            variant="quiet"
            onPress={() => {
              void logout().catch(() => {});
            }}
          />
        </View>
      </AppScreen>
    </AppScreen>
  );
}
