import React, { useCallback, useEffect, useMemo, useRef, memo } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import {
  AppBottomSheetModal,
  BottomSheet,
  BottomSheetFlatList,
} from '@/components/ui/AppBottomSheetModal';
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
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';

const entryKey = (entry: Entry) => entry.type + ':' + entry.item.id;

function TerritoryRowSeparator() {
  return <View style={{ height: spacing.md }} />;
}

export interface TerritoryListViewProps {
  visible?: boolean;
  asSheet?: boolean;
  onClose?: () => void;
  /** Sheet sempre presente sobre o mapa (recolhido, médio, alto), sem modal nem fundo escurecido. */
  persistent?: boolean;
  /** Pedido externo para expandir (true) ou recolher (false) o sheet persistente. */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Espaço reservado na base (barra de abas flutuante). */
  bottomInset?: number;
  summaryTitle?: string;
  summarySubtitle?: string;
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
  asSheet = true,
  onClose,
  persistent = false,
  expanded = false,
  onExpandedChange,
  bottomInset = 0,
  summaryTitle,
  summarySubtitle,
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
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
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

  const sectionHeading = `${
    areaOnly ? 'Registros na área visível' : 'Registros no território'
  } (${countLabel})`;

  const headerNotice = (
    <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
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
      {(!asSheet || unlocatedCount > 0) && (
        <View style={cityStyles.section}>
          {!asSheet && (
            <AppText variant="sectionTitle">{sectionHeading}</AppText>
          )}
          {unlocatedCount > 0 && (
            <View
              style={[
                styles.unlocatedNotice,
                {
                  backgroundColor: isDark
                    ? colors.surfaceSubdued
                    : colors.surfaceSubdued,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={layout.iconSize.sm}
                color={colors.onSurfaceBrand}
              />
              <AppText variant="caption" color="muted" style={{ flex: 1 }}>
                Inclui {unlocatedCount}{' '}
                {unlocatedCount === 1
                  ? 'chamado oficial sem coordenadas publicadas no mapa.'
                  : 'chamados oficiais sem coordenadas publicadas no mapa.'}
              </AppText>
            </View>
          )}
        </View>
      )}
    </View>
  );

  const footerContent = (
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
      {facilityPagination?.hasMore && (
        <AppButton
          title={
            facilityTotal !== null
              ? `Carregar mais ${facilityPagination.label || 'equipamentos'} (${facilityLoaded} de ${facilityTotal.toLocaleString('pt-BR')})`
              : `Carregar mais ${facilityPagination.label || 'equipamentos'}`
          }
          variant="secondary"
          disabled={facilityPagination.isFetchingNextPage}
          onPress={facilityPagination.fetchNextPage}
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
      {dataReady &&
        listed.length === 0 &&
        !layers.includes('official') && (
          <IllustratedEmptyState
            kind="territory"
            title="Nenhum equipamento neste recorte"
            description="Nenhum equipamento público encontrado com os filtros atuais."
            action={{
              title: 'Limpar filtros',
              onPress: onResetFilters,
            }}
          />
        )}
    </View>
  );

  if (asSheet && persistent) {
    return (
      <PersistentSheet
        visible={visible}
        expanded={expanded}
        onExpandedChange={onExpandedChange}
        bottomInset={bottomInset}
        title={summaryTitle ?? sectionHeading}
        subtitle={summarySubtitle}
      >
        <BottomSheetFlatList<Entry>
          data={listed}
          keyExtractor={entryKey}
          renderItem={renderEntry}
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          windowSize={7}
          ItemSeparatorComponent={TerritoryRowSeparator}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={[
            cityStyles.content,
            { gap: 0, paddingTop: spacing.xs, paddingBottom: insets.bottom + bottomInset + spacing.xl },
          ]}
          ListHeaderComponent={headerNotice}
          ListFooterComponent={footerContent}
        />
      </PersistentSheet>
    );
  }

  if (asSheet) {
    return (
      <AppBottomSheetModal
        visible={visible}
        onClose={() => onClose?.()}
        title={sectionHeading}
        snapPoints={['48%', '75%', '92%']}
        backdropOpacity={0.16}
      >
        <BottomSheetFlatList<Entry>
          data={listed}
          keyExtractor={entryKey}
          renderItem={renderEntry}
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          windowSize={7}
          ItemSeparatorComponent={TerritoryRowSeparator}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={[
            cityStyles.content,
            {
              gap: 0,
              paddingTop: spacing.xs,
              paddingBottom: insets.bottom + spacing.xl,
            },
          ]}
          ListHeaderComponent={headerNotice}
          ListFooterComponent={footerContent}
        />
      </AppBottomSheetModal>
    );
  }

  if (!visible) return null;

  return (
    <View
      style={[
        styles.fullListOverlay,
        {
          backgroundColor: colors.canvas,
          paddingTop: insets.top + spacing.xs,
        },
      ]}
    >
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
          { gap: 0, paddingBottom: insets.bottom + 110 },
        ]}
        ListHeaderComponent={headerNotice}
        ListFooterComponent={footerContent}
      />
    </View>
  );
}

export const TerritoryListView = memo(TerritoryListViewComponent);

const SNAP_POINTS = ['22%', '52%', '90%'];

function PersistentSheet({
  visible, expanded, onExpandedChange, bottomInset, title, subtitle, children,
}: {
  visible: boolean;
  expanded: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  bottomInset: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  const ref = useRef<React.ComponentRef<typeof BottomSheet>>(null);
  const last = useRef(0);

  // Pedido externo (botão Mapa/Lista, voltar do Android) move o sheet.
  useEffect(() => {
    if (expanded === (last.current === 2)) return;
    ref.current?.snapToIndex(expanded ? 2 : 0);
  }, [expanded]);

  if (!visible) return null;
  return (
    <BottomSheet
      ref={ref}
      index={0}
      snapPoints={SNAP_POINTS}
      bottomInset={bottomInset}
      enablePanDownToClose={false}
      onChange={(index) => {
        last.current = index;
        onExpandedChange?.(index === 2);
      }}
      backgroundStyle={[styles.sheetBackground, { backgroundColor: colors.surface }]}
      handleIndicatorStyle={{ backgroundColor: colors.divider }}
    >
      <View style={styles.sheetHeader} accessibilityRole="header">
        <AppText variant="label" numberOfLines={1}>{title}</AppText>
        {subtitle ? <AppText variant="caption" color="muted" numberOfLines={1}>{subtitle}</AppText> : null}
      </View>
      {children}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: layout.radius.sheet,
    borderTopRightRadius: layout.radius.sheet,
  },
  sheetHeader: {
    paddingHorizontal: spacing.contentPadding,
    paddingBottom: spacing.sm,
    gap: 2,
  },
  fullListOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 60,
  },
  unlocatedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: layout.radius.panel,
    borderWidth: 1,
    marginTop: 4,
  },
});
