import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayerPicker } from '@/components/territory/LayerPicker';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppSelect } from '@/components/ui/AppSelect';
import { CitySearch } from '@/components/ui/CitySearch';
import { SlidingTabs } from '@/components/ui/SlidingTabs';
import { NeighborhoodPicker } from '@/features/city/NeighborhoodPicker';
import {
  facilityLabels,
  summarizeLayer,
  type TerritoryLayer,
} from '@/features/territory/selectors';
import type { FacilityCategory, SourceCoverage } from '@/shared/public-data';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';

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
}

export function TerritoryFilterBar({
  search,
  onSearchChange,
  onOpenFilters,
  filtersOpen,
  filterCount,
  bairroOptions,
  neighborhood,
  neighborhoodId,
  onNeighborhoodChange,
  serviceType,
  serviceTypeOptions,
  onServiceTypeChange,
  period,
  periodOptions,
  onPeriodChange,
  status,
  statusOptions,
  onStatusChange,
  layers,
  onLayersChange,
  startDate,
  endDate,
  totalCalls,
  officialCallsStatus,
  facilityQueries,
  facilitiesConfirmed,
  padded = false,
}: TerritoryFilterBarProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.wrapper, padded && styles.paddedWrapper]}>
      <View style={padded ? styles.paddedSection : styles.searchContainer}>
        <CitySearch
          value={search}
          onChangeText={onSearchChange}
          onFilters={onOpenFilters}
          expanded={filtersOpen}
          filterCount={filterCount}
        />
      </View>

      <View style={padded ? styles.paddedSection : undefined}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.compactFilterStrip}
        >
          <NeighborhoodPicker
            compact
            options={bairroOptions}
            value={neighborhood}
            onChange={onNeighborhoodChange}
          />

          <AppSelect
            compact
            label="Tipo de serviço 1746"
            placeholder="Buscar serviço (ex: iluminação, entulho...)"
            icon="construct-outline"
            defaultValue="all"
            options={serviceTypeOptions}
            value={serviceType}
            onChange={onServiceTypeChange}
          />

          <AppSelect
            compact
            label="Período disponível"
            icon="calendar-outline"
            defaultValue="30"
            options={periodOptions}
            value={period}
            onChange={onPeriodChange}
          />

          <AppSelect
            compact
            label="Situação do chamado"
            icon="pulse-outline"
            defaultValue="all"
            options={statusOptions}
            value={status}
            onChange={onStatusChange}
          />

          <View
            style={[
              styles.resultsBadge,
              { backgroundColor: colors.surface + 'F2' },
            ]}
          >
            <AppText
              variant="caption"
              color="muted"
              style={{ fontWeight: '700' }}
            >
              {officialCallsStatus.isLoading
                ? '...'
                : totalCalls.toLocaleString('pt-BR')}
            </AppText>
          </View>
        </ScrollView>

        <View style={styles.layerSection}>
          <LayerPicker value={layers} onChange={onLayersChange} />
          {neighborhoodId && (
            <AppButton
              title="Conhecer este bairro"
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: '/NeighborhoodScreen',
                  params: { neighborhoodId },
                })
              }
            />
          )}
          {layers.includes('official') && startDate && endDate && (
            <AppText
              variant="caption"
              style={{ backgroundColor: colors.surface, padding: 5 }}
            >
              1746 · {startDate} a {endDate}
            </AppText>
          )}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {layers.includes('official') && (
              <AppText
                variant="caption"
                style={{
                  padding: 6,
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                }}
              >
                1746 ·{' '}
                {officialCallsStatus.sourceState === 'unavailable' ||
                officialCallsStatus.territoryConfirmed === false
                  ? 'Cobertura não confirmada'
                  : officialCallsStatus.isLoading
                    ? 'Carregando'
                    : officialCallsStatus.error
                      ? 'Falha ao consultar'
                      : summarizeLayer(
                          officialCallsStatus.displayedCount,
                          officialCallsStatus.total,
                        )}
              </AppText>
            )}
            {(['school', 'health', 'square'] as const)
              .filter((c) => layers.includes(c))
              .map((category) => {
                const q = facilityQueries[category];
                const page = q.data?.pages[0];
                const shown =
                  q.data?.pages.reduce((n, p) => n + p.items.length, 0) || 0;
                return (
                  <Pressable
                    key={category}
                    accessibilityRole="button"
                    accessibilityLabel={
                      q.hasNextPage
                        ? 'Carregar mais ' + facilityLabels[category]
                        : 'Atualizar ' + facilityLabels[category]
                    }
                    disabled={!facilitiesConfirmed}
                    accessibilityState={{ disabled: !facilitiesConfirmed }}
                    onPress={() => {
                      if (!facilitiesConfirmed) return;
                      void (q.hasNextPage && !q.error
                        ? q.fetchNextPage()
                        : q.refetch());
                    }}
                    style={{
                      minHeight: 44,
                      padding: 8,
                      justifyContent: 'center',
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                    }}
                  >
                    <AppText variant="caption">
                      {facilityLabels[category]} ·{' '}
                      {neighborhood && !neighborhoodId
                        ? 'Bairro não confirmado'
                        : q.isLoading
                          ? 'Carregando'
                          : q.error
                            ? 'Falha · Tentar novamente'
                            : summarizeLayer(shown, page?.total ?? null)}
                      {facilitiesConfirmed && q.hasNextPage ? ' · Mais' : ''}
                    </AppText>
                    {page?.sources.some((s) => s.state === 'stale') && (
                      <AppText variant="caption" color="muted">
                        Última publicação disponível
                      </AppText>
                    )}
                  </Pressable>
                );
              })}
            {!layers.length && (
              <AppText
                variant="caption"
                style={{ padding: 8, backgroundColor: colors.surface }}
              >
                Selecione uma camada
              </AppText>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

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

export function TerritoryFilterModal({
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      gap: 8,
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
    compactFilterStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 2,
    },
    layerSection: {
      gap: 4,
    },
    resultsBadge: {
      height: 36,
      paddingHorizontal: spacing.sm + 2,
      borderRadius: layout.radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
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
