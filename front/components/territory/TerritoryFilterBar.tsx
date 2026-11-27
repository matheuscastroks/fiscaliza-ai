import { IconButton } from '@/components/ui/IconButton';

import { useMenu } from '@/components/ui/SideMenu';

import { useTheme, useThemedStyles } from '@/theme/useTheme';

import type { ThemeColors } from '@/theme/colors';
import type { ElevationTokens } from '@/theme/elevation';

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

import { useTerritoryDomain } from '@/stores/territoryStore';

import { fontSizes } from '@/theme/typography';


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
  showMenu?: boolean;
  radiusMeters?: RadiusMeters;
  onRadiusChange?: (radius: RadiusMeters) => void;
  radiusLabel?: string;
  areaOnly?: boolean;
  onClearAreaOnly?: () => void;
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
  padded = false,
  showMenu = true,
  areaOnly = false,
  onClearAreaOnly,
}: TerritoryFilterBarProps) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const {
    territoryDomain,
    setTerritoryDomain,
  } = useTerritoryDomain();

  // A busca começa recolhida para o bairro caber inteiro; abre por toque ou com texto.
  const [searchOpen, setSearchOpen] = useState(false);
  const [dismissedRequest, setDismissedRequest] = useState<string>();
  const requestedSearch = Boolean(searchFocusRequest) && dismissedRequest !== searchFocusRequest;
  const searchCollapsed = !searchOpen && !search && !requestedSearch;

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
            <Ionicons name={iconName} size={layout.iconSize.sm} color={colors.primary} />
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
            style={[styles.unifiedDivider, { backgroundColor: colors.dividerSubtle }]}
          />
        </Pressable>
      )}
    />
  );

  return (
    <View style={[styles.wrapper, padded && styles.paddedWrapper]}>
      {/* Linha 1: Barra Unificada de Busca (Cápsula de Local + Input + Filtros) */}
      <View style={[styles.searchRow, padded && styles.paddedSection]}>
        {showMenu && <IconButton
          icon="menu"
          variant="floating"
          accessibilityLabel="Abrir menu"
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            useMenu.getState().setOpen(true);
          }}
        />}
        <View style={styles.searchGrow}>
        <CitySearch
          floating={!padded}
          key={searchFocusRequest}
          leftElement={locationTrigger}
          searchLabel={territoryDomain === 'calls' ? 'Buscar chamado' : 'Buscar serviço público'}
          searchPlaceholder={territoryDomain === 'calls' ? 'Assunto ou protocolo' : 'Nome do serviço'}
          value={search}
          onChangeText={onSearchChange}
          searchCollapsed={searchCollapsed}
          autoFocus={searchOpen || requestedSearch}
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
              <AppText
                variant="caption"
                numberOfLines={1}
                style={[
                  styles.domainPillText,
                  territoryDomain === 'calls' && styles.domainPillTextActive,
                ]}
              >
                Chamados
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

        </ScrollView>
      </View>
    </View>
  );
}

// Chips de 36 (ou 32 + trilho) com folga vertical chegam a 48 de área de toque.
const DOMAIN_HIT_SLOP = { top: 8, bottom: 8 };

export const TerritoryFilterBar = memo(TerritoryFilterBarComponent);

const createStyles = (colors: ThemeColors, elevation?: ElevationTokens) =>
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
      ...elevation?.subtle,
    },
    quickChipActive: {
      backgroundColor: colors.surfaceSubdued,
      ...elevation?.raised,
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
      backgroundColor: colors.surfaceRecessed,
      ...elevation?.recessed,
      borderRadius: layout.radius.control,
      padding: 3,
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
      ...elevation?.subtle,
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
      backgroundColor: colors.surfaceRaised,
      ...elevation?.subtle,
    },
    activeFilterText: {
      fontWeight: '600',
      fontSize: fontSizes.caption,
      color: colors.ink,
    },
  });

export { TerritoryFilterModal, type TerritoryFilterModalProps } from './TerritoryFilterModal';
