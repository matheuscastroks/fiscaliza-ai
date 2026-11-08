import React, { useCallback, memo } from 'react';
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
}

function TerritoryListViewComponent({
  visible = true,
  asSheet = true,
  onClose,
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

  const countLabel =
    layers.length === 1 &&
    layers[0] === 'official' &&
    listed.length < totalCalls
      ? `${listed.length} de ${totalCalls.toLocaleString('pt-BR')}`
      : listed.length.toLocaleString('pt-BR');

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
                size={16}
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
    </View>
  );

  if (asSheet) {
    return (
      <AppBottomSheetModal
        visible={visible}
        onClose={() => onClose?.()}
        title={sectionHeading}
        snapPoints={['62%', '92%']}
        backdropOpacity={0.22}
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

const styles = StyleSheet.create({
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
