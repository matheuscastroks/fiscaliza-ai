import { useTheme, useThemedStyles } from '@/theme/useTheme';


import React, { memo, useMemo } from 'react';

import { View, Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import { Ionicons } from '@expo/vector-icons';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Chip } from '@/components/ui/Chip';
import { SectionHeader } from '@/components/ui/SectionHeader';

import { AppSelect } from '@/components/ui/AppSelect';

import { AppBottomSheetModal, BottomSheetScrollView } from '@/components/ui/AppBottomSheetModal';

import { type FacilityCategory } from '@/shared/public-data';
import { layout, spacing } from '@/theme';

import type { RadiusMeters } from '@/features/places/types';

import { CIVIC_MACRO_THEMES, matchesMacroTheme } from '@/features/city/officialCategoryThemes';

import { useTerritoryDomain } from '@/stores/territoryStore';


import { lightColors } from '@/theme/colors';

import { CLOSED_STATUS, OPEN_STATUS } from '@/features/city/callStatus';

import type { TerritoryLayer } from '@/features/territory/selectors';
import { createStyles } from './TerritoryFilterModal.styles';



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
      activeColor: colors.info,
    },
    {
      id: 'health',
      label: 'Saúde',
      sublabel: 'Postos, UPAs e hospitais',
      icon: 'medkit',
      activeColor: colors.completed,
    },
    {
      id: 'square',
      label: 'Praças e Lazer',
      sublabel: 'Parques e áreas públicas',
      icon: 'leaf',
      activeColor: colors.completed,
    },
  ];

  return (
    <AppBottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Filtros"
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
              size={layout.iconSize.sm}
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
              size={layout.iconSize.sm}
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
              <SectionHeader icon="apps-outline" title="Tema Cívico" />

              <AppSelect
                label="Tema cívico"
                placeholder="Buscar tema cívico…"
                icon="apps-outline"
                defaultValue="all"
                options={CIVIC_MACRO_THEMES.map((theme) => ({ value: theme.id, label: theme.label }))}
                value={macroTheme}
                onChange={(value) => {
                  onMacroThemeChange(value);
                  if (value !== 'all' && !matchesMacroTheme(serviceType, null, value)) {
                    onServiceTypeChange('all');
                  }
                }}
              />
            </View>

            {/* Seção 2: Subtipo Específico */}
            <View style={styles.filterSection}>
              <SectionHeader icon="construct-outline" title="Subtipo Específico (1746)" />
              <AppSelect
                label="Tipo de serviço 1746"
                placeholder="Buscar tipo de serviço…"
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
              <SectionHeader icon="filter-circle-outline" title="Situação do Chamado" />
              <View style={styles.segmentContainer}>
                {[
                  { value: 'all', label: 'Todas', dotColor: null },
                  { value: OPEN_STATUS, label: 'Abertos', dotColor: colors.completed },
                  { value: CLOSED_STATUS, label: 'Encerrados', dotColor: colors.muted },
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
                            borderRadius: layout.radius.xs,
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
              <SectionHeader icon="calendar-outline" title="Período de Abertura" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled
                keyboardShouldPersistTaps="handled" contentContainerStyle={styles.periodTrack}>
                {periodOptions.map((opt) => {
                  const isSelected = period === opt.value;
                  return (
                    <Chip
                      key={opt.value}
                      label={opt.label}
                      selected={isSelected}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onPeriodChange(opt.value);
                      }}
                    />
                  );
                })}
              </ScrollView>
            </View>
          </View>
        )}

        {/* CONTEÚDO DA ABA: SERVIÇOS PÚBLICOS */}
        {territoryDomain === 'facilities' && (
          <View style={styles.filterFormContainer}>
            <View style={styles.filterSection}>
              <SectionHeader icon="business" title="Serviços públicos no mapa" />
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
                      accessibilityLabel={`Serviço ${cfg.label}`}
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
                          size={layout.iconSize.md}
                          color={isSelected ? lightColors.white : colors.muted}
                        />
                      </View>
                      <View style={{ flex: 1, gap: 1 }}>
                        <AppText
                          variant="caption"
                          style={[
                            styles.facilityCardTitle,
                            isSelected && {
                              color: colors.ink,
                              fontWeight: '600',
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
                        size={layout.iconSize.md}
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
            <Ionicons name="information-circle-outline" size={layout.iconSize.sm} color={colors.risk} />
            <AppText variant="caption" color="muted" style={{ flex: 1 }}>
              Nenhum chamado com esses filtros. Tente mudar o período ou a distância.
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
            <Ionicons name="refresh-outline" size={layout.iconSize.sm} color={colors.ink} />
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
                : 'Ver serviços'}
            </AppText>
            <Ionicons name="arrow-forward" size={layout.iconSize.sm} color={colors.onAccent} />
          </Pressable>
        </View>
    </AppBottomSheetModal>
  );
}

export const TerritoryFilterModal = memo(TerritoryFilterModalComponent);
