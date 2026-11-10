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

import { lightColors } from '@/theme/colors';

import { elevation } from '@/theme/elevation';

import { useTerritoryController } from '@/features/territory/useTerritoryController';



export default function TerritoryScreen() {
  return <TerritoryContent />;
}

export function TerritoryContent() {
  const styles = useThemedStyles(createStyles);
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
    summarySubLabel,
  } = useTerritoryController();

  return (
    <View style={[styles.container, !isFocused && mapPerformanceVariant !== 'visible-surface' && { display: 'none' }]}>
      <AppToast
        message={toastMessage}
        onDismiss={() => setToastMessage(null)}
        topOffset={insets.top + 130}
        type={locationError ? 'warning' : 'info'}
      />

      {mapAvailable && (
        <View style={StyleSheet.absoluteFill}>
          <MapboxMapView
            style={StyleSheet.absoluteFill}
            region={region}
            markers={allMapMarkers}
            boundary={boundary.data?.geometry}
            searchArea={mapOverlay.searchArea}
            deviceLocation={mapOverlay.deviceLocation}
            fitSearchArea={!focusId}
            selectedId={selectedId}
            selectedClusterIds={selectedCluster?.ids || null}
            isDark={mode === 'dark'}
            performanceDiagnostics={mapPerformanceEnabled}
            diagnosticTrace={visitTrace}
            onMarkerClick={handleMarkerClick}
            onClusterClick={handleClusterClick}
            onMapClick={handleMapClick}
            onRegionChange={handleRegionChange}
          />

          {officialCalls.isLoading && (
            <View style={[styles.loadingPill, { top: insets.top + 148 }]}>
              <ActivityIndicator size="small" color={lightColors.white} />
              <AppText variant="caption" style={{ color: lightColors.white, fontWeight: '600' }}>
                Carregando chamados...
              </AppText>
            </View>
          )}
        </View>
      )}

      {mapAvailable && (
        <View style={[styles.topFloatingHeader, { paddingTop: insets.top + spacing.xs }]}>
          <TerritoryFilterBar {...filterBarProps} />
        </View>
      )}

      {/* Botão Contextual Flutuante: Buscar Nesta Área (só aparece se moveu a câmera ou se área estiver ativa) */}
      {!effectiveListView && (hasMovedCamera || areaOnly) && (
        <View style={[styles.contextualAreaPillContainer, { top: insets.top + 108 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={areaOnly ? 'Voltar ao recorte selecionado' : 'Buscar nesta área'}
            style={({ pressed }) => [styles.areaPillButton, { backgroundColor: colors.surface }, pressed && styles.buttonPressed]}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (areaOnly) { setAreaOnly(false); setAppliedBounds(null); setHasMovedCamera(false); }
              else { setAppliedBounds(computeRegionBounds(viewportRef.current)); setAreaOnly(true); }
            }}
          >
            <Ionicons name={areaOnly ? 'globe-outline' : 'scan-outline'} size={layout.iconSize.sm} color={colors.ink} />
            <AppText variant="caption" style={{ fontWeight: '600' }}>
              {areaOnly ? 'Voltar ao recorte' : 'Buscar nesta área'}
            </AppText>
          </Pressable>
        </View>
      )}

      {/* Dock Vertical Direita: Controles Rápidos do Mapa (Posição e Enquadrar) */}
      {!effectiveListView && !selectedEntry && selectedClusterEntries.length === 0 && (
        <View style={[styles.rightMapDock, { bottom: insets.bottom + 160 }]}>
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
            accessibilityLabel="Enquadrar recorte"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              updateCameraRegion(municipalOverviewRegion);
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
        <View style={[styles.bottomFloatingContainer, { bottom: insets.bottom + 90 }]}>
          {/* Barra Contextual de Resultados e Acesso à Lista */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${summaryLabel}. ${summarySubLabel}`}
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
              <AppText variant="label" numberOfLines={1} style={styles.summaryTitle}>{summaryLabel}</AppText>
              <AppText variant="caption" color="muted" numberOfLines={1} style={styles.summarySubtitle}>{summarySubLabel}</AppText>
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
          bottomOffset={insets.bottom + 92}
        />
      )}

      {!effectiveListView && selectedClusterEntries.length === 1 && (
        <TerritoryPreviewCard
          entry={selectedClusterEntries[0]}
          onOpen={openEntry}
          onClose={() => setSelectedCluster(null)}
          bottomOffset={insets.bottom + 92}
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
          bottomOffset={insets.bottom + 92}
        />
      )}

      {effectiveListView && (
        <TerritoryListView
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
      gap: 8, backgroundColor: 'rgba(15, 23, 42, 0.85)', paddingHorizontal: 14, paddingVertical: 8,
      borderRadius: layout.radius.pill, zIndex: 40,
    },
    topFloatingHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50, paddingHorizontal: spacing.md, gap: 8 },
    contextualAreaPillContainer: { position: 'absolute', alignSelf: 'center', zIndex: 45 },
    rightMapDock: { position: 'absolute', right: spacing.md, zIndex: 40, gap: 10 },
    bottomFloatingContainer: { position: 'absolute', left: spacing.md, right: spacing.md, zIndex: 40, gap: 8 },
    dockCircleButton: {
      ...elevation.floating,
      width: 42, height: 42, borderRadius: layout.radius.panel, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    },
    areaPillButton: {
      ...elevation.floating,
      flexDirection: 'row', alignItems: 'center', gap: 6, height: 42, paddingHorizontal: spacing.md,
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
