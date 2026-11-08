import {
  FlatList,
  View,
  RefreshControl,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useMemo } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { SlidingTabs } from '@/components/ui/SlidingTabs';
import { OfficialCallRow } from '@/components/official/OfficialCallRow';
import { IllustratedEmptyState } from '@/features/onboarding/IllustratedEmptyState';
import { useAuthStore } from '@/stores/authStore';
import { useFollowStore, type FollowStatusFilter } from '@/stores/followStore';
import { useSavedRefresh } from '@/features/city/useSavedRefresh';
import { useTheme, spacing, layout } from '@/theme';
import { isOfficialCallClosed } from '@/shared/official-call-state';

export default function FollowScreen() {
  const { colors, isDark } = useTheme();
  const user = useAuthStore((s) => s.user);
  const {
    savedCalls,
    hydrated,
    persistenceError,
    statusFilter,
    setStatusFilter,
  } = useFollowStore();
  const { refresh, refreshing, error } = useSavedRefresh();

  const openCount = useMemo(
    () => savedCalls.filter((c) => !isOfficialCallClosed(c)).length,
    [savedCalls],
  );
  const closedCount = useMemo(
    () => savedCalls.filter((c) => isOfficialCallClosed(c)).length,
    [savedCalls],
  );

  const calls = useMemo(
    () =>
      savedCalls.filter(
        (c) =>
          statusFilter === 'all' ||
          statusFilter === 'saved' ||
          (statusFilter === 'resolved'
            ? isOfficialCallClosed(c)
            : !isOfficialCallClosed(c)),
      ),
    [savedCalls, statusFilter],
  );

  return (
    <AppScreen>
      <AppHeader
        title="Acompanhar"
        context={
          user?.name
            ? `Conta de ${user.name.split(' ')[0]} · Seus chamados salvos`
            : 'Seus chamados salvos neste aparelho'
        }
      />
      <FlatList
        data={hydrated ? calls : []}
        keyExtractor={(c) => c.id}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        contentContainerStyle={{
          padding: spacing.contentPadding,
          paddingBottom: 120,
          gap: spacing.md,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void refresh();
            }}
            tintColor={colors.ink}
            colors={[colors.ink]}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            {hydrated && savedCalls.length > 0 && (
              <View style={styles.summaryTopRow}>
                <AppText variant="meta" color="muted" style={styles.flex}>
                  {savedCalls.length}{' '}
                  {savedCalls.length === 1 ? 'salvo' : 'salvos'} · {openCount}{' '}
                  em aberto · {closedCount}{' '}
                  {closedCount === 1 ? 'encerrado' : 'encerrados'}
                </AppText>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Atualizar situação dos chamados salvos"
                  disabled={refreshing}
                  onPress={() => {
                    void refresh();
                  }}
                  style={({ pressed }) => [
                    styles.refreshPill,
                    {
                      backgroundColor: isDark
                        ? colors.surfaceSubdued
                        : colors.surface,
                      borderColor: colors.border,
                      opacity: refreshing ? 0.6 : pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <Ionicons name="refresh" size={14} color={colors.ink} />
                  <AppText variant="caption" style={{ fontWeight: '600' }}>
                    {refreshing ? 'Atualizando…' : 'Atualizar'}
                  </AppText>
                </Pressable>
              </View>
            )}

            <SlidingTabs
              label="Filtrar meus salvos"
              value={statusFilter === 'saved' ? 'all' : statusFilter}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'open', label: 'Em aberto' },
                { value: 'resolved', label: 'Encerrados no 1746' },
              ]}
              onChange={(v) => setStatusFilter(v as FollowStatusFilter)}
            />

            <AppText variant="caption" color="muted">
              A situação exibida reflete o que foi publicado no 1746. Se constar
              como encerrado mas o problema continuar no local, consulte o
              protocolo ou abra nova solicitação na aba Agir.
            </AppText>

            {!hydrated && (
              <AppText color="muted">Carregando seus salvos…</AppText>
            )}
            {(persistenceError || error) && (
              <AppText color="risk" accessibilityRole="alert">
                {persistenceError || error}
              </AppText>
            )}
          </View>
        }
        ListEmptyComponent={
          hydrated ? (
            <IllustratedEmptyState
              kind="territory"
              title={
                savedCalls.length
                  ? 'Nenhum chamado neste filtro'
                  : 'Guarde chamados para acompanhar'
              }
              description={
                savedCalls.length
                  ? 'Altere o filtro acima para Todos e veja os outros registros salvos neste aparelho.'
                  : 'Ao explorar o mapa ou a tela inicial, toque no coração em qualquer chamado para acompanhar o andamento publicado pelo 1746.'
              }
              action={{
                title: savedCalls.length
                  ? 'Ver todos os salvos'
                  : 'Explorar chamados no mapa',
                onPress: () =>
                  savedCalls.length
                    ? setStatusFilter('all')
                    : router.push('/(tabs)/TerritoryScreen'),
              }}
            />
          ) : undefined
        }
        renderItem={({ item }) => (
          <OfficialCallRow
            call={item}
            onPress={() =>
              router.push({
                pathname: '/OfficialCallDetailsScreen',
                params: { id: item.id },
              })
            }
          />
        )}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    gap: spacing.sm,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  refreshPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: layout.radius.pill,
    borderWidth: 1,
  },
  flex: {
    flex: 1,
  },
});
