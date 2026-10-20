import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
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

function formatPartitionDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr.trim());
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  return dateStr;
}

function formatSyncTimestamp(isoStr?: string | null): string {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoStr;
  }
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
            Carregando indicadores oficiais da Central 1746...
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
  const slaRate = overview.withinDeadlineRate;

  return (
    <View style={styles.card}>
      {/* Top Banner: Official Data Seal + Freshness */}
      <View style={styles.header}>
        <View style={styles.seal}>
          <Ionicons name="shield-checkmark" size={14} color="#0072BB" />
          <AppText variant="caption" style={styles.sealText}>
            DATA.RIO · CENTRAL 1746
          </AppText>
        </View>
        <AppText variant="caption" color="muted">
          Partição: {formatPartitionDate(overview.lastPartitionDate)}
        </AppText>
      </View>

      {/* Title & Freshness Metadata */}
      <View style={styles.titleSection}>
        <AppText variant="sectionTitle" style={styles.title}>
          Inteligência dos Serviços Urbanos
        </AppText>
        <AppText variant="caption" color="muted" style={{ lineHeight: 18 }}>
          Dados públicos oficiais da Prefeitura do Rio sincronizados via BigQuery
          {overview.lastSyncedAt
            ? ` · Atualizado em ${formatSyncTimestamp(overview.lastSyncedAt)}`
            : ''}
        </AppText>
      </View>

      {/* KPI Stats Grid */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiItem}>
          <AppText variant="caption" color="muted">
            Chamados
          </AppText>
          <AppText variant="screenTitle" style={{ fontSize: 20, color: colors.ink }}>
            {total.toLocaleString('pt-BR')}
          </AppText>
        </View>

        <View style={styles.kpiItem}>
          <AppText variant="caption" color="muted">
            Em aberto
          </AppText>
          <AppText variant="screenTitle" style={{ fontSize: 20, color: colors.accent }}>
            {openCalls.toLocaleString('pt-BR')}
          </AppText>
        </View>

        <View style={styles.kpiItem}>
          <AppText variant="caption" color="muted">
            Encerrados
          </AppText>
          <AppText variant="screenTitle" style={{ fontSize: 20, color: colors.completed }}>
            {closedCalls.toLocaleString('pt-BR')}
          </AppText>
        </View>

        {slaRate !== undefined && (
          <View style={styles.kpiItem}>
            <AppText variant="caption" color="muted">
              No prazo
            </AppText>
            <AppText variant="screenTitle" style={{ fontSize: 20, color: colors.completed }}>
              {slaRate}%
            </AppText>
          </View>
        )}
      </View>

      {/* Top Demand Categories */}
      {overview.topServices && overview.topServices.length > 0 && (
        <View style={styles.demandsSection}>
          <AppText variant="caption" color="muted" style={{ fontWeight: '700' }}>
            Principais demandas no recorte:
          </AppText>
          <View style={styles.tagsContainer}>
            {overview.topServices.slice(0, 4).map((service, index) => (
              <Pressable
                key={index}
                style={styles.tag}
                onPress={() => router.push('/(tabs)/TerritoryScreen')}
              >
                <AppText variant="caption" color="ink" numberOfLines={1} style={{ fontSize: 11 }}>
                  {service.type} ({service.count.toLocaleString('pt-BR')})
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Navigation CTAs */}
      <View style={styles.actionsRow}>
        <View style={{ flex: 1 }}>
          <AppButton
            title="Explorar no mapa"
            variant="primary"
            onPress={() => router.push('/(tabs)/TerritoryScreen')}
          />
        </View>
        <View style={{ flex: 1 }}>
          <AppButton
            title="Desfechos e prazos"
            variant="secondary"
            onPress={() => router.push('/ResultsScreen')}
          />
        </View>
      </View>
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
      gap: spacing.xs,
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
    actionsRow: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
  });
}
