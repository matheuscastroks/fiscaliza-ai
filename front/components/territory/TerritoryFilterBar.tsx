import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import React, { memo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppSelect } from '@/components/ui/AppSelect';
import { CitySearch } from '@/components/ui/CitySearch';
import { SlidingTabs } from '@/components/ui/SlidingTabs';
import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';
import {
  type FacilityCategory,
  type SourceCoverage,
} from '@/shared/public-data';
import { layout, spacing } from '@/theme';
import { RadiusControl } from '@/features/places/RadiusControl';
import type { RadiusMeters } from '@/features/places/types';

export type TerritoryLayer = 'official' | 'school' | 'health' | 'square';

export interface FacilityLayerQuerySummary {
  isLoading: boolean;
  error: unknown;
  hasNextPage: boolean;
  fetchNextPage: () => unknown;
  refetch: () => unknown;
  data?: {
    pages: {
      items: unknown[];
      total: number | null;
      sources: SourceCoverage[];
    }[];
  };
}

export interface TerritoryFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onOpenFilters: () => void;
  filtersOpen: boolean;
  filterCount: number;
  bairroOptions: string[];
  neighborhood: string;
  neighborhoodId?: string;
  onNeighborhoodChange: (value: string) => void;
  serviceType: string;
  serviceTypeOptions: { value: string; label: string }[];
  onServiceTypeChange: (value: string) => void;
  period: string;
  periodOptions: { value: string; label: string }[];
  onPeriodChange: (value: string) => void;
  status: string;
  statusOptions: { value: string; label: string }[];
  onStatusChange: (value: string) => void;
  layers: TerritoryLayer[];
  onLayersChange: (layers: TerritoryLayer[]) => void;
  startDate?: string;
  endDate?: string;
  totalCalls: number;
  officialCallsStatus: {
    isLoading: boolean;
    error: unknown;
    displayedCount: number;
    total: number | null;
    territoryConfirmed?: boolean;
    sourceState?: string;
  };
  facilityQueries: Record<FacilityCategory, FacilityLayerQuerySummary>;
  facilitiesConfirmed: boolean;
  padded?: boolean;
  radiusMeters?: RadiusMeters;
  onRadiusChange?: (radius: RadiusMeters) => void;
  radiusLabel?: string;
}

