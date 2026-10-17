import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Problem } from '@/data/mockData';
import { useProblemsStore } from '@/stores/problemsStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { layout } from '@/theme/layout';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { StatusText } from '@/components/occurrences/StatusText';
import { OccurrenceRow } from '@/components/occurrences/OccurrenceRow';
import { useOccurrenceFilters, StatusFilterOption } from '@/features/map/useOccurrenceFilters';
import { useMapRegion } from '@/features/map/useMapRegion';

let MapView: any = null;
let Marker: any = null;

if (Platform.OS !== 'web') {
  try {
    const ReactNativeMaps = require('react-native-maps');
    MapView = ReactNativeMaps?.default ?? null;
    Marker = ReactNativeMaps?.Marker ?? null;
  } catch {
    MapView = null;
    Marker = null;
  }
}

const isMapAvailable = Platform.OS !== 'web' && Boolean(MapView) && Boolean(Marker);

const FILTER_ITEMS: { id: StatusFilterOption; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'pending', label: 'Recebidas' },
  { id: 'in_progress', label: 'Em atendimento' },
  { id: 'resolved', label: 'Concluídas' },
];

export default function MapScreen() {
  const { problems, loadProblems, isLoading } = useProblemsStore();
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);

  const {
    statusFilter,
    setStatusFilter,
    filteredProblems,
  } = useOccurrenceFilters(problems);

  const {
    region,
    setRegion,
    centerOnUser,
    isLoadingLocation,
  } = useMapRegion(problems);

  useEffect(() => {
    loadProblems();
  }, [loadProblems]);

  // Se houver problemas e nenhum selecionado, seleciona o primeiro para contexto
  useEffect(() => {
    if (filteredProblems.length > 0 && !selectedProblemId) {
      setSelectedProblemId(filteredProblems[0].id);
    } else if (filteredProblems.length > 0 && !filteredProblems.some(p => p.id === selectedProblemId)) {
      setSelectedProblemId(filteredProblems[0].id);
    }
  }, [filteredProblems, selectedProblemId]);

  const selectedProblem = filteredProblems.find(p => p.id === selectedProblemId) || null;

  const handleMarkerPress = useCallback((problem: Problem) => {
    setSelectedProblemId(problem.id);
  }, []);

  const getMarkerPinColor = (status: Problem['status']) => {
    switch (status) {
      case 'resolved':
        return colors.completed;
      case 'in_progress':
        return colors.attention;
      case 'pending':
      default:
        return colors.risk;
    }
  };

  return (
    <AppScreen edges={['top']} style={styles.screen}>
      {/* Cabeçalho Territorial Superior */}
      <View style={styles.topHeader}>
        <View style={styles.territoryContext}>
          <AppText variant="caption" color="muted">
            Vila Esperança · ambiente demonstrativo
          </AppText>
          <AppText variant="sectionTitle" color="ink">
            {filteredProblems.length} {filteredProblems.length === 1 ? 'ocorrência' : 'ocorrências'} na região
          </AppText>
        </View>

        <TouchableOpacity
          style={styles.locateButton}
          onPress={centerOnUser}
          disabled={isLoadingLocation}
          accessibilityRole="button"
          accessibilityLabel="Centralizar em minha posição"
        >
          {isLoadingLocation ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <MaterialIcons name="my-location" size={20} color={colors.accent} />
          )}
        </TouchableOpacity>
      </View>

      {/* Barra de Filtros Sóbria */}
      <View style={styles.filtersBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScrollContent}
        >
          {FILTER_ITEMS.map((item) => {
            const isSelected = statusFilter === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipSelected,
                ]}
                onPress={() => setStatusFilter(item.id)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <AppText
                  variant="caption"
                  color={isSelected ? 'white' : 'muted'}
                  style={styles.filterChipText}
                >
                  {item.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Superfície do Mapa / Fallback Web */}
      <View style={styles.mapContainer}>
        {isMapAvailable ? (
          <MapView
            style={styles.map}
            region={region}
            onRegionChangeComplete={setRegion}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {filteredProblems.map((problem) => {
              const isSelected = problem.id === selectedProblemId;
              const pinColor = getMarkerPinColor(problem.status);

              return (
                <Marker
                  key={problem.id}
                  coordinate={{
                    latitude: problem.location.latitude,
                    longitude: problem.location.longitude,
                  }}
                  pinColor={pinColor}
                  onPress={() => handleMarkerPress(problem)}
                  title={problem.title}
                  description={problem.location.address}
                />
              );
            })}
          </MapView>
        ) : (
          <View style={styles.fallbackContainer}>
            <View style={styles.fallbackHeader}>
              <MaterialIcons name="map" size={28} color={colors.subtle} />
              <AppText variant="label" color="ink" style={styles.fallbackTitle}>
                Visualização em Lista (Modo Web)
              </AppText>
              <AppText variant="caption" color="muted">
                O mapa nativo interativo opera nos aplicativos Android e iOS.
              </AppText>
            </View>

            <ScrollView style={styles.fallbackList}>
              {filteredProblems.map((problem) => (
                <OccurrenceRow
                  key={problem.id}
                  problem={problem}
                  onPress={() => router.push(`/ProblemDetailsScreen?id=${problem.id}`)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Botão de Registro Flutuante */}
        <TouchableOpacity
          style={styles.floatingRegisterButton}
          onPress={() => router.push('/(tabs)/ReportScreen')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Registrar nova ocorrência"
        >
          <MaterialIcons name="add" size={20} color={colors.white} />
          <AppText variant="label" color="white" style={styles.registerButtonText}>
            Registrar ocorrência
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Painel Inferior de Ocorrência Selecionada (Peek Contextual) */}
      {selectedProblem ? (
        <View style={styles.selectedProblemCard}>
          <View style={styles.cardHeader}>
            <StatusText status={selectedProblem.status} />
            <AppText variant="caption" color="muted">
              {selectedProblem.location.address}
            </AppText>
          </View>

          <AppText variant="label" color="ink" style={styles.problemTitle} numberOfLines={1}>
            {selectedProblem.title}
          </AppText>

          <View style={styles.cardActionsRow}>
            <AppButton
              title="Ver detalhes da ocorrência →"
              variant="quiet"
              onPress={() => router.push(`/ProblemDetailsScreen?id=${selectedProblem.id}`)}
              style={styles.detailButton}
            />
          </View>
        </View>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.contentPadding,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: layout.borderWidth.hairline,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
  },
  territoryContext: {
    flex: 1,
  },
  locateButton: {
    width: 36,
    height: 36,
    borderRadius: layout.radius.button,
    backgroundColor: colors.surfaceSubdued,
    borderWidth: layout.borderWidth.hairline,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  filtersBar: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
    borderBottomWidth: layout.borderWidth.hairline,
    borderBottomColor: colors.divider,
  },
  filtersScrollContent: {
    paddingHorizontal: spacing.contentPadding,
    columnGap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: layout.radius.pill,
    backgroundColor: colors.surfaceSubdued,
    borderWidth: layout.borderWidth.hairline,
    borderColor: colors.divider,
  },
  filterChipSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  filterChipText: {
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.surfaceSubdued,
  },
  map: {
    ...StyleSheet.absoluteFill as any,
  },
  fallbackContainer: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  fallbackHeader: {
    padding: spacing.md,
    alignItems: 'center',
    borderBottomWidth: layout.borderWidth.hairline,
    borderBottomColor: colors.divider,
  },
  fallbackTitle: {
    marginVertical: spacing.xxs,
  },
  fallbackList: {
    flex: 1,
  },
  floatingRegisterButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: layout.radius.button,
    minHeight: layout.touchTarget.minHeight,
  },
  registerButtonText: {
    marginLeft: spacing.xxs,
  },
  selectedProblemCard: {
    backgroundColor: colors.surface,
    borderTopWidth: layout.borderWidth.hairline,
    borderTopColor: colors.divider,
    paddingHorizontal: spacing.contentPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  problemTitle: {
    marginBottom: spacing.xs,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  detailButton: {
    paddingHorizontal: 0,
    minHeight: 32,
  },
});
