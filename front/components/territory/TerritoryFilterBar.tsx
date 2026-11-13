import { IconButton } from '@/components/ui/IconButton';

import { useMenu } from '@/components/ui/SideMenu';

import { useTheme, useThemedStyles } from '@/theme/useTheme';

import type { ThemeColors } from '@/theme/colors';

import { memo, useState } from 'react';

import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui/AppText';

import { CitySearch } from '@/components/ui/CitySearch';

import { type FacilityCategory, type SourceCoverage } from '@/shared/public-data';

import { layout, spacing } from '@/theme';

import { PlaceSelector } from '@/features/places/PlaceSelector';

import type { RadiusMeters } from '@/features/places/types';

import { CIVIC_MACRO_THEMES } from '@/features/city/officialCategoryThemes';
import { useTerritoryDomain } from '@/stores/territoryStore';

import { fontSizes } from '@/theme/typography';

import { elevation } from '@/theme/elevation';

import { CLOSED_STATUS, OPEN_STATUS } from '@/features/city/callStatus';

import type { TerritoryLayer } from '@/features/territory/selectors';


export type { TerritoryLayer };

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
  searchFocusRequest?: string;
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
  searchFocusRequest,
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

  // A busca começa recolhida para o bairro caber inteiro; abre por toque ou com texto.
  const [searchOpen, setSearchOpen] = useState(Boolean(search));
  const [dismissedRequest, setDismissedRequest] = useState<string>();
  const requestedSearch = Boolean(searchFocusRequest) && dismissedRequest !== searchFocusRequest;
  const searchCollapsed = !searchOpen && !search && !requestedSearch;

  const callsLabel = officialCallsStatus.isLoading
    ? '…'
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
          accessibilityLabel={`Área atual: ${summary}. Toque para alterar.`}
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
            <Ionicons name={iconName} size={layout.iconSize.sm} color={colors.onSurfaceBrand} />
          </View>
          <AppText
            variant="caption"
            numberOfLines={1}
            style={styles.unifiedLocationText}
          >
            {shortSummary}
          </AppText>
          <Ionicons name="chevron-down" size={layout.iconSize.sm} color={colors.muted} />
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
      <View style={[padded ? styles.paddedSection : styles.searchContainer, styles.searchRow]}>
        <IconButton
          icon="menu"
          variant="floating"
          accessibilityLabel="Abrir menu"
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            useMenu.getState().setOpen(true);
          }}
        />
        <View style={styles.searchGrow}>
        <CitySearch
          key={searchFocusRequest}
          leftElement={locationTrigger}
          value={search}
          onChangeText={onSearchChange}
          searchCollapsed={searchCollapsed}
          onExpandSearch={() => setSearchOpen(true)}
          onCollapseSearch={() => {
            setSearchOpen(false);
            setDismissedRequest(searchFocusRequest);
            onSearchChange('');
          }}
          onFilters={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onOpenFilters();
          }}
          filterCount={filterCount}
          expanded={filtersOpen}
        />
        </View>
      </View>

      {/* Linha 2: Carrossel Horizontal de Chips Rápidos de 1 Toque (Apple HIG Style) */}
      {/* A faixa vai até a borda da tela e termina com recuo, para o último chip não ficar cortado. */}
      <View style={padded ? undefined : styles.bleed}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.quickChipsTrack, styles.trackInset]}
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
              hitSlop={DOMAIN_HIT_SLOP}
              style={[
                styles.domainPillButton,
                territoryDomain === 'calls' && styles.domainPillButtonActive,
              ]}
            >
              <Ionicons
                name="warning"
                size={layout.iconSize.sm}
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
              hitSlop={DOMAIN_HIT_SLOP}
              style={[
                styles.domainPillButton,
                territoryDomain === 'facilities' && styles.domainPillButtonActive,
              ]}
            >
              <Ionicons
                name="business"
                size={layout.iconSize.sm}
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
                accessibilityLabel={`Situação: ${status === OPEN_STATUS ? 'Abertos' : status === CLOSED_STATUS ? 'Encerrados' : 'Todas'}. Toque para alternar.`}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const next =
                    status === 'all'
                      ? OPEN_STATUS
                      : status === OPEN_STATUS
                        ? CLOSED_STATUS
                        : 'all';
                  onStatusChange(next);
                }}
                hitSlop={CHIP_HIT_SLOP}
                style={[
                  styles.quickChip,
                  status !== 'all' && styles.quickChipActive,
                ]}
              >
                <Ionicons
                  name={
                    status === OPEN_STATUS
                      ? 'alert-circle'
                      : status === CLOSED_STATUS
                        ? 'checkmark-circle'
                        : 'funnel-outline'
                  }
                  size={layout.iconSize.sm}
                  color={status !== 'all' ? colors.onSurfaceBrand : colors.muted}
                />
                <AppText
                  variant="caption"
                  style={[
                    styles.quickChipText,
                    status !== 'all' && styles.quickChipTextActive,
                  ]}
                >
                  {status === OPEN_STATUS
                    ? 'Abertos'
                    : status === CLOSED_STATUS
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
                  hitSlop={CHIP_HIT_SLOP}
                  style={[styles.quickChip, styles.quickChipActive]}
                >
                  <Ionicons name="pricetag" size={layout.iconSize.sm} color={colors.onSurfaceBrand} />
                  <AppText variant="caption" style={[styles.quickChipText, styles.quickChipTextActive]}>
                    {CIVIC_MACRO_THEMES.find((t) => t.id === macroTheme)?.label || macroTheme}
                  </AppText>
                  <Ionicons name="close" size={layout.iconSize.sm} color={colors.onSurfaceBrand} />
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
                    accessibilityLabel={`Mostrar ${f.label}`}
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
                    hitSlop={CHIP_HIT_SLOP}
                    style={[
                      styles.quickChip,
                      isSelected && styles.quickChipActive,
                    ]}
                  >
                    <Ionicons
                      name={f.icon}
                      size={layout.iconSize.sm}
                      color={isSelected ? colors.onSurfaceBrand : colors.muted}
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
              hitSlop={CHIP_HIT_SLOP}
              style={({ pressed }) => [
                styles.activeFilterPill,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons name="options" size={layout.iconSize.sm} color={colors.onSurfaceBrand} />
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

// Chips de 36 (ou 32 + trilho) com folga vertical chegam a 48 de área de toque.
const CHIP_HIT_SLOP = { top: 6, bottom: 6 };
const DOMAIN_HIT_SLOP = { top: 8, bottom: 8 };

export const TerritoryFilterBar = memo(TerritoryFilterBarComponent);

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    searchGrow: { flex: 1 },
    wrapper: {
      gap: 0,
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
      ...elevation.floating,
    },
    unifiedLocationPill: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 44,
      paddingLeft: 4,
      paddingRight: 6,
      gap: 4,
    },
    unifiedLocationIconBadge: {
      width: 24,
      height: 24,
      borderRadius: layout.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    unifiedLocationText: {
      fontSize: fontSizes.meta,
      fontWeight: '600',
      color: colors.ink,
      flexShrink: 1,
    },
    unifiedDivider: {
      width: 1,
      height: 20,
      marginLeft: 'auto',
    },
    bleed: {
      marginHorizontal: -spacing.md,
    },
    trackInset: {
      paddingHorizontal: spacing.md,
    },
    quickChipsTrack: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      // Espaço para a folga de toque dos chips (o Android não aceita toque fora do pai).
      paddingVertical: 6,
    },
    quickChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      minHeight: 36,
      paddingHorizontal: spacing.sm,
      borderRadius: layout.radius.panel,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    quickChipActive: {
      backgroundColor: colors.surfaceSubdued,
      borderColor: colors.onSurfaceBrand,
    },
    quickChipText: {
      fontSize: fontSizes.caption,
      color: colors.muted,
      fontWeight: '500',
    },
    quickChipTextActive: {
      color: colors.ink,
      fontWeight: '600',
    },
    domainPillTrack: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 0,
      backgroundColor: colors.surface,
      borderRadius: layout.radius.control,
      padding: 3,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 3,
    },
    domainPillButton: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 0,
      gap: 5,
      minHeight: 32,
      paddingHorizontal: spacing.sm,
      borderRadius: layout.radius.compact,
    },
    domainPillButtonActive: {
      backgroundColor: colors.accent,
    },
    domainPillText: {
      fontSize: fontSizes.caption,
      fontWeight: '600',
      color: colors.ink,
    },
    domainPillTextActive: {
      color: colors.onAccent,
      fontWeight: '600',
    },
    activeFilterPill: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 0,
      gap: 4,
      minHeight: 36,
      paddingHorizontal: spacing.sm,
      borderRadius: layout.radius.compact,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    activeFilterText: {
      fontWeight: '600',
      fontSize: fontSizes.caption,
      color: colors.ink,
    },
  });

export { TerritoryFilterModal, type TerritoryFilterModalProps } from './TerritoryFilterModal';
