import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import React, { memo, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { AppSelect } from '@/components/ui/AppSelect';
import {
  AppBottomSheetModal,
  BottomSheetScrollView,
} from '@/components/ui/AppBottomSheetModal';
import { CitySearch } from '@/components/ui/CitySearch';
import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';
import {
  type FacilityCategory,
  type SourceCoverage,
} from '@/shared/public-data';
import { layout, spacing } from '@/theme';
import { RadiusControl } from '@/features/places/RadiusControl';
import type { RadiusMeters } from '@/features/places/types';
import { useTerritoryViewMode } from '@/stores/territoryStore';

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
  filterCount,
  neighborhood,
  radiusLabel,
  layers,
  padded = false,
}: TerritoryFilterBarProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { isListView, toggleViewMode } = useTerritoryViewMode();

  const hasActiveFilters =
    filterCount > 0 ||
    Boolean(neighborhood) ||
    Boolean(radiusLabel) ||
    layers.length > 1 ||
    !layers.includes('official');

  return (
    <View style={[styles.wrapper, padded && styles.paddedWrapper]}>
      {/* Barra de busca com botão integrado de alternância Lista / Mapa */}
      <View style={padded ? styles.paddedSection : styles.searchContainer}>
        <CitySearch
          value={search}
          onChangeText={onSearchChange}
          onAction={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleViewMode();
          }}
          actionIcon={isListView ? 'map-outline' : 'list-outline'}
          actionLabel={isListView ? 'Ver no mapa' : 'Ver em lista'}
          actionActive={isListView}
        />
      </View>

      {/* Indicador minimalista e discreto de filtros ativos (quando houver) */}
      {hasActiveFilters && (
        <View style={padded ? styles.paddedSection : styles.activeBadgeWrapper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir filtros do território"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onOpenFilters();
            }}
            style={({ pressed }) => [
              styles.activeFilterPill,
              pressed && styles.activeFilterPillPressed,
            ]}
          >
            <Ionicons name="options" size={13} color={colors.accent} />
            <AppText variant="caption" style={styles.activeFilterText}>
              {neighborhood ? neighborhood : 'Filtros ativos'}
              {filterCount > 0 ? ` (${filterCount})` : ''}
            </AppText>
            {radiusLabel ? (
              <AppText variant="caption" color="muted" style={styles.activeFilterSubtext}>
                · {radiusLabel}
              </AppText>
            ) : null}
            <Ionicons name="chevron-forward" size={12} color={colors.muted} />
          </Pressable>
        </View>
      )}
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
  layers?: TerritoryLayer[];
  onLayersChange?: (layers: TerritoryLayer[]) => void;
  radiusMeters?: RadiusMeters;
  onRadiusChange?: (radius: RadiusMeters) => void;
  radiusLabel?: string;
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
  layers = ['official'],
  onLayersChange,
  radiusMeters,
  onRadiusChange,
  radiusLabel,
}: TerritoryFilterModalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const snapPoints = useMemo(() => ['82%', '95%'], []);

  const toggleLayer = (layer: TerritoryLayer) => {
    if (!onLayersChange) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (layers.includes(layer)) {
      onLayersChange(layers.filter((l) => l !== layer));
    } else {
      onLayersChange([...layers, layer]);
    }
  };

  const callsLabel = totalCalls > 999
    ? `${(totalCalls / 1000).toFixed(1)}k`
    : `${totalCalls}`;

  const LAYER_CONFIGS: {
    id: TerritoryLayer;
    label: string;
    sublabel: string;
    icon: keyof typeof Ionicons.glyphMap;
    activeColor: string;
  }[] = [
    {
      id: 'official',
      label: 'Chamados 1746',
      sublabel: 'Serviços e zeladoria urbana',
      icon: 'warning',
      activeColor: colors.accent,
    },
    {
      id: 'school',
      label: 'Escolas',
      sublabel: 'Educação pública municipal',
      icon: 'school',
      activeColor: '#2563EB',
    },
    {
      id: 'health',
      label: 'Saúde',
      sublabel: 'Postos, UPAs e hospitais',
      icon: 'medkit',
      activeColor: '#16A34A',
    },
    {
      id: 'square',
      label: 'Praças e Lazer',
      sublabel: 'Parques e áreas públicas',
      icon: 'leaf',
      activeColor: '#059669',
    },
  ];

  return (
    <AppBottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Filtros do Território"
      snapPoints={snapPoints}
    >
      <BottomSheetScrollView
        style={styles.filterModalScroll}
        contentContainerStyle={styles.filterModalBody}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Seção 1: Camadas no Mapa */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="layers" size={14} color={colors.accent} />
            <AppText variant="caption" style={styles.sectionTitle}>
              Camadas Visíveis no Mapa
            </AppText>
          </View>
          <AppText variant="caption" color="muted" style={styles.sectionDesc}>
            Escolha as informações e equipamentos públicos a exibir:
          </AppText>

          <View style={styles.layerCardsGrid}>
            {LAYER_CONFIGS.map((cfg) => {
              const isSelected = layers.includes(cfg.id);
              return (
                <Pressable
                  key={cfg.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Camada ${cfg.label}`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => toggleLayer(cfg.id)}
                  style={({ pressed }) => [
                    styles.layerCard,
                    isSelected && styles.layerCardSelected,
                    pressed && styles.layerCardPressed,
                  ]}
                >
                  <View style={styles.layerCardHeader}>
                    <View
                      style={[
                        styles.layerIconBadge,
                        { backgroundColor: isSelected ? cfg.activeColor : colors.border },
                      ]}
                    >
                      <Ionicons
                        name={cfg.icon}
                        size={16}
                        color={isSelected ? '#FFFFFF' : colors.muted}
                      />
                    </View>
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={isSelected ? cfg.activeColor : colors.muted}
                    />
                  </View>
                  <View style={styles.layerCardContent}>
                    <AppText
                      variant="caption"
                      style={[
                        styles.layerCardTitle,
                        isSelected && { color: colors.ink, fontWeight: '700' },
                      ]}
                    >
                      {cfg.label}
                    </AppText>
                    <AppText
                      variant="caption"
                      color="muted"
                      style={styles.layerCardDesc}
                      numberOfLines={1}
                    >
                      {cfg.id === 'official' && totalCalls > 0
                        ? `${callsLabel} chamados`
                        : cfg.sublabel}
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Seção 2: Localização e Território */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="location" size={14} color={colors.accent} />
            <AppText variant="caption" style={styles.sectionTitle}>
              Localização e Recorte
            </AppText>
          </View>

          <View style={styles.filterSubfield}>
            <AppText variant="caption" color="muted" style={styles.fieldSubLabel}>
              Bairro
            </AppText>
            <NeighborhoodPicker
              options={bairroOptions}
              value={neighborhood}
              onChange={onNeighborhoodChange}
            />
            {neighborhood ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => onNeighborhoodChange('')}
                style={styles.clearLink}
              >
                <Ionicons name="close-circle-outline" size={13} color={colors.accent} />
                <AppText variant="caption" style={styles.clearLinkText}>
                  Ver município inteiro (limpar bairro)
                </AppText>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.filterSubfield}>
            <AppText variant="caption" color="muted" style={styles.fieldSubLabel}>
              Abrangência territorial
            </AppText>
            <View style={styles.segmentContainer}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: !areaOnly }}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onAreaOnlyChange(false);
                }}
                style={[styles.segmentButton, !areaOnly && styles.segmentButtonActive]}
              >
                <Ionicons
                  name="globe-outline"
                  size={14}
                  color={!areaOnly ? colors.surface : colors.ink}
                  style={{ marginRight: 6 }}
                />
                <AppText
                  variant="caption"
                  style={[styles.segmentText, !areaOnly && styles.segmentTextActive]}
                >
                  Todo o Rio
                </AppText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: areaOnly }}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onAreaOnlyChange(true);
                }}
                style={[styles.segmentButton, areaOnly && styles.segmentButtonActive]}
              >
                <Ionicons
                  name="scan-outline"
                  size={14}
                  color={areaOnly ? colors.surface : colors.ink}
                  style={{ marginRight: 6 }}
                />
                <AppText
                  variant="caption"
                  style={[styles.segmentText, areaOnly && styles.segmentTextActive]}
                >
                  Área no mapa
                </AppText>
              </Pressable>
            </View>
          </View>

          {radiusMeters && onRadiusChange ? (
            <View style={styles.filterSubfield}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <AppText variant="caption" color="muted" style={styles.fieldSubLabel}>
                  Raio de busca no entorno
                </AppText>
                {radiusLabel ? (
                  <AppText variant="caption" color="muted" style={{ fontSize: 11 }}>
                    ({radiusLabel})
                  </AppText>
                ) : null}
              </View>
              <RadiusControl
                value={radiusMeters}
                onChange={onRadiusChange}
                compact
              />
            </View>
          ) : null}
        </View>

        {/* Seção 3: Filtros de Chamados 1746 */}
        {layers.includes('official') && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="construct" size={14} color={colors.accent} />
              <AppText variant="caption" style={styles.sectionTitle}>
                Filtros dos Chamados 1746
              </AppText>
            </View>

            <View style={styles.filterSubfield}>
              <AppText variant="caption" color="muted" style={styles.fieldSubLabel}>
                Tipo de serviço
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

            <View style={styles.filterSubfield}>
              <AppText variant="caption" color="muted" style={styles.fieldSubLabel}>
                Situação do chamado
              </AppText>
              <View style={styles.segmentContainer}>
                {[
                  { value: 'all', label: 'Todas' },
                  { value: 'Não Encerrado', label: 'Abertos' },
                  { value: 'Encerrado', label: 'Encerrados' },
                ].map((opt) => {
                  const isSelected = status === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onStatusChange(opt.value);
                      }}
                      style={[
                        styles.segmentButton,
                        isSelected && styles.segmentButtonActive,
                      ]}
                    >
                      <AppText
                        variant="caption"
                        style={[
                          styles.segmentText,
                          isSelected && styles.segmentTextActive,
                        ]}
                      >
                        {opt.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.filterSubfield}>
              <AppText variant="caption" color="muted" style={styles.fieldSubLabel}>
                Período
              </AppText>
              <View style={styles.wrapChipsRow}>
                {periodOptions.map((opt) => {
                  const isSelected = period === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onPeriodChange(opt.value);
                      }}
                      style={[
                        styles.periodChip,
                        isSelected && styles.periodChipActive,
                      ]}
                    >
                      <AppText
                        variant="caption"
                        style={[
                          styles.periodChipText,
                          isSelected && styles.periodChipTextActive,
                        ]}
                      >
                        {opt.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Rodapé Fixo de Ações */}
        <View style={styles.modalFooter}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Limpar todos os filtros"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onReset();
            }}
            style={({ pressed }) => [
              styles.resetButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="refresh-outline" size={16} color={colors.ink} />
            <AppText variant="caption" style={styles.resetButtonText}>
              Limpar tudo
            </AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Aplicar filtros e ver ${totalCalls} chamados`}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
            style={({ pressed }) => [
              styles.applyButton,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            <AppText variant="caption" style={styles.applyButtonText}>
              Ver {totalCalls > 0 ? `${totalCalls.toLocaleString('pt-BR')} chamados` : 'resultados'}
            </AppText>
            <Ionicons name="arrow-forward" size={16} color={colors.onAccent} />
          </Pressable>
        </View>
      </BottomSheetScrollView>
    </AppBottomSheetModal>
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
    activeBadgeWrapper: {
      paddingHorizontal: spacing.sm,
      marginTop: -2,
    },
    activeFilterPill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      paddingVertical: 6,
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
    activeFilterPillPressed: {
      opacity: 0.8,
      transform: [{ scale: 0.97 }],
    },
    activeFilterText: {
      fontWeight: '700',
      fontSize: 12,
      color: colors.ink,
    },
    activeFilterSubtext: {
      fontSize: 11,
    },
    filterModalScroll: {
      flex: 1,
    },
    filterModalBody: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    sectionCard: {
      backgroundColor: colors.surface,
      borderRadius: layout.radius.panel,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    sectionTitle: {
      fontWeight: '800',
      letterSpacing: 0.5,
      fontSize: 11,
      color: colors.muted,
      textTransform: 'uppercase',
    },
    sectionDesc: {
      fontSize: 12,
      marginTop: -2,
      marginBottom: 2,
    },
    layerCardsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    layerCard: {
      flexBasis: '48%',
      flexGrow: 1,
      minHeight: 84,
      padding: 10,
      borderRadius: layout.radius.sm,
      backgroundColor: colors.canvas,
      borderWidth: 1.5,
      borderColor: colors.border,
      justifyContent: 'space-between',
    },
    layerCardSelected: {
      borderColor: colors.ink,
      backgroundColor: colors.surface,
    },
    layerCardPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    layerCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    layerIconBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    layerCardContent: {
      gap: 1,
    },
    layerCardTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.ink,
    },
    layerCardDesc: {
      fontSize: 11,
    },
    filterSubfield: {
      gap: 6,
      marginTop: 2,
    },
    fieldSubLabel: {
      fontWeight: '700',
      fontSize: 11,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    segmentContainer: {
      flexDirection: 'row',
      backgroundColor: colors.canvas,
      borderRadius: layout.radius.pill,
      padding: 3,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    segmentButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 9,
      paddingHorizontal: 8,
      borderRadius: layout.radius.pill,
    },
    segmentButtonActive: {
      backgroundColor: colors.ink,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 3,
      elevation: 2,
    },
    segmentText: {
      fontWeight: '600',
      fontSize: 12,
      color: colors.ink,
    },
    segmentTextActive: {
      color: colors.surface,
      fontWeight: '700',
    },
    wrapChipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    periodChip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: layout.radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.canvas,
    },
    periodChipActive: {
      backgroundColor: colors.ink,
      borderColor: colors.ink,
    },
    periodChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.ink,
    },
    periodChipTextActive: {
      color: colors.surface,
      fontWeight: '700',
    },
    clearLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
      marginTop: 2,
    },
    clearLinkText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.accent,
    },
    modalFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      marginTop: spacing.xs,
      paddingTop: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
    },
    resetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: layout.radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    resetButtonText: {
      fontWeight: '700',
      color: colors.ink,
      fontSize: 13,
    },
    applyButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 13,
      paddingHorizontal: 20,
      borderRadius: layout.radius.pill,
      backgroundColor: colors.accent,
      ...Platform.select({
        ios: {
          shadowColor: colors.accent,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: { elevation: 4 },
      }),
    },
    applyButtonText: {
      fontWeight: '800',
      color: colors.onAccent,
      fontSize: 14,
    },
  });