function TerritoryFilterBarComponent({
  search,
  onSearchChange,
  onOpenFilters,
  filtersOpen,
  filterCount,
  bairroOptions,
  neighborhood,
  neighborhoodId,
  onNeighborhoodChange,
  layers,
  onLayersChange,
  totalCalls,
  officialCallsStatus,
  padded = false,
  radiusMeters,
  onRadiusChange,
  radiusLabel,
}: TerritoryFilterBarProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const toggleLayer = (layer: TerritoryLayer) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (layers.includes(layer)) {
      onLayersChange(layers.filter((l) => l !== layer));
    } else {
      onLayersChange([...layers, layer]);
    }
  };

  const callsLabel = officialCallsStatus.isLoading
    ? '...'
    : totalCalls > 999
      ? `${(totalCalls / 1000).toFixed(1)}k`
      : `${totalCalls}`;

  return (
    <View style={[styles.wrapper, padded && styles.paddedWrapper]}>
      {/* Barra de busca com botão de filtro integrado */}
      <View style={padded ? styles.paddedSection : styles.searchContainer}>
        <CitySearch
          value={search}
          onChangeText={onSearchChange}
          onFilters={onOpenFilters}
          expanded={filtersOpen}
          filterCount={filterCount}
        />
      </View>

      {/* Fileira única de chips rápidos (Bairro + Camadas + Mais Filtros) */}
      <View style={padded ? styles.paddedSection : undefined}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickChipsStrip}
        >
          {radiusMeters && onRadiusChange ? (
            <View style={styles.radiusPillContainer}>
              <RadiusControl
                value={radiusMeters}
                onChange={onRadiusChange}
                compact
              />
            </View>
          ) : null}
          {radiusLabel ? (
            <View style={styles.radiusBadge}>
              <Ionicons name="location-outline" size={13} color={colors.ink} />
              <AppText variant="caption" style={styles.radiusBadgeText}>
                {radiusLabel}
              </AppText>
            </View>
          ) : null}
          {/* Chip de Bairro */}
          {!radiusMeters && <NeighborhoodPicker
            compact
            options={bairroOptions}
            value={neighborhood}
            onChange={onNeighborhoodChange}
          />}

          {/* Chip Chamados 1746 */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Alternar chamados 1746, ${totalCalls} chamados`}
            accessibilityState={{ selected: layers.includes('official') }}
            onPress={() => toggleLayer('official')}
            style={({ pressed }) => [
              styles.chip,
              layers.includes('official') && styles.chipActive,
              pressed && styles.chipPressed,
            ]}
          >
            <Ionicons
              name={layers.includes('official') ? 'warning' : 'warning-outline'}
              size={15}
              color={
                layers.includes('official') ? colors.surface : colors.ink
              }
            />
            <AppText
              variant="caption"
              style={[
                styles.chipText,
                layers.includes('official') && styles.chipTextActive,
              ]}
            >
              1746 · {callsLabel}
            </AppText>
          </Pressable>

          {/* Chip Escolas */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Alternar camada de escolas"
            accessibilityState={{ selected: layers.includes('school') }}
            onPress={() => toggleLayer('school')}
            style={({ pressed }) => [
              styles.chip,
              layers.includes('school') && styles.chipActive,
              pressed && styles.chipPressed,
            ]}
          >
            <Ionicons
              name={layers.includes('school') ? 'school' : 'school-outline'}
              size={15}
              color={layers.includes('school') ? colors.surface : colors.ink}
            />
            <AppText
              variant="caption"
              style={[
                styles.chipText,
                layers.includes('school') && styles.chipTextActive,
              ]}
            >
              Escolas
            </AppText>
          </Pressable>

          {/* Chip Saúde */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Alternar camada de saúde"
            accessibilityState={{ selected: layers.includes('health') }}
            onPress={() => toggleLayer('health')}
            style={({ pressed }) => [
              styles.chip,
              layers.includes('health') && styles.chipActive,
              pressed && styles.chipPressed,
            ]}
          >
            <Ionicons
              name={layers.includes('health') ? 'medkit' : 'medkit-outline'}
              size={15}
              color={layers.includes('health') ? colors.surface : colors.ink}
            />
            <AppText
              variant="caption"
              style={[
                styles.chipText,
                layers.includes('health') && styles.chipTextActive,
              ]}
            >
              Saúde
            </AppText>
          </Pressable>

          {/* Chip Praças */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Alternar camada de praças"
            accessibilityState={{ selected: layers.includes('square') }}
            onPress={() => toggleLayer('square')}
            style={({ pressed }) => [
              styles.chip,
              layers.includes('square') && styles.chipActive,
              pressed && styles.chipPressed,
            ]}
          >
            <Ionicons
              name={layers.includes('square') ? 'leaf' : 'leaf-outline'}
              size={15}
              color={layers.includes('square') ? colors.surface : colors.ink}
            />
            <AppText
              variant="caption"
              style={[
                styles.chipText,
                layers.includes('square') && styles.chipTextActive,
              ]}
            >
              Praças
            </AppText>
          </Pressable>

          {/* Atalho para Conhecer Bairro quando selecionado */}
          {neighborhoodId && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ver página do bairro"
              onPress={() =>
                router.push({
                  pathname: '/NeighborhoodScreen',
                  params: { neighborhoodId },
                })
              }
              style={({ pressed }) => [
                styles.chip,
                styles.chipAccent,
                pressed && styles.chipPressed,
              ]}
            >
              <Ionicons
                name="arrow-forward-circle-outline"
                size={15}
                color={colors.accent}
              />
              <AppText
                variant="caption"
                style={[styles.chipText, { color: colors.accent, fontWeight: '700' }]}
              >
                Conhecer bairro
              </AppText>
            </Pressable>
          )}

          {/* Chip Mais Filtros */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir todos os filtros"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onOpenFilters();
            }}
            style={({ pressed }) => [
              styles.chip,
              filterCount > 0 && styles.chipFiltered,
              pressed && styles.chipPressed,
            ]}
          >
            <Ionicons
              name="options-outline"
              size={15}
              color={filterCount > 0 ? colors.surface : colors.ink}
            />
            <AppText
              variant="caption"
              style={[
                styles.chipText,
                filterCount > 0 && styles.chipTextActive,
              ]}
            >
              {filterCount > 0 ? `Filtros (${filterCount})` : 'Filtros'}
            </AppText>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

export const TerritoryFilterBar = memo(TerritoryFilterBarComponent);

export interface TerritoryFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onReset: () => void;
  bairroOptions: string[];
  neighborhood: string;
  onNeighborhoodChange: (value: string) => void;
  serviceType: string;
  serviceTypeOptions: { value: string; label: string }[];
  onServiceTypeChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  period: string;
  periodOptions: { value: string; label: string }[];
  onPeriodChange: (value: string) => void;
  areaOnly: boolean;
  onAreaOnlyChange: (nextArea: boolean) => void;
  totalCalls: number;
}

function TerritoryFilterModalComponent({
  visible,
  onClose,
  onReset,
  bairroOptions,
  neighborhood,
  onNeighborhoodChange,
  serviceType,
  serviceTypeOptions,
  onServiceTypeChange,
  status,
  onStatusChange,
  period,
  periodOptions,
  onPeriodChange,
  areaOnly,
  onAreaOnlyChange,
  totalCalls,
}: TerritoryFilterModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.filterModalSheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: Math.max(insets.bottom, spacing.md),
            },
          ]}
        >
          <View style={styles.sheetHandleBar}>
            <View
              style={[styles.sheetHandle, { backgroundColor: colors.divider }]}
            />
          </View>

          <View style={styles.filterModalHeader}>
            <AppText variant="sectionTitle" style={{ fontSize: 18 }}>
              Filtros do Território
            </AppText>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={[
                styles.closeButton,
                { backgroundColor: colors.surfaceSubdued },
              ]}
            >
              <Ionicons name="close" size={18} color={colors.ink} />
            </Pressable>
          </View>

          <View style={styles.filterModalBody}>
            <View style={styles.filterField}>
              <AppText
                variant="caption"
                color="muted"
                style={styles.filterLabel}
              >
                BAIRRO
              </AppText>
              <NeighborhoodPicker
                options={bairroOptions}
                value={neighborhood}
                onChange={onNeighborhoodChange}
              />
            </View>

            <View style={styles.filterField}>
              <AppText
                variant="caption"
                color="muted"
                style={styles.filterLabel}
              >
                TIPO DE SERVIÇO (CENTRAL 1746)
              </AppText>
              <AppSelect
                label="Tipo de serviço 1746"
                placeholder="Buscar tipo de serviço..."
                icon="construct-outline"
                defaultValue="all"
                options={serviceTypeOptions}
                value={serviceType}
                onChange={onServiceTypeChange}
              />
            </View>

            <View style={styles.filterField}>
              <AppText
                variant="caption"
                color="muted"
                style={styles.filterLabel}
              >
                SITUAÇÃO DO CHAMADO
              </AppText>
              <SlidingTabs
                label="Situação"
                scroll={false}
                edgeToEdge={false}
                options={[
                  { value: 'all', label: 'Todas' },
                  { value: 'Não Encerrado', label: 'Abertos' },
                  { value: 'Encerrado', label: 'Encerrados' },
                ]}
                value={status}
                onChange={onStatusChange}
              />
            </View>

            <View style={styles.filterField}>
              <AppText
                variant="caption"
                color="muted"
                style={styles.filterLabel}
              >
                PERÍODO DISPONÍVEL
              </AppText>
              <SlidingTabs
                label="Período"
                scroll={false}
                edgeToEdge={false}
                options={periodOptions}
                value={period}
                onChange={onPeriodChange}
              />
            </View>

            <View style={styles.filterField}>
              <AppText
                variant="caption"
                color="muted"
                style={styles.filterLabel}
              >
                RECORTE ESPACIAL
              </AppText>
              <SlidingTabs
                label="Recorte espacial"
                scroll={false}
                edgeToEdge={false}
                options={[
                  { value: 'all', label: 'Todo o Rio' },
                  { value: 'area', label: 'Área visível no mapa' },
                ]}
                value={areaOnly ? 'area' : 'all'}
                onChange={(value) => onAreaOnlyChange(value === 'area')}
              />
            </View>

            <View style={styles.filterActionsRow}>
              <AppButton
                title="Limpar tudo"
                variant="quiet"
                onPress={onReset}
              />
              <AppButton
                title={`Ver ${totalCalls.toLocaleString('pt-BR')} chamados`}
                variant="primary"
                onPress={onClose}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export const TerritoryFilterModal = memo(TerritoryFilterModalComponent);

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      gap: 6,
    },
    paddedWrapper: {
      paddingBottom: spacing.xs,
      backgroundColor: colors.canvas,
      zIndex: 10,
    },
    paddedSection: {
      paddingHorizontal: spacing.md,
    },
    searchContainer: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    quickChipsStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 2,
    },
    radiusPillContainer: {
      width: 250,
      justifyContent: 'center',
    },
    radiusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      height: 38,
      paddingHorizontal: 12,
      borderRadius: layout.radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    radiusBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.ink,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 38,
      paddingHorizontal: 12,
      borderRadius: layout.radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    chipActive: {
      backgroundColor: colors.ink,
      borderColor: colors.ink,
    },
    chipAccent: {
      backgroundColor: colors.surface,
      borderColor: colors.accent,
    },
    chipFiltered: {
      backgroundColor: colors.ink,
      borderColor: colors.ink,
    },
    chipPressed: {
      opacity: 0.8,
      transform: [{ scale: 0.96 }],
    },
    chipText: {
      fontWeight: '600',
      color: colors.ink,
      fontSize: 13,
    },
    chipTextActive: {
      color: colors.surface,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    filterModalSheet: {
      borderTopLeftRadius: layout.radius.sheet,
      borderTopRightRadius: layout.radius.sheet,
      paddingTop: spacing.xs,
    },
    sheetHandleBar: {
      alignItems: 'center',
      paddingVertical: 6,
    },
    sheetHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
    },
    filterModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xs,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterModalBody: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      gap: spacing.md,
    },
    filterField: {
      gap: 6,
    },
    filterLabel: {
      fontWeight: '700',
      letterSpacing: 0.5,
      fontSize: 11,
    },
    filterActionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.xs,
      paddingTop: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
    },
  });
