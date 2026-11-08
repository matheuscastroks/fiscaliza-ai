import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import React, { memo, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { AppSelect } from '@/components/ui/AppSelect';
import {
  AppBottomSheetModal,
  BottomSheetScrollView,
} from '@/components/ui/AppBottomSheetModal';
import { CitySearch } from '@/components/ui/CitySearch';
import {
  type FacilityCategory,
  type SourceCoverage,
} from '@/shared/public-data';
import { layout, spacing } from '@/theme';
import { PlaceSelector } from '@/features/places/PlaceSelector';
import type { RadiusMeters } from '@/features/places/types';
import {
  CIVIC_MACRO_THEMES,
  matchesMacroTheme,
} from '@/features/city/officialCategoryThemes';
import {
  useTerritoryDomain,
} from '@/stores/territoryStore';

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
  areaOnly?: boolean;
  onClearAreaOnly?: () => void;
  mapAvailable?: boolean;
  macroTheme?: string;
  onMacroThemeChange?: (value: string) => void;
  onResetFilters?: () => void;
}

function TerritoryFilterBarComponent({
  search,
  onSearchChange,
  onOpenFilters,
  filtersOpen,
  filterCount,
  neighborhood,
  radiusLabel,
  totalCalls,
  officialCallsStatus,
  padded = false,
  areaOnly = false,
  onClearAreaOnly,
  mapAvailable = true,
  status,
  onStatusChange,
  period,
  onPeriodChange,
  macroTheme,
  onMacroThemeChange,
  onResetFilters,
}: TerritoryFilterBarProps) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const {
    territoryDomain,
    setTerritoryDomain,
    savedFacilityLayers,
    setFacilityLayers,
  } = useTerritoryDomain();

  const callsLabel = officialCallsStatus.isLoading
    ? '...'
    : totalCalls > 999
      ? `${(totalCalls / 1000).toFixed(1)}k`
      : `${totalCalls}`;

  const hasSpecificActiveFilters =
    filterCount > 0 || (macroTheme && macroTheme !== 'all') || (status && status !== 'all');

  const locationTrigger = (
    <PlaceSelector
      prompt={false}
      areaOnly={areaOnly}
      onClearAreaOnly={onClearAreaOnly}
      renderTrigger={({ onPress, summary, shortSummary, iconName }) => (
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
          }}
          accessibilityRole="button"
          accessibilityLabel={`Recorte atual: ${summary}. Toque para alterar.`}
          style={({ pressed }) => [
            styles.unifiedLocationPill,
            pressed && { opacity: 0.75 },
          ]}
        >
          <View
            style={[
              styles.unifiedLocationIconBadge,
              { backgroundColor: isDark ? colors.surfaceSubdued : colors.canvas },
            ]}
          >
            <Ionicons name={iconName} size={13} color={colors.onSurfaceBrand} />
          </View>
          <AppText
            variant="caption"
            numberOfLines={1}
            style={styles.unifiedLocationText}
          >
            {shortSummary}
          </AppText>
          <Ionicons name="chevron-down" size={11} color={colors.muted} />
          <View
            style={[styles.unifiedDivider, { backgroundColor: colors.border }]}
          />
        </Pressable>
      )}
    />
  );

  return (
    <View style={[styles.wrapper, padded && styles.paddedWrapper]}>
      {/* Linha 1: Barra Unificada de Busca (Cápsula de Local + Input + Filtros) */}
      <View style={padded ? styles.paddedSection : styles.searchContainer}>
        <CitySearch
          leftElement={locationTrigger}
          value={search}
          onChangeText={onSearchChange}
          onFilters={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onOpenFilters();
          }}
          filterCount={filterCount}
          expanded={filtersOpen}
        />
      </View>

      {/* Linha 2: Carrossel Horizontal de Chips Rápidos de 1 Toque (Apple HIG Style) */}
      <View style={padded ? styles.paddedSection : undefined}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickChipsTrack}
        >
          {/* Alternador de Domínio: 1746 vs Serviços Públicos */}
          <View style={styles.domainPillTrack}>
            <Pressable
              accessibilityRole="tab"
              accessibilityLabel="Exibir chamados 1746"
              accessibilityState={{ selected: territoryDomain === 'calls' }}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTerritoryDomain('calls');
              }}
              style={[
                styles.domainPillButton,
                territoryDomain === 'calls' && styles.domainPillButtonActive,
              ]}
            >
              <Ionicons
                name="warning"
                size={13}
                color={
                  territoryDomain === 'calls' ? colors.onAccentBrand : colors.ink
                }
              />
              <AppText
                variant="caption"
                numberOfLines={1}
                style={[
                  styles.domainPillText,
                  territoryDomain === 'calls' && styles.domainPillTextActive,
                ]}
              >
                1746 · {callsLabel}
              </AppText>
            </Pressable>

            <Pressable
              accessibilityRole="tab"
              accessibilityLabel="Exibir serviços públicos"
              accessibilityState={{ selected: territoryDomain === 'facilities' }}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTerritoryDomain('facilities');
              }}
              style={[
                styles.domainPillButton,
                territoryDomain === 'facilities' && styles.domainPillButtonActive,
              ]}
            >
              <Ionicons
                name="business"
                size={13}
                color={
                  territoryDomain === 'facilities' ? colors.onAccentBrand : colors.ink
                }
              />
              <AppText
                variant="caption"
                numberOfLines={1}
                style={[
                  styles.domainPillText,
                  territoryDomain === 'facilities' && styles.domainPillTextActive,
                ]}
              >
                Serviços
              </AppText>
            </Pressable>
          </View>

          {/* Chips Rápidos de Chamados 1746 */}
          {territoryDomain === 'calls' && (
            <>
              {/* Toggle Inline de Situação: Todas -> Abertos -> Encerrados */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Situação: ${status === 'Não Encerrado' ? 'Abertos' : status === 'Encerrado' ? 'Encerrados' : 'Todas'}. Toque para alternar.`}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const next =
                    status === 'all'
                      ? 'Não Encerrado'
                      : status === 'Não Encerrado'
                        ? 'Encerrado'
                        : 'all';
                  onStatusChange(next);
                }}
                style={[
                  styles.quickChip,
                  status !== 'all' && styles.quickChipActive,
                ]}
              >
                <Ionicons
                  name={
                    status === 'Não Encerrado'
                      ? 'alert-circle'
                      : status === 'Encerrado'
                        ? 'checkmark-circle'
                        : 'funnel-outline'
                  }
                  size={12}
                  color={status !== 'all' ? colors.onAccentBrand : colors.muted}
                />
                <AppText
                  variant="caption"
                  style={[
                    styles.quickChipText,
                    status !== 'all' && styles.quickChipTextActive,
                  ]}
                >
                  {status === 'Não Encerrado'
                    ? 'Abertos'
                    : status === 'Encerrado'
                      ? 'Encerrados'
                      : 'Situação'}
                </AppText>
              </Pressable>

              {/* Macro-tema ativo com botão de limpar direto */}
              {macroTheme && macroTheme !== 'all' && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remover filtro de tema ${macroTheme}`}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onMacroThemeChange?.('all');
                  }}
                  style={[styles.quickChip, styles.quickChipActive]}
                >
                  <Ionicons name="pricetag" size={12} color={colors.onAccentBrand} />
                  <AppText variant="caption" style={[styles.quickChipText, styles.quickChipTextActive]}>
                    {CIVIC_MACRO_THEMES.find((t) => t.id === macroTheme)?.label || macroTheme}
                  </AppText>
                  <Ionicons name="close" size={12} color={colors.onAccentBrand} />
                </Pressable>
              )}
            </>
          )}

          {/* Chips Rápidos de Serviços Públicos: Ligar/Desligar Camadas com 1 Toque */}
          {territoryDomain === 'facilities' && (
            <>
              {[
                { id: 'school' as const, label: 'Escolas', icon: 'school' as const },
                { id: 'health' as const, label: 'Saúde', icon: 'medkit' as const },
                { id: 'square' as const, label: 'Praças', icon: 'leaf' as const },
              ].map((f) => {
                const isSelected = savedFacilityLayers.includes(f.id);
                return (
                  <Pressable
                    key={f.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Camada ${f.label}`}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      const current = savedFacilityLayers.filter((l): l is FacilityCategory => l !== 'official');
                      const next = current.includes(f.id)
                        ? current.filter((l) => l !== f.id)
                        : [...current, f.id];
                      if (next.length === 0) return;
                      setFacilityLayers(next);
                    }}
                    style={[
                      styles.quickChip,
                      isSelected && styles.quickChipActive,
                    ]}
                  >
                    <Ionicons
                      name={f.icon}
                      size={12}
                      color={isSelected ? colors.onAccentBrand : colors.muted}
                    />
                    <AppText
                      variant="caption"
                      style={[
                        styles.quickChipText,
                        isSelected && styles.quickChipTextActive,
                      ]}
                    >
                      {f.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </>
          )}

          {/* Indicador de Filtros Ativos / Acesso Rápido */}
          {hasSpecificActiveFilters && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ver filtros aplicados"
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onOpenFilters();
              }}
              style={({ pressed }) => [
                styles.activeFilterPill,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons name="options" size={12} color={colors.onSurfaceBrand} />
              <AppText variant="caption" numberOfLines={1} style={styles.activeFilterText}>
                Filtros{filterCount > 0 ? ` (${filterCount})` : ''}
              </AppText>
            </Pressable>
          )}
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
  bairroOptions?: string[];
  neighborhood?: string;
  onNeighborhoodChange?: (value: string) => void;
  macroTheme: string;
  onMacroThemeChange: (value: string) => void;
  serviceType: string;
  serviceTypeOptions: { value: string; label: string }[];
  onServiceTypeChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  period: string;
  periodOptions: { value: string; label: string }[];
  onPeriodChange: (value: string) => void;
  areaOnly?: boolean;
  onAreaOnlyChange?: (nextArea: boolean) => void;
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
  macroTheme,
  onMacroThemeChange,
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
  radiusMeters,
  onRadiusChange,
  radiusLabel,
}: TerritoryFilterModalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['70%', '90%'], []);

  const filteredServiceOptions = useMemo(() => {
    if (macroTheme === 'all') return serviceTypeOptions;
    const matches = serviceTypeOptions.filter(
      (opt) => opt.value !== 'all' && matchesMacroTheme(opt.value, null, macroTheme),
    );
    const themeLabel = CIVIC_MACRO_THEMES.find((t) => t.id === macroTheme)?.label || 'este tema';
    return [
      { value: 'all', label: `Todos de ${themeLabel}` },
      ...matches,
    ];
  }, [macroTheme, serviceTypeOptions]);

  const {
    territoryDomain,
    setTerritoryDomain,
    savedFacilityLayers,
    setFacilityLayers,
  } = useTerritoryDomain();

  const toggleFacility = (facilityId: FacilityCategory) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const current = savedFacilityLayers.filter(
      (l): l is FacilityCategory => l !== 'official',
    );
    const next: TerritoryLayer[] = current.includes(facilityId)
      ? current.filter((l) => l !== facilityId)
      : [...current, facilityId];
    if (next.length === 0) return; // Garante ao menos 1 selecionado
    setFacilityLayers(next);
  };

  const FACILITY_CONFIGS: {
    id: FacilityCategory;
    label: string;
    sublabel: string;
    icon: keyof typeof Ionicons.glyphMap;
    activeColor: string;
  }[] = [
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
        contentContainerStyle={[
          styles.filterModalBody,
          { paddingBottom: spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        {/* Seletor Principal de Domínio: Chamados 1746 vs. Serviços Públicos */}
        <View style={styles.domainTabsTrack}>
          <Pressable
            accessibilityRole="tab"
            accessibilityLabel="Filtrar Chamados 1746"
            accessibilityState={{ selected: territoryDomain === 'calls' }}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setTerritoryDomain('calls');
            }}
            style={[
              styles.domainTabButton,
              territoryDomain === 'calls' && styles.domainTabButtonActive,
            ]}
          >
            <Ionicons
              name="warning"
              size={15}
              color={
                territoryDomain === 'calls' ? colors.onAccentBrand : colors.ink
              }
            />
            <AppText
              variant="caption"
              style={[
                styles.domainTabButtonText,
                territoryDomain === 'calls' && styles.domainTabButtonTextActive,
              ]}
            >
              Chamados 1746
            </AppText>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityLabel="Filtrar Serviços Públicos"
            accessibilityState={{ selected: territoryDomain === 'facilities' }}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setTerritoryDomain('facilities');
            }}
            style={[
              styles.domainTabButton,
              territoryDomain === 'facilities' && styles.domainTabButtonActive,
            ]}
          >
            <Ionicons
              name="business"
              size={15}
              color={
                territoryDomain === 'facilities'
                  ? colors.onAccentBrand
                  : colors.ink
              }
            />
            <AppText
              variant="caption"
              numberOfLines={1}
              style={[
                styles.domainTabButtonText,
                territoryDomain === 'facilities' &&
                  styles.domainTabButtonTextActive,
              ]}
            >
              Serviços Públicos
            </AppText>
          </Pressable>
        </View>

        {/* CONTEÚDO DA ABA: CHAMADOS 1746 */}
        {territoryDomain === 'calls' && (
          <View style={styles.filterFormContainer}>
            {/* Seção 1: Macro-temas Cívicos */}
            <View style={styles.filterSection}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="apps-outline" size={14} color={colors.accent} />
                <AppText variant="caption" style={styles.sectionHeaderTitle}>
                  Tema Cívico
                </AppText>
              </View>

              <View style={styles.macroThemesTrack}>
                {CIVIC_MACRO_THEMES.map((theme) => {
                  const isSelected = macroTheme === theme.id;
                  return (
                    <Pressable
                      key={theme.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Filtrar por ${theme.label}`}
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onMacroThemeChange(theme.id);
                        if (theme.id !== 'all' && !matchesMacroTheme(serviceType, null, theme.id)) {
                          onServiceTypeChange('all');
                        }
                      }}
                      style={[
                        styles.macroThemeChip,
                        isSelected && styles.macroThemeChipSelected,
                      ]}
                    >
                      <Ionicons
                        name={theme.icon as React.ComponentProps<typeof Ionicons>['name']}
                        size={14}
                        color={isSelected ? colors.onAccentBrand : colors.ink}
                      />
                      <AppText
                        variant="caption"
                        style={[
                          styles.macroThemeChipText,
                          isSelected && styles.macroThemeChipTextSelected,
                        ]}
                      >
                        {theme.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Seção 2: Subtipo Específico */}
            <View style={styles.filterSection}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="construct-outline" size={14} color={colors.accent} />
                <AppText variant="caption" style={styles.sectionHeaderTitle}>
                  Subtipo Específico (1746)
                </AppText>
              </View>
              <AppSelect
                label="Tipo de serviço 1746"
                placeholder="Buscar tipo de serviço..."
                icon="construct-outline"
                defaultValue="all"
                options={filteredServiceOptions}
                value={serviceType}
                onChange={onServiceTypeChange}
              />
            </View>

            <View style={styles.sectionDivider} />

            {/* Seção 3: Situação */}
            <View style={styles.filterSection}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="filter-circle-outline" size={14} color={colors.accent} />
                <AppText variant="caption" style={styles.sectionHeaderTitle}>
                  Situação do Chamado
                </AppText>
              </View>
              <View style={styles.segmentContainer}>
                {[
                  { value: 'all', label: 'Todas', dotColor: null },
                  { value: 'Não Encerrado', label: 'Abertos', dotColor: '#10B981' },
                  { value: 'Encerrado', label: 'Encerrados', dotColor: '#6B7280' },
                ].map((opt) => {
                  const isSelected = status === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => {
                        void Haptics.impactAsync(
                          Haptics.ImpactFeedbackStyle.Light,
                        );
                        onStatusChange(opt.value);
                      }}
                      style={[
                        styles.segmentButton,
                        isSelected && styles.segmentButtonActive,
                      ]}
                    >
                      {opt.dotColor && (
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: opt.dotColor,
                            marginRight: 6,
                          }}
                        />
                      )}
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

            <View style={styles.sectionDivider} />

            {/* Seção 4: Período */}
            <View style={styles.filterSection}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.accent} />
                <AppText variant="caption" style={styles.sectionHeaderTitle}>
                  Período de Abertura
                </AppText>
              </View>
              <View style={styles.wrapChipsRow}>
                {periodOptions.map((opt) => {
                  const isSelected = period === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => {
                        void Haptics.impactAsync(
                          Haptics.ImpactFeedbackStyle.Light,
                        );
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

        {/* CONTEÚDO DA ABA: SERVIÇOS PÚBLICOS */}
        {territoryDomain === 'facilities' && (
          <View style={styles.filterFormContainer}>
            <View style={styles.filterSection}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="business" size={14} color={colors.accent} />
                <AppText variant="caption" style={styles.sectionHeaderTitle}>
                  Equipamentos Públicos no Mapa
                </AppText>
              </View>
              <AppText
                variant="caption"
                color="muted"
                style={styles.sectionDesc}
              >
                Selecione quais serviços você deseja visualizar:
              </AppText>

              <View style={styles.facilityCardsContainer}>
                {FACILITY_CONFIGS.map((cfg, index) => {
                  const isSelected = savedFacilityLayers.includes(cfg.id);
                  const isLast = index === FACILITY_CONFIGS.length - 1;
                  return (
                    <Pressable
                      key={cfg.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Equipamento ${cfg.label}`}
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => toggleFacility(cfg.id)}
                      style={({ pressed }) => [
                        styles.facilityCardRow,
                        !isLast && styles.facilityCardRowDivider,
                        isSelected && styles.facilityCardRowSelected,
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <View
                        style={[
                          styles.facilityIconBadge,
                          {
                            backgroundColor: isSelected
                              ? cfg.activeColor
                              : colors.border,
                          },
                        ]}
                      >
                        <Ionicons
                          name={cfg.icon}
                          size={18}
                          color={isSelected ? '#FFFFFF' : colors.muted}
                        />
                      </View>
                      <View style={{ flex: 1, gap: 1 }}>
                        <AppText
                          variant="caption"
                          style={[
                            styles.facilityCardTitle,
                            isSelected && {
                              color: colors.ink,
                              fontWeight: '700',
                            },
                          ]}
                        >
                          {cfg.label}
                        </AppText>
                        <AppText
                          variant="caption"
                          color="muted"
                          style={styles.facilityCardDesc}
                        >
                          {cfg.sublabel}
                        </AppText>
                      </View>
                      <Ionicons
                        name={
                          isSelected ? 'checkmark-circle' : 'ellipse-outline'
                        }
                        size={22}
                        color={isSelected ? cfg.activeColor : colors.muted}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Aviso preventivo de filtro vazio no recorte */}
        {territoryDomain === 'calls' && totalCalls === 0 && (
          <View style={styles.emptyWarningHint}>
            <Ionicons name="information-circle-outline" size={16} color={colors.risk} />
            <AppText variant="caption" color="muted" style={{ flex: 1 }}>
              Nenhum chamado encontrado para este filtro no recorte. Experimente ampliar o período ou o raio.
            </AppText>
          </View>
        )}

      </BottomSheetScrollView>

      {/* Rodapé Fixo de Ações */}
      <View style={[styles.modalFooter, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
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
            accessibilityLabel="Aplicar filtros e ver resultados"
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
              {territoryDomain === 'calls'
                ? totalCalls === 0
                  ? 'Ver resultados (0 chamados)'
                  : `Ver ${totalCalls.toLocaleString('pt-BR')} ${totalCalls === 1 ? 'chamado' : 'chamados'}`
                : 'Ver equipamentos'}
            </AppText>
            <Ionicons name="arrow-forward" size={16} color={colors.onAccent} />
          </Pressable>
        </View>
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
    viewModePill: {
      minHeight: 40,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: layout.radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.09,
      shadowRadius: 6,
      elevation: 3,
    },
    viewModePillActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    viewModeText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.ink,
    },
    viewModeTextActive: {
      color: colors.onAccent,
      fontWeight: '800',
    },
    searchContainer: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    unifiedLocationPill: {
      flexDirection: 'row',
      alignItems: 'center',
      maxWidth: 130,
      height: 38,
      paddingLeft: 4,
      paddingRight: 6,
      gap: 4,
    },
    unifiedLocationIconBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    unifiedLocationText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.ink,
      flexShrink: 1,
    },
    unifiedDivider: {
      width: 1,
      height: 20,
      marginLeft: 4,
    },
    quickChipsTrack: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: 2,
    },
    quickChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      height: 30,
      paddingHorizontal: 10,
      borderRadius: 15,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 1,
    },
    quickChipActive: {
      backgroundColor: colors.surfaceSubdued,
      borderColor: colors.onSurfaceBrand,
    },
    quickChipText: {
      fontSize: 12,
      color: colors.muted,
      fontWeight: '500',
    },
    quickChipTextActive: {
      color: colors.ink,
      fontWeight: '700',
    },
    scopeContextCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: layout.radius.panel,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.xs,
    },
    scopeContextIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surfaceSubdued,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scopeContextSub: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    scopeContextTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.ink,
    },
    topSwitcherScroll: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: spacing.xs,
      marginTop: -2,
    },
    domainPillTrack: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 0,
      backgroundColor: colors.surface,
      borderRadius: layout.radius.pill,
      padding: 3,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 3,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    domainPillButton: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 0,
      gap: 5,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: layout.radius.pill,
    },
    domainPillButtonActive: {
      backgroundColor: colors.accent,
    },
    domainPillText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.ink,
    },
    domainPillTextActive: {
      color: colors.onAccent,
      fontWeight: '700',
    },
    activeFilterPill: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 0,
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 10,
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
    activeFilterText: {
      fontWeight: '700',
      fontSize: 11,
      color: colors.ink,
    },
    filterModalScroll: {
      flex: 1,
    },
    filterModalBody: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
      gap: spacing.md,
    },
    domainTabsTrack: {
      flexDirection: 'row',
      backgroundColor: colors.canvas,
      borderRadius: layout.radius.pill,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    domainTabButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: layout.radius.pill,
    },
    domainTabButtonActive: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    domainTabButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.muted,
    },
    domainTabButtonTextActive: {
      color: colors.ink,
      fontWeight: '800',
    },
    filterFormContainer: {
      gap: spacing.md,
    },
    filterSection: {
      gap: spacing.xs + 2,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 2,
    },
    sectionHeaderTitle: {
      fontWeight: '800',
      letterSpacing: 0.6,
      fontSize: 11,
      color: colors.muted,
      textTransform: 'uppercase',
    },
    sectionDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.divider,
      marginVertical: spacing.xxs,
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
    facilityCardsContainer: {
      borderRadius: layout.radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    facilityCardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: colors.surface,
    },
    facilityCardRowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    facilityCardRowSelected: {
      backgroundColor: colors.surfaceSubdued,
    },
    facilityIconBadge: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    facilityCardTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.ink,
    },
    facilityCardDesc: {
      fontSize: 12,
      color: colors.muted,
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
      height: 34,
      justifyContent: 'center',
      paddingHorizontal: 14,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
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
    macroThemesTrack: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingVertical: 2,
    },
    macroThemeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 36,
      paddingHorizontal: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    macroThemeChipSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    macroThemeChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.ink,
    },
    macroThemeChipTextSelected: {
      color: colors.onAccent,
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
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
      backgroundColor: colors.surface,
    },
    emptyWarningHint: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      padding: spacing.sm,
      borderRadius: layout.radius.card,
      backgroundColor: colors.surfaceSubdued,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.xs,
    },
    resetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 48,
      paddingHorizontal: 16,
      borderRadius: layout.radius.panel,
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
      height: 48,
      paddingHorizontal: 20,
      borderRadius: layout.radius.panel,
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
