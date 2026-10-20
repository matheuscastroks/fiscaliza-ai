import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { layout, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import type { OfficialCallsOverview } from '@/shared/contracts';

interface Rio1746OverviewCardProps {
  overview?: OfficialCallsOverview | null;
  isLoading?: boolean;
}

export function Rio1746OverviewCard({
  overview,
  isLoading,
}: Rio1746OverviewCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  if (isLoading) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="sync" size={18} color={colors.muted} />
          <AppText variant="caption" color="muted">
            Carregando inteligência urbana da Central 1746...
          </AppText>
        </View>
      </View>
    );
  }

  if (!overview || overview.totalCalls === 0) {
    return null;
  }

  const openCalls = overview.openCalls ?? 0;
  const closedCalls = overview.closedCalls ?? 0;
  const total = overview.totalCalls ?? 0;

  return (
    <View style={styles.card}>
      {/* Top Banner: Official Data Seal */}
      <View style={styles.header}>
        <View style={styles.seal}>
          <Ionicons name="shield-checkmark" size={14} color="#0072BB" />
          <AppText variant="caption" style={styles.sealText}>
            DATA.RIO · CENTRAL 1746
          </AppText>
        </View>
        <AppText variant="caption" color="muted">
          Prefeitura do Rio
        </AppText>
      </View>

      {/* Title & Description */}
      <View style={styles.titleSection}>
        <AppText variant="sectionTitle" style={styles.title}>
          Inteligência dos Serviços Urbanos
        </AppText>
        <AppText variant="caption" color="muted" style={{ lineHeight: 18 }}>
          Monitoramento oficial de demandas municipais sincronizadas em tempo real.
        </AppText>
      </View>

      {/* KPI Stats Grid */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiItem}>
          <AppText variant="caption" color="muted">
            Total na base
          </AppText>
          <AppText variant="screenTitle" style={{ fontSize: 22, color: colors.ink }}>
            {total.toLocaleString('pt-BR')}
          </AppText>
        </View>

        <View style={styles.kpiItem}>
          <AppText variant="caption" color="muted">
            Em atendimento
          </AppText>
          <AppText variant="screenTitle" style={{ fontSize: 22, color: colors.accent }}>
            {openCalls.toLocaleString('pt-BR')}
          </AppText>
        </View>

        <View style={styles.kpiItem}>
          <AppText variant="caption" color="muted">
            Concluídos
          </AppText>
          <AppText variant="screenTitle" style={{ fontSize: 22, color: colors.completed }}>
            {closedCalls.toLocaleString('pt-BR')}
          </AppText>
        </View>
      </View>

      {/* Top Demand Categories */}
      {overview.topServices && overview.topServices.length > 0 && (
        <View style={styles.demandsSection}>
          <AppText variant="caption" color="muted" style={{ fontWeight: '700' }}>
            Principais demandas registradas:
          </AppText>
          <View style={styles.tagsContainer}>
            {overview.topServices.slice(0, 4).map((service, index) => (
              <View key={index} style={styles.tag}>
                <AppText variant="caption" color="ink" numberOfLines={1} style={{ fontSize: 11 }}>
                  {service.type} ({service.count})
                </AppText>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Navigation CTA */}
      <AppButton
        title="Ver chamados 1746 no mapa"
        variant="primary"
        onPress={() => router.push('/(tabs)/TerritoryScreen')}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: layout.radius.card,
      padding: spacing.md,
      gap: spacing.md,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    seal: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#0072BB14',
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: layout.radius.pill,
    },
    sealText: {
      color: '#0072BB',
      fontWeight: '800',
      fontSize: 10,
      letterSpacing: 0.5,
    },
    titleSection: {
      gap: 2,
    },
    title: {
      fontSize: 17,
    },
    kpiGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceSubdued,
      borderRadius: layout.radius.panel,
      padding: spacing.md,
    },
    kpiItem: {
      flex: 1,
      gap: 2,
    },
    demandsSection: {
      gap: spacing.xs,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    tag: {
      backgroundColor: colors.surfaceSubdued,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: layout.radius.pill,
    },
  });
}
