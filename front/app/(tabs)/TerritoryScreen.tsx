import BottomSheet from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import type { CameraPadding } from '@/features/territory/useMapCamera';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { mapPerformanceEnabled, mapPerformanceVariant } from '@/features/territory/mapPerformance';

import { TerritoryFilterBar, TerritoryFilterModal } from '@/components/territory/TerritoryFilterBar';

import { TerritoryListView } from '@/components/territory/TerritoryListView';

import { computeRegionBounds, TERRITORY_PERIOD_OPTIONS } from '@/features/territory/selectors';

import { useThemedStyles } from '@/theme/useTheme';

import type { ThemeColors } from '@/theme/colors';
import type { ElevationTokens } from '@/theme/elevation';

import { Ionicons } from '@expo/vector-icons';

import { layout } from '@/theme/layout';

import { Pressable, StyleSheet, View, ActivityIndicator, BackHandler, Keyboard } from 'react-native';
import { useKeyboardState, useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import * as Haptics from 'expo-haptics';

import { router, useLocalSearchParams } from 'expo-router';

import { AppText } from '@/components/ui/AppText';

import { AppToast } from '@/components/ui/AppToast';

import { spacing } from '@/theme/spacing';

import { MapboxMapView } from '@/components/ui/MapboxMapView';

import { TerritoryPreviewCard } from '@/components/territory/TerritoryPreviewCard';
import { TerritoryClusterList } from '@/components/territory/TerritoryClusterList';
import type { Entry } from '@/components/territory/TerritoryPreviewCard';
import { belongsToSpatialCluster } from '@/features/territory/spatialFeatures';


import { fontSizes } from '@/theme/typography';

import { useTerritoryController } from '@/features/territory/useTerritoryController';



export default function TerritoryScreen() {
  return <TerritoryContent />;
}

export function TerritoryContent() {
  const styles = useThemedStyles(createStyles);
  const { territoryResults } = useLocalSearchParams<{ territoryResults?: string }>();
  // Altura real do cartão de resultados: os controles do mapa ficam sempre acima dele.
  const [summaryHeight, setSummaryHeight] = useState(110);
  const [headerHeight, setHeaderHeight] = useState(112);
  // Controles flutuantes ficam logo acima da barra de abas.
  const keyboardVisible = useKeyboardState((state) => state.isVisible);
  const { height: keyboardOffset } = useReanimatedKeyboardAnimation();
  const { barTop } = useTabBarInset();
  const floatBottom = keyboardVisible ? spacing.sm : barTop + spacing.sm;
  const {
    isFocused,
    colors,
    mode,
    insets,
    mapAvailable: nativeMapAvailable,
    listOffsetRef,
    listRef,
    restoreListOffsetRef,


    focusId,
    neighborhood,
    layers,
    boundary,
    region,
    viewportRef,
    updateCameraRegion,
    areaOnly,
    setAreaOnly,
    setAppliedBounds,
    hasMovedCamera,
    setHasMovedCamera,
    serviceType,
    macroTheme,
    period,
    status,
    setServiceType,
    setMacroTheme,
    setPeriod,
    setStatus,
    visitTrace,
    officialCalls,
    spatialMap,
    searchPending,
    clusterCell,
    setClusterCell,
    clusterCalls,
    setSearchFocusRequest,
    serviceTypeOptions,
    filtersOpen,
    setFiltersOpen,
    selectedId,
    setSelectedId,
    selectedCluster,
    setSelectedCluster,
    locating,
    locationError,
    mapOverlay,
    toastMessage,
    setToastMessage,

    unlocated,
    listed,
    selectedEntry,
    facilityPagination,
    selectedClusterEntries,
    municipalOverviewRegion,
    totalCalls,
    hasMoreCalls,
    dataReady,
    openEntry,
    handleLocateEntry,
    allMapMarkers,
    handleMarkerClick,
    handleClusterClick,
    handleMapClick: clearMapSelection,
    handleRegionChange,
    resetFilters,
    locate,
    refreshing,
    refreshAll,
    filterBarProps,
    summaryLabel,
    offline,
    waitingForLocation,
    summarySubLabel,
  } = useTerritoryController();

  // Enquadramentos deixam livres a barra de busca, o resumo e a barra de abas.
  const panel = useRef<BottomSheet>(null);
  const [mapFailed, setMapFailed] = useState(false);
  const [panelIndex, setPanelIndex] = useState(0);
  const mapAvailable = nativeMapAvailable && !mapFailed;
  const resultsOpen = mapAvailable && territoryResults === 'list';
  const avoidKeyboard = keyboardVisible && isFocused && mapAvailable && !filtersOpen && !resultsOpen;
  const keyboardPadding = useAnimatedStyle(() => ({
    paddingBottom: avoidKeyboard ? Math.max(0, -keyboardOffset.value) : 0,
  }));
  const closeResults = useCallback(() => router.setParams({ territoryResults: undefined }), []);
  const showCluster = Boolean(clusterCell || selectedClusterEntries.length);
  const handleMapClick = useCallback(() => {
    setClusterCell(null);
    clearMapSelection();
  }, [clearMapSelection, setClusterCell]);
  const collapsedPanelHeight = summaryHeight + spacing.md;
  const snapPoints = useMemo(() => [collapsedPanelHeight, '50%'], [collapsedPanelHeight]);
  const clusterEntries = useMemo<Entry[]>(() => clusterCell
    ? (clusterCalls.data?.calls ?? []).filter((item) => belongsToSpatialCluster(item, clusterCell))
      .map((item) => ({ type: 'official', item }))
    : selectedClusterEntries, [clusterCell, clusterCalls.data?.calls, selectedClusterEntries]);

  useEffect(() => {
    if (!mapAvailable || !showCluster) return;
    const sheet = panel.current;
    sheet?.snapToIndex(1);
    return () => sheet?.snapToIndex(0);
  }, [mapAvailable, showCluster]);

  useEffect(() => {
    if (!isFocused || !mapAvailable || filtersOpen || (!resultsOpen && !showCluster && !selectedEntry)) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (resultsOpen) closeResults();
      else handleMapClick();
      return true;
    });
    return () => subscription.remove();
  }, [closeResults, isFocused, mapAvailable, filtersOpen, showCluster, selectedEntry, resultsOpen, handleMapClick]);

  const locateListEntry = useCallback((entry: Parameters<typeof handleLocateEntry>[0]) => {
    closeResults();
    handleLocateEntry(entry);
  }, [closeResults, handleLocateEntry]);

  const cameraPadding = useMemo<CameraPadding>(() => [
    headerHeight + spacing.lg,
    spacing.xxl,
    floatBottom + collapsedPanelHeight + spacing.lg,
    spacing.xxl,
  ], [headerHeight, collapsedPanelHeight, floatBottom]);

  const territoryList = (
    <TerritoryListView
          locationPrompt={waitingForLocation ? { onUseLocation: () => { void locate(); } } : undefined}
          visible={isFocused}
          onBackToMap={resultsOpen ? closeResults : undefined}
          onRetryMap={mapFailed ? () => setMapFailed(false) : undefined}
          listRef={listRef}
          listOffsetRef={listOffsetRef}
          restoreListOffsetRef={restoreListOffsetRef}
          listed={listed} unlocatedCount={unlocated.length} areaOnly={areaOnly}
          layers={layers} totalCalls={totalCalls} hasMoreCalls={hasMoreCalls}
          offline={offline}
          dataReady={dataReady} refreshing={refreshing}
          onRefresh={() => { void refreshAll(); }} onOpenEntry={openEntry}
          onLocateEntry={mapAvailable ? locateListEntry : undefined} onResetFilters={resetFilters}
          officialQuery={{
            isLoading: officialCalls.isLoading, isFetching: officialCalls.isFetching,
            isFetchingNextPage: officialCalls.isFetchingNextPage, error: officialCalls.error,
            fetchStatus: officialCalls.fetchStatus, refetch: () => { void officialCalls.refetch(); },
            fetchNextPage: () => { void officialCalls.fetchNextPage(); },
          }}
          facilityPagination={facilityPagination}
          filterBarProps={filterBarProps}
        />
  );

  return (
    <Animated.View
      style={[styles.container, keyboardPadding, !isFocused && mapPerformanceVariant !== 'visible-surface' && { display: 'none' }]}
    >
      <View style={styles.container}>
      <AppToast
        message={toastMessage}
        onDismiss={() => setToastMessage(null)}
        topOffset={headerHeight + spacing.xs}
        type={locationError ? 'warning' : 'info'}
      />

      <View
        style={StyleSheet.absoluteFill}
        accessibilityElementsHidden={resultsOpen}
        importantForAccessibility={resultsOpen ? 'no-hide-descendants' : 'auto'}
        pointerEvents={resultsOpen ? 'none' : 'box-none'}
      >
      {mapAvailable && (
        <View style={StyleSheet.absoluteFill}>
          <MapboxMapView
            style={StyleSheet.absoluteFill}
            region={region}
            markers={searchPending ? [] : allMapMarkers}
            spatialCells={layers.includes('official') ? (searchPending ? [] : spatialMap.data?.cells ?? []) : undefined}
            onSpatialCellPress={(cell) => {
              clearMapSelection();
              setClusterCell(cell);
            }}
            onSpatialSelectionError={() => setToastMessage('Não foi possível abrir este agrupamento. Toque nele para tentar novamente.')}
            boundary={boundary.data?.geometry}
            searchArea={mapOverlay.searchArea}
            deviceLocation={mapOverlay.deviceLocation}
            fitSearchArea={!focusId}
            selectedId={selectedId}
            selectedClusterIds={selectedCluster?.ids || null}
            isDark={mode === 'dark'}
            cameraPadding={cameraPadding}
            accessibilityLabel={`Mapa de chamados. ${summaryLabel}`}
            accessibilityHint="Para navegar pelos resultados com leitor de tela, use o botão Ver lista"
            performanceDiagnostics={mapPerformanceEnabled}
            diagnosticTrace={visitTrace}
            onMarkerClick={(id) => {
              setClusterCell(null);
              handleMarkerClick(id);
            }}
            onClusterClick={(cluster) => {
              setClusterCell(null);
              handleClusterClick(cluster);
            }}
            onMapClick={handleMapClick}
            onInitialLoadError={() => {
              setMapFailed(true);
              closeResults();
            }}
            onRegionChange={handleRegionChange}
          />

          {!offline && officialCalls.isLoading && (
            <View
              accessibilityLiveRegion="polite"
              style={[styles.loadingPill, { top: headerHeight + spacing.sm }]}
            >
              <ActivityIndicator size="small" color={colors.onFloatingInk} />
              <AppText variant="caption" style={{ color: colors.onFloatingInk, fontWeight: '600' }}>
                Carregando chamados…
              </AppText>
            </View>
          )}

          {/* Faixa sob a barra de status: ícones legíveis sobre qualquer trecho do mapa. */}
          <LinearGradient
            pointerEvents="none"
            colors={[colors.statusScrim, colors.statusScrim, colors.transparent]}
            locations={[0, 0.6, 1]}
            style={[styles.statusScrim, { height: insets.top + spacing.lg }]}
          />
        </View>
      )}

      {mapAvailable && !resultsOpen && (
        <View
          onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
          style={[styles.topFloatingHeader, { paddingTop: insets.top + spacing.xs }]}
        >
          <TerritoryFilterBar
            {...filterBarProps}
            onSearchChange={(value) => {
              handleMapClick();
              filterBarProps.onSearchChange(value);
            }}
          />
        </View>
      )}

      {/* Botão Contextual Flutuante: Buscar Nesta Área (só aparece se moveu a câmera ou se área estiver ativa) */}
      {mapAvailable && panelIndex === 0 && (hasMovedCamera || areaOnly) && (
        <View style={[styles.contextualAreaPillContainer, { top: headerHeight + spacing.xs }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={areaOnly ? 'Voltar à área escolhida' : 'Buscar nesta área'}
            style={({ pressed }) => [styles.areaPillButton, { backgroundColor: colors.surfaceFloating }, pressed && styles.buttonPressed]}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (areaOnly) { setAreaOnly(false); setAppliedBounds(null); setHasMovedCamera(false); }
              else { setAppliedBounds(computeRegionBounds(viewportRef.current)); setAreaOnly(true); }
            }}
          >
            <Ionicons name={areaOnly ? 'globe-outline' : 'scan-outline'} size={layout.iconSize.sm} color={colors.ink} />
            <AppText variant="caption" style={{ fontWeight: '600' }}>
              {areaOnly ? 'Voltar à área' : 'Buscar nesta área'}
            </AppText>
          </Pressable>
        </View>
      )}

      {/* Dock Vertical Direita: Controles Rápidos do Mapa (Posição e Enquadrar) */}
      {mapAvailable && !keyboardVisible && panelIndex === 0 && !selectedEntry && selectedClusterEntries.length === 0 && (
        <View style={[styles.rightMapDock, { bottom: floatBottom + collapsedPanelHeight + spacing.sm }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Minha posição"
            accessibilityState={{ disabled: locating, busy: locating }}
            disabled={locating}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setHasMovedCamera(false);
              void locate();
            }}
            style={({ pressed }) => [styles.dockCircleButton, { backgroundColor: colors.surfaceFloating }, pressed && styles.buttonPressed]}
          >
            <Ionicons name="locate" size={layout.iconSize.md} color={locating ? colors.accent : colors.ink} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver a cidade toda"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Caixa nova: refaz o enquadramento mesmo se a região não mudou.
              updateCameraRegion({
                ...municipalOverviewRegion,
                bounds: municipalOverviewRegion.bounds ? { ...municipalOverviewRegion.bounds } : undefined,
              });
              setAreaOnly(false);
              setSelectedId(null);
              setSelectedCluster(null);
              setHasMovedCamera(false);
            }}
            style={({ pressed }) => [styles.dockCircleButton, { backgroundColor: colors.surfaceFloating }, pressed && styles.buttonPressed]}
          >
            <Ionicons name="expand-outline" size={layout.iconSize.md} color={colors.ink} />
          </Pressable>
        </View>
      )}

      {mapAvailable && selectedEntry && !showCluster && (
        <TerritoryPreviewCard
          entry={selectedEntry}
          onOpen={openEntry}
          onClose={handleMapClick}
          bottomOffset={floatBottom}
        />
      )}

      {mapAvailable && (
        <BottomSheet
          ref={panel}
          index={0}
          bottomInset={floatBottom}
          snapPoints={snapPoints}
          enableDynamicSizing={false}
          enableHandlePanningGesture={showCluster}
          enableContentPanningGesture={showCluster}
          animateOnMount={false}
          backgroundStyle={{ backgroundColor: showCluster ? colors.surfaceFloating : colors.transparent }}
          handleIndicatorStyle={{ backgroundColor: colors.muted }}
          onChange={(index) => {
            if (index < 0) return;
            setPanelIndex(index);
            if (showCluster && index === 0) {
              handleMapClick();
            }
          }}
          handleComponent={showCluster ? undefined : selectedEntry ? null : () => (
            <View style={styles.summaryInset} onLayout={(event) => setSummaryHeight(event.nativeEvent.layout.height)}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ver lista. ${summaryLabel}`}
            accessibilityHint={summarySubLabel}
            accessibilityLiveRegion="polite"
            onPress={() => {
              Keyboard.dismiss();
              setSearchFocusRequest(undefined);
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              restoreListOffsetRef.current = true;
              router.setParams({ territoryResults: 'list' });
            }}
            style={({ pressed }) => [styles.summaryBarButton, pressed && styles.buttonPressed]}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText variant="label" style={styles.summaryTitle}>
                Ver lista · {summaryLabel}
              </AppText>
              <AppText variant="caption" color="muted" style={styles.summarySubtitle}>{summarySubLabel}</AppText>
            </View>
            <Ionicons name="chevron-forward" size={layout.iconSize.md} color={colors.muted} />
          </Pressable>

            </View>
          )}
        >
          {showCluster && (
            <TerritoryClusterList
              key={clusterCell ? `cell:${clusterCell.key}:${clusterCell.latitude}:${clusterCell.longitude}` : selectedCluster?.ids.join(',')}
              entries={clusterEntries}
              offline={offline}
              total={clusterCell?.count ?? selectedClusterEntries.length}
              loading={Boolean(clusterCell && clusterCalls.isLoading)}
              loadingMore={Boolean(clusterCell && clusterCalls.isFetchingNextPage)}
              error={Boolean(clusterCell && clusterCalls.isError)}
              onOpen={openEntry}
              onClose={handleMapClick}
              onLoadMore={!offline && clusterCell && clusterCalls.hasNextPage && !clusterCalls.isFetching
                ? () => { void clusterCalls.fetchNextPage(); }
                : undefined}
              onRetry={() => { void clusterCalls.refetch(); }}
            />
          )}
        </BottomSheet>
      )}
      </View>
      {(!mapAvailable || resultsOpen) && territoryList}

      <TerritoryFilterModal
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onReset={resetFilters}
        neighborhood={neighborhood}
        macroTheme={macroTheme}
        onMacroThemeChange={(value) => { setMacroTheme(value); setSelectedId(null); }}
        serviceType={serviceType}
        serviceTypeOptions={serviceTypeOptions}
        onServiceTypeChange={(value) => { setServiceType(value); setSelectedId(null); }}
        status={status}
        onStatusChange={(value) => { setStatus(value); setSelectedId(null); }}
        period={period}
        periodOptions={TERRITORY_PERIOD_OPTIONS}
        onPeriodChange={(value) => { setPeriod(value); router.setParams({ startDate: undefined, endDate: undefined }); setSelectedId(null); }}
        areaOnly={areaOnly}
      />
      </View>
    </Animated.View>
  );
}

const createStyles = (colors: ThemeColors, elevation?: ElevationTokens) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.canvas },
    loadingPill: {
      ...elevation?.floating,
      position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center',
      gap: 8, backgroundColor: colors.floatingInk, paddingHorizontal: 14, paddingVertical: 8,
      borderRadius: layout.radius.control, zIndex: 40,
    },
    statusScrim: { position: 'absolute', top: 0, left: 0, right: 0 },
    topFloatingHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50, paddingHorizontal: spacing.md, gap: 8 },
    contextualAreaPillContainer: { position: 'absolute', alignSelf: 'center', zIndex: 45 },
    rightMapDock: { position: 'absolute', right: spacing.md, zIndex: 40, gap: 10 },
    bottomFloatingContainer: { position: 'absolute', left: spacing.md, right: spacing.md, zIndex: 40, gap: 8 },
    dockCircleButton: {
      ...elevation?.floating,
      width: layout.touchTarget.minWidth, height: layout.touchTarget.minHeight, borderRadius: layout.radius.panel, alignItems: 'center', justifyContent: 'center',
    },
    areaPillButton: {
      ...elevation?.floating,
      flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: layout.touchTarget.minHeight, paddingHorizontal: spacing.md,
      borderRadius: layout.radius.control,
    },
    summaryBarButton: {
      ...elevation?.floating,
      backgroundColor: colors.surfaceFloating,
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm + 4,
      paddingVertical: 10, borderRadius: layout.radius.card,
    },
    summaryInset: { marginHorizontal: spacing.md },
    summaryTitle: { fontSize: fontSizes.meta, fontWeight: '600' },
    summarySubtitle: { fontSize: fontSizes.caption },
    buttonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  });
