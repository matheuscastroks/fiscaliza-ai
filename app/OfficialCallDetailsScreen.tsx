import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { layout, spacing } from '@/theme';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { ItemLocationMap } from '@/components/ui/ItemLocationMap';
import { useOfficialCall } from '@/features/city/useOfficialCalls';
import { useFollowStore } from '@/stores/followStore';
import { goBack } from '@/utils/navigation';

export default function OfficialCallDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const { data: item, isLoading, isError, refetch } = useOfficialCall(id);
  const savedCalls = useFollowStore((s) => s.savedCalls);
  const toggleSavedCall = useFollowStore((s) => s.toggleSavedCall);
  const isSaved = Boolean(item && savedCalls.some((c) => c.id === item.id));

  if (isLoading) {
    return (
      <AppScreen>
        <AppHeader title="Chamado 1746" onBack={() => goBack()} />
        <View style={styles.centerContainer}>
          <Ionicons name="sync" size={32} color={colors.muted} />
          <AppText variant="body" color="muted">
            Carregando dados oficiais do chamado...
          </AppText>
        </View>
      </AppScreen>
    );
  }

  if (isError || !item) {
    return (
      <AppScreen>
        <AppHeader title="Chamado 1746" onBack={() => goBack()} />
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.risk} />
          <AppText variant="sectionTitle" style={{ textAlign: 'center' }}>
            Chamado não encontrado
          </AppText>
          <AppText variant="body" color="muted" style={{ textAlign: 'center' }}>
            Não foi possível carregar as informações oficiais deste chamado.
          </AppText>
          <AppButton title="Tentar novamente" variant="primary" onPress={() => refetch()} />
        </View>
      </AppScreen>
    );
  }

  const isClosed = Boolean(
    item.closedAt ||
    item.officialStatus === 'Encerrado' ||
    item.officialSituation?.toLowerCase().includes('encerrad')
  );

  const situationColor = isClosed ? colors.completed : colors.accent;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <AppScreen>
      <AppHeader
        title={`Chamado #${item.externalId}`}
        context="Central 1746 · Prefeitura do Rio"
        onBack={() => goBack()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        {/* Attribution Badge + Save Action */}
        <View style={styles.officialHeaderBadge}>
          <View style={styles.badgeShield}>
            <Ionicons name="shield-checkmark" size={16} color="#0072BB" />
            <AppText variant="caption" style={styles.officialBadgeText}>
              DADO OFICIAL PÚBLICO · DATA.RIO
            </AppText>
          </View>
          <Pressable
            onPress={() => toggleSavedCall(item)}
            accessibilityRole="button"
            accessibilityLabel={
              isSaved ? 'Remover dos chamados salvos' : 'Salvar chamado para acompanhar'
            }
            style={[
              styles.badgeShield,
              isSaved && { backgroundColor: colors.ink },
            ]}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={14}
              color={isSaved ? colors.onAccent : '#0072BB'}
            />
            <AppText
              variant="caption"
              style={[
                styles.officialBadgeText,
                isSaved && { color: colors.onAccent },
              ]}
            >
              {isSaved ? 'Salvo' : 'Salvar'}
            </AppText>
          </Pressable>
        </View>

        {/* Main Service Card */}
        <View style={styles.sectionCard}>
          <AppText variant="label" color="muted" style={styles.categoryLabel}>
            {item.serviceType}
          </AppText>
          <AppText variant="screenTitle" style={styles.mainTitle}>
            {item.serviceSubtype}
          </AppText>

          {item.organizationName ? (
            <View style={styles.orgTag}>
              <Ionicons name="business-outline" size={14} color={colors.ink} />
              <AppText variant="label" color="ink">
                Órgão executor: {item.organizationName}
              </AppText>
            </View>
          ) : null}
        </View>

        {/* Status / Situation Card */}
        <View style={styles.sectionCard}>
          <AppText variant="sectionTitle" style={styles.sectionHeading}>
            Situação do atendimento
          </AppText>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: situationColor },
              ]}
            />
            <View style={{ flex: 1 }}>
              <AppText
                variant="body"
                style={{ fontWeight: '700', color: situationColor }}
              >
                {item.officialSituation || item.officialStatus || 'Registrado'}
              </AppText>
              {item.officialSituationType ? (
                <AppText variant="caption" color="muted">
                  Tipo: {item.officialSituationType}
                </AppText>
              ) : null}
            </View>
          </View>

          {item.statusJustification ? (
            <View style={styles.justificationBox}>
              <AppText variant="caption" color="muted" style={{ fontWeight: '700' }}>
                Despacho / Justificativa oficial:
              </AppText>
              <AppText variant="body" color="ink">
                {item.statusJustification}
              </AppText>
            </View>
          ) : null}
        </View>

        {/* Timelines and Deadlines */}
        <View style={styles.sectionCard}>
          <AppText variant="sectionTitle" style={styles.sectionHeading}>
            Prazos e datas
          </AppText>

          <View style={styles.infoGrid}>
            <View style={styles.gridItem}>
              <AppText variant="caption" color="muted">
                Data de abertura
              </AppText>
              <AppText variant="label" color="ink">
                {formatDate(item.openedAt)}
              </AppText>
            </View>

            <View style={styles.gridItem}>
              <AppText variant="caption" color="muted">
                Prazo estimado
              </AppText>
              <AppText variant="label" color="ink">
                {formatDate(item.targetDate)}
              </AppText>
            </View>

            {item.closedAt ? (
              <View style={styles.gridItem}>
                <AppText variant="caption" color="muted">
                  Data de conclusão
                </AppText>
                <AppText variant="label" color="ink">
                  {formatDate(item.closedAt)}
                </AppText>
              </View>
            ) : null}

            {item.withinDeadline ? (
              <View style={styles.gridItem}>
                <AppText variant="caption" color="muted">
                  Conformidade de prazo
                </AppText>
                <AppText
                  variant="label"
                  color={item.withinDeadline.toLowerCase().includes('no prazo') ? 'completed' : 'risk'}
                >
                  {item.withinDeadline}
                </AppText>
              </View>
            ) : null}
          </View>
        </View>

        {/* Territory & Map */}
        <View style={styles.sectionCard}>
          <AppText variant="sectionTitle" style={styles.sectionHeading}>
            Localização
          </AppText>
          <View style={styles.locationSummary}>
            <Ionicons name="location-outline" size={18} color={colors.ink} />
            <AppText variant="body" color="ink" style={{ flex: 1 }}>
              {[item.neighborhoodName, item.subprefecture, 'Rio de Janeiro']
                .filter(Boolean)
                .join(' · ')}
            </AppText>
          </View>

          {item.latitude != null && item.longitude != null ? (
            <View style={styles.mapContainer}>
              <ItemLocationMap
                id={item.id}
                latitude={item.latitude}
                longitude={item.longitude}
                neighborhood={item.neighborhoodName || undefined}
                address={item.neighborhoodName || 'Rio de Janeiro'}
                title={item.serviceSubtype}
                color="#0072BB"
                height={200}
                showExpandAction={true}
              />
            </View>
          ) : (
            <AppText variant="caption" color="muted" style={{ marginTop: spacing.sm }}>
              Coordenadas exatas não fornecidas pela prefeitura para este chamado.
            </AppText>
          )}
        </View>

        {/* Citizen Information & 1746 Channels */}
        <View style={[styles.sectionCard, styles.infoCard]}>
          <View style={styles.infoCardHeader}>
            <Ionicons name="information-circle" size={20} color={colors.accent} />
            <AppText variant="sectionTitle" color="ink" style={{ fontSize: 16 }}>
              Sobre a Central 1746
            </AppText>
          </View>
          <AppText variant="caption" color="muted" style={{ lineHeight: 18 }}>
            O Fiscaliza Aí é uma plataforma independente de inteligência e transparência
            urbana. As informações acima são sincronizadas diretamente do repositório
            público DATA.RIO da Prefeitura da Cidade do Rio de Janeiro.
          </AppText>
          <Pressable
            style={styles.externalLink}
            onPress={() => Linking.openURL('https://www.1746.rio')}
            accessibilityRole="link"
          >
            <AppText variant="label" color="accent" style={{ fontWeight: '700' }}>
              Acessar portal oficial 1746.rio
            </AppText>
            <Ionicons name="open-outline" size={14} color={colors.accent} />
          </Pressable>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      gap: spacing.md,
    },
    scrollContent: {
      padding: spacing.contentPadding,
      gap: spacing.md,
    },
    officialHeaderBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.xs,
    },
    badgeShield: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#0072BB16',
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: layout.radius.pill,
    },
    officialBadgeText: {
      color: '#0072BB',
      fontWeight: '800',
      fontSize: 11,
      letterSpacing: 0.5,
    },
    sectionCard: {
      backgroundColor: colors.surface,
      borderRadius: layout.radius.card,
      padding: spacing.lg,
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    categoryLabel: {
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontSize: 12,
    },
    mainTitle: {
      fontSize: 20,
      lineHeight: 26,
    },
    orgTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.surfaceSubdued,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: layout.radius.pill,
      alignSelf: 'flex-start',
      marginTop: spacing.xs,
    },
    sectionHeading: {
      fontSize: 16,
      marginBottom: spacing.xs,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    statusIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    justificationBox: {
      backgroundColor: colors.surfaceSubdued,
      borderRadius: layout.radius.panel,
      padding: spacing.md,
      gap: 4,
      marginTop: spacing.xs,
    },
    infoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    gridItem: {
      minWidth: '45%',
      flex: 1,
      gap: 2,
    },
    locationSummary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    mapContainer: {
      marginTop: spacing.sm,
      borderRadius: layout.radius.panel,
      overflow: 'hidden',
    },
    infoCard: {
      backgroundColor: colors.surfaceSubdued,
      borderColor: 'transparent',
    },
    infoCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    externalLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.xs,
    },
  });
}
