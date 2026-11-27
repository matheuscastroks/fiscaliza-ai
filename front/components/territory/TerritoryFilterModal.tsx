import { useTheme, useThemedStyles } from '@/theme/useTheme';


import React, { memo, useMemo, useState } from 'react';

import { View, Pressable, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Ionicons } from '@expo/vector-icons';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { Chip } from '@/components/ui/Chip';
import { SectionHeader } from '@/components/ui/SectionHeader';

import { AppSelect } from '@/components/ui/AppSelect';

import { AppBottomSheetModal, BottomSheetScrollView } from '@/components/ui/AppBottomSheetModal';

import { type FacilityCategory } from '@/shared/public-data';
import { layout, spacing } from '@/theme';

import type { RadiusMeters } from '@/features/places/types';

import { CIVIC_MACRO_THEMES, matchesMacroTheme } from '@/features/city/officialCategoryThemes';

import { useTerritoryDomain } from '@/stores/territoryStore';



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
  radiusMeters,
  onRadiusChange,
  radiusLabel,
}: TerritoryFilterModalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [headerHeight, setHeaderHeight] = useState(0);
  const [bodyHeight, setBodyHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);

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
    savedFacilityLayers,
    setFacilityLayers,
  } = useTerritoryDomain();
  // The shared handle has 20 points of padding, a 6-point inset and a 4-point indicator.
  const measuredHeight = headerHeight + bodyHeight + footerHeight + 30;
  const snapPoint = headerHeight && bodyHeight && footerHeight
    ? Math.ceil(Math.min(windowHeight - insets.top - spacing.sm, measuredHeight))
    : territoryDomain === 'calls' ? '85%' : '56%';

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
  }[] = [
    {
      id: 'school',
      label: 'Escolas',
      sublabel: 'Educação pública municipal',
    },
    {
      id: 'health',
      label: 'Saúde',
      sublabel: 'Postos, UPAs e hospitais',
    },
    {
      id: 'square',
      label: 'Praças e lazer',
      sublabel: 'Parques e áreas públicas',
    },
  ];

  return (
    <AppBottomSheetModal
      visible={visible}
      onClose={onClose}
      title={territoryDomain === 'calls' ? 'Filtros de chamados' : 'Filtros de serviços'}
      snapPoints={[snapPoint]}
      onHeaderHeightChange={setHeaderHeight}
    >
      <BottomSheetScrollView
        style={styles.filterModalScroll}
        contentContainerStyle={[
          styles.filterModalBody,
          { paddingBottom: spacing.md },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        onContentSizeChange={(_, height) => setBodyHeight(height)}
      >
        {territoryDomain === 'calls' && (
          <View style={styles.filterFormContainer}>
            {/* Seção 3: Situação */}
            <View style={styles.filterSection}>
              <SectionHeader title="Situação do chamado" />
              <View style={styles.segmentContainer}>
                {[
                  { value: 'all', label: 'Todos' },
                  { value: OPEN_STATUS, label: 'Abertos' },
                  { value: CLOSED_STATUS, label: 'Encerrados' },
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


            {/* Seção 1: Macro-temas Cívicos */}
            <View style={styles.filterSection}>
              <SectionHeader title="Categoria" />

              <AppSelect
                label="Categoria"
                placeholder="Buscar categoria…"
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
              <SectionHeader title="Tipo de serviço" />
              <AppSelect
                label="Tipo de serviço 1746"
                placeholder="Buscar tipo de serviço…"
                defaultValue="all"
                options={filteredServiceOptions}
                value={serviceType}
                onChange={onServiceTypeChange}
              />
            </View>


            {/* Seção 4: Período */}
            <View style={styles.filterSection}>
              <SectionHeader title="Período de abertura" />
              <View style={styles.periodTrack}>
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
              </View>
            </View>
          </View>
        )}

        {/* CONTEÚDO DA ABA: SERVIÇOS PÚBLICOS */}
        {territoryDomain === 'facilities' && (
          <View style={styles.filterFormContainer}>
            <View style={styles.filterSection}>
              <SectionHeader title="Tipos de serviço" />
              <AppText
                variant="caption"
                color="muted"
              >
                Mantenha pelo menos um tipo selecionado.
              </AppText>

              <View style={styles.facilityCardsContainer}>
                {FACILITY_CONFIGS.map((cfg) => {
                  const isSelected = savedFacilityLayers.includes(cfg.id);
                  const lastSelected = isSelected && savedFacilityLayers.length === 1;
                  return (
                    <Pressable
                      key={cfg.id}
                      accessibilityRole="checkbox"
                      accessibilityLabel={`Serviço ${cfg.label}`}
                      disabled={lastSelected}
                      accessibilityState={{ checked: isSelected, disabled: lastSelected }}
                      onPress={() => toggleFacility(cfg.id)}
                      style={({ pressed }) => [
                        styles.facilityCardRow,
                        isSelected && styles.facilityCardRowSelected,
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <View style={{ flex: 1, gap: 1 }}>
                        <AppText variant="label">
                          {cfg.label}
                        </AppText>
                        <AppText
                          variant="caption"
                          color="muted"
                        >
                          {cfg.sublabel}
                        </AppText>
                      </View>
                      <Ionicons
                        name={
                          isSelected ? 'checkmark-circle' : 'ellipse-outline'
                        }
                        size={layout.iconSize.md}
                        color={isSelected ? colors.primary : colors.muted}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        )}

      </BottomSheetScrollView>

      {/* Rodapé Fixo de Ações */}
      <View style={[styles.modalFooter, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
        onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}>
          <AppButton
            title="Limpar filtros"
            variant="quiet"
            accessibilityLabel="Limpar todos os filtros"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (territoryDomain === 'calls') onReset();
              else setFacilityLayers(FACILITY_CONFIGS.map(({ id }) => id));
            }}
          />

          <AppButton
            title={territoryDomain === 'calls' ? 'Ver chamados' : 'Ver serviços'}
            style={styles.confirmButton}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
          />
        </View>
    </AppBottomSheetModal>
  );
}

export const TerritoryFilterModal = memo(TerritoryFilterModalComponent);
