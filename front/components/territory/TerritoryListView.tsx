import React, { useCallback, useEffect, useMemo, useRef, memo } from 'react';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import {
  AccessibilityInfo,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { TerritoryListRow } from '@/components/territory/TerritoryListRow';
import type { Entry } from '@/components/territory/TerritoryPreviewCard';
import {
  TerritoryFilterBar,
  type TerritoryFilterBarProps,
} from '@/components/territory/TerritoryFilterBar';
import { createCityStyles } from '@/features/city/CityUI';
import { ScreenState } from '@/components/ui/ScreenState';
import { IllustratedEmptyState } from '@/features/onboarding/IllustratedEmptyState';
import type { TerritoryLayer } from '@/features/territory/selectors';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import { spacing } from '@/theme/spacing';

const entryKey = (entry: Entry) => entry.type + ':' + entry.item.id;

function TerritoryRowSeparator() {
  const { colors } = useTheme();
  return <View style={[styles.separator, { backgroundColor: colors.dividerSubtle }]} />;
}

export interface TerritoryListViewProps {
  visible?: boolean;
  offline?: boolean;
  onRetryMap?: () => void;
  onBackToMap?: () => void;
  /** Recorte "localização atual" sem posição: explica e oferece capturar ou escolher um bairro. */
  locationPrompt?: { onUseLocation: () => void };
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
  onLocateEntry?: (entry: Entry) => void;
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
  facilityPagination?: {
    hasMore: boolean;
    isFetchingNextPage: boolean;
    loadedCount: number;
    totalKnown: number | null;
    label?: string;
    fetchNextPage: () => void;
  };
}

function TerritoryListViewComponent({
  visible = true,
  offline = false,
  onRetryMap,
  onBackToMap,
  locationPrompt,
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
  onLocateEntry,
  onResetFilters,
  officialQuery,
  filterBarProps,
  facilityPagination,
}: TerritoryListViewProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { contentInset } = useTabBarInset();
  const cityStyles = useThemedStyles(createCityStyles);

  const renderEntry = useCallback(
    ({ item }: { item: Entry }) => (
      <TerritoryListRow
        entry={item}
        onOpen={onOpenEntry}
        onLocate={onLocateEntry}
      />
    ),
    [onOpenEntry, onLocateEntry],
  );

  // Rolagem infinita: perto do fim, pede a próxima página (o botão abaixo continua como alternativa).
  const loadMore = useCallback(() => {
    if (offline) return;
    if (layers.includes('official')) {
      if (hasMoreCalls && !officialQuery.isFetching && !officialQuery.error) officialQuery.fetchNextPage();
      return;
    }
    if (facilityPagination?.hasMore && !facilityPagination.isFetchingNextPage) facilityPagination.fetchNextPage();
  }, [offline, layers, hasMoreCalls, officialQuery, facilityPagination]);

  const facilityLoaded = facilityPagination?.loadedCount ?? 0;
  const facilityTotal = facilityPagination?.totalKnown ?? null;

  const countLabel = useMemo(() => {
    if (layers.length === 1 && layers[0] === 'official') {
      return listed.length < totalCalls
        ? `${listed.length} de ${totalCalls.toLocaleString('pt-BR')}`
        : listed.length.toLocaleString('pt-BR');
    }
    if (!layers.includes('official') && facilityTotal !== null && facilityLoaded < facilityTotal) {
      return `${facilityLoaded} de ${facilityTotal.toLocaleString('pt-BR')}`;
    }
    return listed.length.toLocaleString('pt-BR');
  }, [layers, listed.length, totalCalls, facilityLoaded, facilityTotal]);

  const sectionHeading = locationPrompt
    ? 'Aguardando localização'
    : `${countLabel} ${areaOnly ? 'na área visível' : 'nesta área'}`;

  const headerNotice = (
    <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
      {offline ? (
        <View accessibilityLiveRegion="polite" style={{ gap: spacing.xs, paddingVertical: spacing.md }}>
          <AppText variant="label">Sem conexão</AppText>
          <AppText color="muted">
            {listed.length ? 'Mostrando dados carregados anteriormente.' : 'A busca recomeça quando a conexão voltar.'}
          </AppText>
        </View>
      ) : layers.includes('official') && officialQuery.error ? (
        <View accessibilityLiveRegion="polite" style={{ gap: spacing.sm, paddingVertical: spacing.md }}>
          <AppText variant="label" color="risk">
            {listed.length ? 'Mostrando os chamados carregados anteriormente.' : 'Os chamados não carregaram.'}
          </AppText>
          <AppButton title="Tentar novamente" variant="secondary" onPress={officialQuery.refetch} />
        </View>
      ) : layers.includes('official') && officialQuery.isLoading ? (
        <ScreenState loading />
      ) : null}
      {(listed.length > 0 || unlocatedCount > 0) && (
        <View style={styles.resultContext}>
          <AppText variant="caption" color="muted">{sectionHeading}</AppText>
          {unlocatedCount > 0 && (
            <AppText variant="caption" color="muted">
              {unlocatedCount} {unlocatedCount === 1 ? 'chamado sem ponto no mapa' : 'chamados sem ponto no mapa'}
            </AppText>
          )}
        </View>
      )}
    </View>
  );

  const footerContent = (
    <View style={{ gap: spacing.md, marginTop: spacing.md }}>
      {locationPrompt && (
        <IllustratedEmptyState
          kind="territory"
          height={96}
          title="Aguardando sua localização"
          description="Para ver chamados perto de você, permita a localização. Ou escolha um bairro."
          action={{ title: 'Usar minha localização', onPress: locationPrompt.onUseLocation }}
        />
      )}
      {!offline && layers.includes('official') && hasMoreCalls && (
        <AppButton
          title={officialQuery.isFetchingNextPage
            ? 'Carregando mais chamados…'
            : `Carregar mais chamados (${listed.length} de ${totalCalls.toLocaleString('pt-BR')})`}
          variant="secondary"
          disabled={officialQuery.isFetchingNextPage}
          onPress={() => {
            if (!officialQuery.isFetching) {
              officialQuery.fetchNextPage();
            }
          }}
        />
      )}
      {!offline && facilityPagination?.hasMore && (
        <AppButton
          title={
            facilityTotal !== null
              ? `Carregar mais ${facilityPagination.label || 'serviços'} (${facilityLoaded} de ${facilityTotal.toLocaleString('pt-BR')})`
              : `Carregar mais ${facilityPagination.label || 'serviços'}`
          }
          variant="secondary"
          disabled={facilityPagination.isFetchingNextPage}
          onPress={facilityPagination.fetchNextPage}
        />
      )}
      {!offline && dataReady &&
        listed.length === 0 &&
        layers.length === 1 &&
        layers[0] === 'official' && (
          <IllustratedEmptyState
            kind="territory"
            title="Nenhum chamado por aqui"
            description="Não achamos chamados com esses filtros. Tente limpar os filtros."
            action={{
              title: 'Limpar filtros',
              onPress: onResetFilters,
            }}
          />
        )}
      {!offline && dataReady &&
        listed.length === 0 &&
        !layers.includes('official') && (
          <IllustratedEmptyState
            kind="territory"
            title="Nenhum serviço público por aqui"
            description="Não achamos serviços públicos com esses filtros."
            action={{
              title: 'Limpar filtros',
              onPress: onResetFilters,
            }}
          />
        )}
    </View>
  );

  const titleRef = useRef<React.ComponentRef<typeof View>>(null);
  const hasResultsHeader = Boolean(onBackToMap);
  useEffect(() => {
    if (!visible || !hasResultsHeader) return;
    let active = true;
    void AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      if (active && enabled && titleRef.current) {
        AccessibilityInfo.sendAccessibilityEvent(titleRef.current, 'focus');
      }
    });
    return () => { active = false; };
  }, [visible, hasResultsHeader]);

  if (!visible) return null;

  return (
    <View
      style={[
        styles.fullListOverlay,
        {
          backgroundColor: colors.canvas,
          paddingTop: insets.top + spacing.md,
        },
      ]}
    >
      {onBackToMap ? (
        <View style={styles.toolbar}>
          <View ref={titleRef} accessible accessibilityRole="header" accessibilityLabel="Resultados" style={styles.title}>
            <AppText variant="sectionTitle">Resultados</AppText>
          </View>
          <AppButton title="Voltar ao mapa" variant="quiet" onPress={onBackToMap} />
        </View>
      ) : null}
      <TerritoryFilterBar
        {...filterBarProps}
        searchFocusRequest={onBackToMap ? undefined : filterBarProps.searchFocusRequest}
        padded
        showMenu={!onBackToMap}
      />
      {onRetryMap && (
        <View style={{ paddingHorizontal: spacing.contentPadding }}>
          <AppButton title="Tentar carregar o mapa" variant="secondary" onPress={onRetryMap} />
        </View>
      )}

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
        refreshControl={offline ? undefined :
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.ink}
          />
        }
        contentContainerStyle={[
          cityStyles.content,
          { gap: 0, paddingBottom: onBackToMap ? insets.bottom + spacing.md : contentInset },
        ]}
        ListHeaderComponent={headerNotice}
        ListFooterComponent={footerContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
      />
    </View>
  );
}

export const TerritoryListView = memo(TerritoryListViewComponent);

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.xs,
    paddingHorizontal: spacing.contentPadding,
  },
  title: { flexShrink: 1 },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  fullListOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 60,
  },
  resultContext: { gap: spacing.xxs },
});
