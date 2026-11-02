import React, { useMemo, useState, useCallback } from 'react';
import { ScrollView, View, RefreshControl, Pressable, StyleSheet } from 'react-native';
import { router, useIsFocused } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles, useTheme } from '@/theme/useTheme';
import { spacing, layout } from '@/theme';
import { CitySearch } from '@/components/ui/CitySearch';
import { AppButton } from '@/components/ui/AppButton';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { QueryState, createCityStyles } from '@/features/city/CityUI';
import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';
import { useOfficialCalls } from '@/features/city/useOfficialCalls';
import { OfficialCallRow } from '@/components/official/OfficialCallRow';
import { CityCarousel } from '@/features/city/CityCarousel';
import { IllustratedEmptyState } from '@/features/onboarding/IllustratedEmptyState';
import { useTerritorySelection } from '@/stores/territoryStore';
import { useFollowStore } from '@/stores/followStore';
import { CitizenAction } from '@/features/city/CitizenAction';
import {
  resolveServiceCategoryTheme,
  type ServiceCategoryTheme,
} from '@/features/city/officialCategoryThemes';
import type { OfficialCall } from '@/shared/contracts';

interface CategoryGroup {
  theme: ServiceCategoryTheme;
  calls: OfficialCall[];
}

export default function HomeScreen() {
  const active = useIsFocused();
  const { colors } = useTheme();
  const styles = useThemedStyles(createCityStyles);
  const [refreshing, setRefreshing] = useState(false);
  const { neighborhood, neighborhoodId, setNeighborhood } =
    useTerritorySelection();
  const saved = useFollowStore((s) => s.savedCalls);
  const hydrated = useFollowStore((s) => s.hydrated);

  const calls = useOfficialCalls(
    {
      neighborhoodId,
      bairro: neighborhoodId ? undefined : neighborhood || undefined,
      situacao: 'Não Encerrado',
      limit: 30,
    },
    active,
  );

  const explore = useCallback(() => router.push('/(tabs)/TerritoryScreen'), []);

  const handleOpenCall = useCallback((id: string) => {
    router.push({
      pathname: '/OfficialCallDetailsScreen',
      params: { id },
    });
  }, []);

  const renderCallRow = useCallback(
    (item: OfficialCall) => (
      <OfficialCallRow call={item} onPress={() => handleOpenCall(item.id)} />
    ),
    [handleOpenCall],
  );

  // Agrupamento dos chamados por Categoria Temática
  const groupedCategories = useMemo<CategoryGroup[]>(() => {
    const list = calls.data?.calls || [];
    const map = new Map<
      string,
      { theme: ServiceCategoryTheme; calls: OfficialCall[] }
    >();

    for (const call of list) {
      const theme = resolveServiceCategoryTheme(
        call.serviceType,
        call.serviceSubtype,
      );
      const existing = map.get(theme.id);
      if (existing) {
        existing.calls.push(call);
      } else {
        map.set(theme.id, { theme, calls: [call] });
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => b.calls.length - a.calls.length,
    );
  }, [calls.data?.calls]);

  return (
    <AppScreen>
      <AppHeader title="Sua região" context="Rio de Janeiro · RJ" />
      <ScrollView
        contentContainerStyle={styles.content}
        alwaysBounceVertical
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.ink}
            colors={[colors.ink]}
            onRefresh={() => {
              setRefreshing(true);
              void calls.refetch().finally(() => setRefreshing(false));
            }}
          />
        }
      >
        <View style={{ gap: spacing.sm }}>
          <CitySearch
            onPress={explore}
            onFilters={() =>
              router.push({
                pathname: '/(tabs)/TerritoryScreen',
                params: { filters: String(Date.now()) },
              })
            }
            filterCount={neighborhood ? 1 : 0}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.xs, alignItems: 'center' }}
          >
            <NeighborhoodPicker
              compact
              options={[]}
              value={neighborhood}
              onChange={setNeighborhood}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir filtros avançados no mapa"
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/TerritoryScreen',
                  params: { filters: String(Date.now()) },
                })
              }
              style={({ pressed }) => ({
                minHeight: 48,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                paddingHorizontal: spacing.md,
                borderRadius: layout.radius.pill,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="options-outline" size={17} color={colors.ink} />
              <AppText variant="meta">Filtros no mapa</AppText>
            </Pressable>
            {neighborhood !== '' && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Limpar filtro de bairro"
                onPress={() => setNeighborhood('')}
                style={({ pressed }) => ({
                  minHeight: 48,
                  paddingHorizontal: spacing.sm,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xxs,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={18}
                  color={colors.muted}
                />
                <AppText variant="meta" color="muted">
                  Limpar
                </AppText>
              </Pressable>
            )}
          </ScrollView>
        </View>

        <CitizenAction
          title="Explorar minha região"
          description="Demandas e serviços públicos no mapa"
          icon="map-outline"
          primary
          onPress={explore}
        />

        {/* Seção: Acompanhados pelo Usuário */}
        {hydrated && saved.length > 0 && (
          <View style={styles.section}>
            <View style={{ gap: 2 }}>
              <AppText variant="sectionTitle">Estou acompanhando</AppText>
              <AppText variant="caption" color="muted">
                Salvos na sua conta · deslize para ver
              </AppText>
            </View>

            <CityCarousel
              items={saved}
              label="Chamados que você está acompanhando"
              renderItem={renderCallRow}
            />

            <AppButton
              title="Ver meus salvos"
              variant="secondary"
              onPress={() => router.push('/(tabs)/FollowScreen')}
            />
          </View>
        )}

        {/* Seção Principal: O que acontece na cidade organizado por Categoria em Slides */}
        <View style={styles.section}>
          <View style={{ gap: 2 }}>
            <AppText variant="sectionTitle">
              O que acontece {neighborhood ? `em ${neighborhood}` : 'na cidade'}
              ?
            </AppText>
            <AppText variant="caption" color="muted">
              Demandas da Central 1746 organizadas por categoria temática.
            </AppText>
          </View>

          <QueryState
            loading={calls.isLoading}
            error={calls.error}
            retry={calls.refetch}
          />

          {calls.fetchStatus === 'paused' && (
            <AppText color="muted">
              Sem conexão. Os registros disponíveis voltam a ser atualizados
              quando a rede retornar.
            </AppText>
          )}

          {!calls.isPending && !calls.error && !calls.data?.calls.length && (
            <IllustratedEmptyState
              kind="territory"
              title="Nenhum registro neste recorte"
              description="A base sincronizada não contém registros para este filtro. Isso não significa ausência de chamados no 1746."
              action={{ title: 'Explorar outro recorte', onPress: explore }}
            />
          )}

          {/* Carrosséis Horizontais por Categoria */}
          {groupedCategories.map((group, index) => (
            <View
              key={group.theme.id}
              style={{
                gap: spacing.sm,
                marginTop: index > 0 ? spacing.lg : spacing.xs,
                paddingTop: index > 0 ? spacing.xl : 0,
                borderTopWidth: index > 0 ? StyleSheet.hairlineWidth : 0,
                borderTopColor: colors.divider,
              }}
            >
              {/* Cabeçalho da Categoria com Ícone e Contagem */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 2,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Ionicons
                    name={group.theme.icon as React.ComponentProps<typeof Ionicons>['name']}
                    size={18}
                    color={colors.ink}
                  />
                  <AppText variant="label" style={{ fontWeight: '700' }}>
                    {group.theme.label}
                  </AppText>
                </View>

                <AppText variant="caption" color="muted">
                  {group.calls.length}{' '}
                  {group.calls.length === 1 ? 'chamado' : 'chamados'}
                </AppText>
              </View>

              {/* Carrossel Tridimensional de Chamados dessa Categoria */}
              <CityCarousel
                items={group.calls}
                label={`Chamados de ${group.theme.label}`}
                renderItem={renderCallRow}
              />
            </View>
          ))}

          <AppButton
            title="Explorar todas as demandas no mapa"
            variant="secondary"
            onPress={explore}
            style={{ marginTop: spacing.sm }}
          />
        </View>

        <CitizenAction
          title="Precisa solicitar um serviço?"
          description="Encontre o atendimento oficial da prefeitura"
          icon="open-outline"
          onPress={() => router.push('/(tabs)/ParticipateScreen')}
        />
      </ScrollView>
    </AppScreen>
  );
}
