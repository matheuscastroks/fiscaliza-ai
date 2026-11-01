import React, { useCallback } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { TerritoryListRow } from '@/components/territory/TerritoryListRow';
import type { Entry } from '@/components/territory/TerritoryPreviewCard';
import {
  TerritoryFilterBar,
  type TerritoryFilterBarProps,
} from '@/components/territory/TerritoryFilterBar';
import { QueryState, createCityStyles } from '@/features/city/CityUI';
import { IllustratedEmptyState } from '@/features/onboarding/IllustratedEmptyState';
import type { TerritoryLayer } from '@/features/territory/selectors';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import { spacing } from '@/theme/spacing';

const entryKey = (entry: Entry) => entry.type + ':' + entry.item.id;

function TerritoryRowSeparator() {
  return <View style={{ height: spacing.md }} />;
}

export interface TerritoryListViewProps {
  listRef: React.RefObject<FlatList<Entry> | null>;
  listOffsetRef: React.MutableRefObject<number>;
  restoreListOffsetRef: React.MutableRefObject<boolean>;
  listed: Entry[];
  unlocatedCount: number;
  areaOnly: boolean;
  layers: TerritoryLayer[];
  totalCalls: number;
  hasMoreCalls: boolean;
  dataReady: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onOpenEntry: (entry: Entry) => void;
  onResetFilters: () => void;
  officialQuery: {
    isLoading: boolean;
    isFetching: boolean;
    isFetchingNextPage: boolean;
    error: Error | null | undefined;
    fetchStatus?: string;
    refetch: () => void;
    fetchNextPage: () => void;
  };
  filterBarProps: TerritoryFilterBarProps;
}

export function TerritoryListView({
  listRef,
  listOffsetRef,
  restoreListOffsetRef,
  listed,
  unlocatedCount,
  areaOnly,
  layers,
  totalCalls,
  hasMoreCalls,
  dataReady,
  refreshing,
  onRefresh,
  onOpenEntry,
  onResetFilters,
  officialQuery,
  filterBarProps,
}: TerritoryListViewProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const cityStyles = useThemedStyles(createCityStyles);

  const renderEntry = useCallback(
    ({ item }: { item: Entry }) => (
      <TerritoryListRow entry={item} onOpen={onOpenEntry} />
    ),
    [onOpenEntry],
  );

  return (
    <View
      style={[
        styles.fullListOverlay,
        { backgroundColor: colors.canvas, paddingTop: insets.top },
      ]}
    >
      <AppHeader
        title="Território"
        context="Rio de Janeiro · Serviços e demandas"
      />

      <TerritoryFilterBar {...filterBarProps} padded />

      <FlatList<Entry>
        ref={listRef}
        data={listed}
        onContentSizeChange={(_, height) => {
          if (!restoreListOffsetRef.current || height <= listOffsetRef.current)
            return;
          listRef.current?.scrollToOffset({
            offset: listOffsetRef.current,
            animated: false,
          });
          restoreListOffsetRef.current = false;
        }}
        onScroll={(event) => {
          if (!restoreListOffsetRef.current)
            listOffsetRef.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={32}
        keyExtractor={entryKey}
        renderItem={renderEntry}
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        windowSize={7}
        ItemSeparatorComponent={TerritoryRowSeparator}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.ink}
          />
        }
        contentContainerStyle={[
          cityStyles.content,
          { gap: 0, paddingBottom: insets.bottom + 100 },
        ]}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, marginBottom: spacing.md }}>
            {(officialQuery.isLoading ||
              officialQuery.error ||
              officialQuery.fetchStatus === 'paused') && (
              <View style={{ gap: spacing.xs }}>
                <QueryState
                  loading={officialQuery.isLoading}
                  error={officialQuery.error}
                  retry={officialQuery.refetch}
                />
              </View>
            )}
            <View style={cityStyles.section}>
              <AppText variant="sectionTitle">
                {areaOnly
                  ? 'Registros na área visível'
                  : 'Registros no território'}{' '}
                (
                {layers.length === 1 &&
                layers[0] === 'official' &&
                listed.length < totalCalls
                  ? `${listed.length} de ${totalCalls.toLocaleString('pt-BR')}`
                  : listed.length.toLocaleString('pt-BR')}
                )
              </AppText>
            </View>
          </View>
        }
        ListFooterComponent={
          <View style={{ gap: spacing.md, marginTop: spacing.md }}>
            {layers.includes('official') && hasMoreCalls && (
              <AppButton
                title={`Carregar mais chamados (${listed.length} de ${totalCalls.toLocaleString('pt-BR')})`}
                variant="secondary"
                disabled={officialQuery.isFetchingNextPage}
                onPress={() => {
                  if (!officialQuery.isFetching) {
                    officialQuery.fetchNextPage();
                  }
                }}
              />
            )}
            {dataReady &&
              listed.length === 0 &&
              layers.length === 1 &&
              layers[0] === 'official' && (
                <IllustratedEmptyState
                  kind="territory"
                  title="Nenhum chamado 1746 neste recorte"
                  description="Nenhum chamado oficial encontrado com os filtros atuais."
                  action={{
                    title: 'Limpar filtros',
                    onPress: onResetFilters,
                  }}
                />
              )}
            {unlocatedCount > 0 && (
              <AppText variant="caption" color="muted">
                Esta lista inclui {unlocatedCount} registros sem ponto no mapa.
              </AppText>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fullListOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 60,
  },
});
