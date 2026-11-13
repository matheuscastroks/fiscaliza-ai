import { useMemo, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import type { CameraPadding } from '@/features/territory/useMapCamera';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { mapPerformanceEnabled, mapPerformanceVariant } from '@/features/territory/mapPerformance';

import { TerritoryFilterBar, TerritoryFilterModal } from '@/components/territory/TerritoryFilterBar';

import { TerritoryListView } from '@/components/territory/TerritoryListView';

import { computeRegionBounds, TERRITORY_PERIOD_OPTIONS } from '@/features/territory/selectors';

import { useThemedStyles } from '@/theme/useTheme';

import type { ThemeColors } from '@/theme/colors';

import { Ionicons } from '@expo/vector-icons';

import { layout } from '@/theme/layout';

import { Pressable, StyleSheet, View, ActivityIndicator } from 'react-native';

import * as Haptics from 'expo-haptics';

import { router } from 'expo-router';

import { AppText } from '@/components/ui/AppText';

import { AppToast } from '@/components/ui/AppToast';

import { spacing } from '@/theme/spacing';

import { MapboxMapView } from '@/components/ui/MapboxMapView';

import { TerritoryPreviewCard } from '@/components/territory/TerritoryPreviewCard';
import { TerritoryClusterCarousel } from '@/components/territory/TerritoryClusterCarousel';

import { FacilityLoadMoreButton } from '@/components/territory/FacilityLoadMoreButton';

import { fontSizes } from '@/theme/typography';

import { elevation } from '@/theme/elevation';

import { useTerritoryController } from '@/features/territory/useTerritoryController';



export default function TerritoryScreen() {
  return <TerritoryContent />;
}

export function TerritoryContent() {
  const styles = useThemedStyles(createStyles);
  // Altura real do cartão de resultados: os controles do mapa ficam sempre acima dele.
  const [summaryHeight, setSummaryHeight] = useState(110);
  const [headerHeight, setHeaderHeight] = useState(112);
  // Controles flutuantes ficam logo acima da barra de abas.
  const floatBottom = useTabBarInset().barTop + spacing.sm;
  const {
    isFocused,
    colors,
    mode,
    insets,
    mapAvailable,
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
    setIsListView,
    effectiveListView,
    visitTrace,
    officialCalls,
    spatialMap,
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
    handleMapClick,
    handleRegionChange,
    resetFilters,
    locate,
    refreshing,
    refreshAll,
    filterBarProps,
    summaryLabel,
    waitingForLocation,
    summarySubLabel,
  } = useTerritoryController();

  // Enquadramentos deixam livres a barra de busca, o resumo e a barra de abas.
  const cameraPadding = useMemo<CameraPadding>(() => [
    headerHeight + spacing.lg,
    spacing.xxl,
    floatBottom + summaryHeight + spacing.lg,
    spacing.xxl,
  ], [headerHeight, summaryHeight, floatBottom]);

  return (
    <View style={[styles.container, !isFocused && mapPerformanceVariant !== 'visible-surface' && { display: 'none' }]}>
      <AppToast
        message={toastMessage}
        onDismiss={() => setToastMessage(null)}
        topOffset={headerHeight + spacing.xs}
        type={locationError ? 'warning' : 'info'}
      />

      {mapAvailable && (
        <View style={StyleSheet.absoluteFill}>
          <MapboxMapView
            style={StyleSheet.absoluteFill}
            region={region}
            markers={allMapMarkers}
            spatialCells={layers.includes('official') ? spatialMap.data?.cells ?? [] : undefined}
            onSpatialCellPress={cell => updateCameraRegion({
              latitude: cell.latitude, longitude: cell.longitude, latitudeDelta: Math.max(0.00004, cell.north - cell.south), longitudeDelta: Math.max(0.00004, cell.east - cell.west), zoom: Math.min(19, (region.zoom ?? 12) + 2),
              bounds: { northEast: [cell.east + 0.00002, cell.north + 0.00002], southWest: [cell.west - 0.00002, cell.south - 0.00002] },
            })}
            boundary={boundary.data?.geometry}
            searchArea={mapOverlay.searchArea}
            deviceLocation={mapOverlay.deviceLocation}
            fitSearchArea={!focusId}
            selectedId={selectedId}
            selectedClusterIds={selectedCluster?.ids || null}
            isDark={mode === 'dark'}
            cameraPadding={cameraPadding}
            accessibilityLabel={`Mapa de chamados. ${summaryLabel}`}
            accessibilityHint="Para navegar pelos chamados com leitor de tela, use o botão Ver em lista"
            performanceDiagnostics={mapPerformanceEnabled}
            diagnosticTrace={visitTrace}
            onMarkerClick={handleMarkerClick}
            onClusterClick={handleClusterClick}
            onMapClick={handleMapClick}
            onRegionChange={handleRegionChange}
          />

          {officialCalls.isLoading && (
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

      {mapAvailable && (
        <View
          onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
          style={[styles.topFloatingHeader, { paddingTop: insets.top + spacing.xs }]}
        >
          <TerritoryFilterBar {...filterBarProps} />
        </View>
      )}

      {/* Botão Contextual Flutuante: Buscar Nesta Área (só aparece se moveu a câmera ou se área estiver ativa) */}
      {!effectiveListView && (hasMovedCamera || areaOnly) && (
        <View style={[styles.contextualAreaPillContainer, { top: headerHeight + spacing.xs }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={areaOnly ? 'Voltar à área escolhida' : 'Buscar nesta área'}
            style={({ pressed }) => [styles.areaPillButton, { backgroundColor: colors.surface }, pressed && styles.buttonPressed]}
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
      {!effectiveListView && !selectedEntry && selectedClusterEntries.length === 0 && (
        <View style={[styles.rightMapDock, { bottom: floatBottom + summaryHeight + spacing.sm }]}>
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
            style={({ pressed }) => [styles.dockCircleButton, { backgroundColor: colors.surface }, pressed && styles.buttonPressed]}
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
            style={({ pressed }) => [styles.dockCircleButton, { backgroundColor: colors.surface }, pressed && styles.buttonPressed]}
          >
            <Ionicons name="expand-outline" size={layout.iconSize.md} color={colors.ink} />
          </Pressable>
        </View>
      )}

      {!effectiveListView && !selectedEntry && selectedClusterEntries.length === 0 && (
        <View
          onLayout={(event) => setSummaryHeight(event.nativeEvent.layout.height)}
          style={[styles.bottomFloatingContainer, { bottom: floatBottom }]}
        >
          {/* Barra Contextual de Resultados e Acesso à Lista */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${summaryLabel}. ${summarySubLabel}`}
            accessibilityLiveRegion="polite"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsListView(true);
            }}
            style={({ pressed }) => [styles.summaryBarButton, { backgroundColor: colors.surface }, pressed && styles.buttonPressed]}
          >
            <View style={[styles.summaryIconCircle, { backgroundColor: colors.surfaceSubdued }]}>
              <Ionicons name="list-outline" size={layout.iconSize.md} color={colors.onSurfaceBrand} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText variant="label" numberOfLines={2} maxFontSizeMultiplier={1.3} style={styles.summaryTitle}>{summaryLabel}</AppText>
              <AppText variant="caption" color="muted" numberOfLines={2} maxFontSizeMultiplier={1.3} style={styles.summarySubtitle}>{summarySubLabel}</AppText>
            </View>
            <Ionicons name="chevron-forward" size={layout.iconSize.md} color={colors.muted} />
          </Pressable>

          {facilityPagination?.hasMore && (
            <FacilityLoadMoreButton
              label={facilityPagination.label}
              loadedCount={facilityPagination.loadedCount}
              totalKnown={facilityPagination.totalKnown}
              isFetching={facilityPagination.isFetchingNextPage}
              onPress={facilityPagination.fetchNextPage}
            />
          )}
        </View>
      )}

      {!effectiveListView && selectedClusterEntries.length > 1 && (
        <TerritoryClusterCarousel
          entries={selectedClusterEntries}
          onOpen={openEntry}
          onClose={() => setSelectedCluster(null)}
          onZoomCluster={() => {
            if (selectedCluster) {
              const targetLat = selectedCluster.latitude;
              const targetLng = selectedCluster.longitude;
              setSelectedCluster(null);
              updateCameraRegion((curr) => ({
                ...curr,
                latitude: targetLat,
                longitude: targetLng,
                zoom: Math.max(16, Math.min(18, (curr.zoom ?? 14) + 2)),
              }));
            }
          }}
          bottomOffset={floatBottom}
        />
      )}

      {!effectiveListView && selectedClusterEntries.length === 1 && (
        <TerritoryPreviewCard
          entry={selectedClusterEntries[0]}
          onOpen={openEntry}
          onClose={() => setSelectedCluster(null)}
          bottomOffset={floatBottom}
        />
      )}

      {!effectiveListView && selectedClusterEntries.length === 0 && selectedEntry && (
        <TerritoryPreviewCard
          entry={selectedEntry}
          onOpen={openEntry}
          onClose={() => {
            setSelectedId(null);
            if (focusId) router.setParams({ focusId: undefined });
          }}
          bottomOffset={floatBottom}
        />
      )}

      {effectiveListView && (
        <TerritoryListView
          locationPrompt={waitingForLocation ? { onUseLocation: () => { void locate(); } } : undefined}
          visible={isFocused}
          asSheet={mapAvailable}
          onClose={() => setIsListView(false)}
          listRef={listRef}
          listOffsetRef={listOffsetRef}
          restoreListOffsetRef={restoreListOffsetRef}
          listed={listed} unlocatedCount={unlocated.length} areaOnly={areaOnly}
          layers={layers} totalCalls={totalCalls} hasMoreCalls={hasMoreCalls}
          dataReady={dataReady} refreshing={refreshing}
          onRefresh={() => { void refreshAll(); }} onOpenEntry={openEntry}
          onLocateEntry={mapAvailable ? handleLocateEntry : undefined} onResetFilters={resetFilters}
          officialQuery={{
            isLoading: officialCalls.isLoading, isFetching: officialCalls.isFetching,
            isFetchingNextPage: officialCalls.isFetchingNextPage, error: officialCalls.error,
            fetchStatus: officialCalls.fetchStatus, refetch: () => { void officialCalls.refetch(); },
            fetchNextPage: () => { void officialCalls.fetchNextPage(); },
          }}
          facilityPagination={facilityPagination}
          filterBarProps={filterBarProps}
        />
      )}

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
        totalCalls={totalCalls}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.canvas },
    loadingPill: {
      ...elevation.floating,
      position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center',
      gap: 8, backgroundColor: colors.floatingInk, paddingHorizontal: 14, paddingVertical: 8,
      borderRadius: layout.radius.pill, zIndex: 40,
    },
    statusScrim: { position: 'absolute', top: 0, left: 0, right: 0 },
    topFloatingHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50, paddingHorizontal: spacing.md, gap: 8 },
    contextualAreaPillContainer: { position: 'absolute', alignSelf: 'center', zIndex: 45 },
    rightMapDock: { position: 'absolute', right: spacing.md, zIndex: 40, gap: 10 },
    bottomFloatingContainer: { position: 'absolute', left: spacing.md, right: spacing.md, zIndex: 40, gap: 8 },
    dockCircleButton: {
      ...elevation.floating,
      width: layout.touchTarget.minWidth, height: layout.touchTarget.minHeight, borderRadius: layout.radius.panel, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    },
    areaPillButton: {
      ...elevation.floating,
      flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: layout.touchTarget.minHeight, paddingHorizontal: spacing.md,
      borderRadius: layout.radius.pill, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    },
    summaryBarButton: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm + 4,
      paddingVertical: 10, borderRadius: layout.radius.card, borderWidth: 1, borderColor: colors.border,
    },
    summaryIconCircle: { width: 36, height: 36, borderRadius: layout.radius.panel, alignItems: 'center', justifyContent: 'center' },
    summaryTitle: { fontSize: fontSizes.meta, fontWeight: '600' },
    summarySubtitle: { fontSize: fontSizes.caption },
    buttonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  });
