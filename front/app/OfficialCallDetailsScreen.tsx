import { OfficialChannel } from '@/features/city/OfficialChannel';
import { isOfficialCallClosed } from '@/shared/official-call-state';
import React, { useEffect, useState } from 'react';
import { officialCallStatus } from '@/features/city/officialCallStatus';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
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
  const { colors, isDark } = useTheme();
  const [saveFailed, setSaveFailed] = useState(false);
  const styles = useThemedStyles(createStyles);

  const { data, isLoading, isError, refetch, isRefetching } = useOfficialCall(id);
  const savedCalls = useFollowStore((s) => s.savedCalls);
  const toggleSavedCall = useFollowStore((s) => s.toggleSavedCall);
  const { busy, hydrated, persistenceError, updateSnapshots } =
    useFollowStore();
  const item = data || savedCalls.find((c) => c.id === id);
  useEffect(() => {
    if (data && useFollowStore.getState().isCallSaved(data.id))
      void updateSnapshots([data]);
  }, [data, updateSnapshots]);
  const isSaved = Boolean(item && savedCalls.some((c) => c.id === item.id));

  if (isLoading && !item) {
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

  if (!item) {
    return (
      <AppScreen>
        <AppHeader title="Chamado 1746" onBack={() => goBack()} />
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.risk} />
          <AppText variant="sectionTitle" style={{ textAlign: 'center' }}>
            Chamado indisponível
          </AppText>
          <AppText variant="body" color="muted" style={{ textAlign: 'center' }}>
            Não foi possível carregar as informações oficiais deste chamado.
          </AppText>
          <AppButton
            title="Tentar novamente"
            variant="primary"
            onPress={() => refetch()}
          />
        </View>
      </AppScreen>
    );
  }

  const isClosed = isOfficialCallClosed(item);

  const status = officialCallStatus(item, colors, isDark);
  const save = async () => {
    setSaveFailed(false);
    try {
      if (!(await toggleSavedCall(item))) setSaveFailed(true);
    } catch {
      setSaveFailed(true);
    }
  };

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
        title="Chamado 1746"
        onBack={() => goBack()}
      />

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
            }}
            tintColor={colors.ink}
            colors={[colors.ink]}
          />
        }
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        {!data && item && (
          <AppText variant="caption" color="muted">
            Última informação consultada e salva neste aparelho.
          </AppText>
        )}
        {isError && (
          <AppText color="risk">
            Atualização indisponível. Exibindo a última informação salva na sua
            conta.
          </AppText>
        )}
        {(persistenceError || saveFailed) && (
          <AppText color="risk" accessibilityRole="alert" accessibilityLiveRegion="polite">
            {persistenceError || 'Não foi possível salvar. Toque no coração para tentar novamente.'}
          </AppText>
        )}
        {/* Attribution Badge + Save Action */}
        <View style={styles.officialHeaderBadge}>
          <View style={{ flex: 1, gap: spacing.xxs }}>
            <AppText variant="caption" color="muted">
              Central 1746 · {item.serviceType}
            </AppText>
            <AppText variant="screenTitle" style={styles.mainTitle}>
              {item.serviceSubtype || item.serviceType}
            </AppText>
            <AppText variant="caption" color="muted" selectable>
              Protocolo {item.externalId}
            </AppText>
          </View>
          <Pressable
            disabled={!hydrated || busy}
            onPress={() => {
              void save();
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSaved, disabled: !hydrated || busy, busy }}
            accessibilityLabel={
              isSaved
                ? 'Remover dos chamados salvos neste aparelho'
                : 'Salvar chamado neste aparelho para acompanhar'
            }
            style={[
              styles.saveButton,
              { opacity: !hydrated || busy ? 0.5 : 1 },
            ]}
          >
            <Ionicons
              name={isSaved ? 'heart' : 'heart-outline'}
              size={24}
              color={isSaved ? colors.risk : colors.ink}
            />
          </Pressable>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.neighborhood}>
            <Ionicons name="location-outline" size={16} color={colors.muted} />
            <AppText variant="meta" color="muted" style={{ flex: 1 }}>
              {item.neighborhoodName || 'Bairro não informado'}
            </AppText>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusIndicator, { backgroundColor: status.color }]} />
            <AppText variant="meta" style={{ color: status.color, flexShrink: 1 }}>
              {status.label}
            </AppText>
          </View>
        </View>

        {/* Status / Situation Card */}
        <View style={styles.sectionCard}>
          <AppText variant="sectionTitle" style={styles.sectionHeading}>
            Atendimento
          </AppText>

          {item.organizationName && (
            <AppText variant="body">{item.organizationName}</AppText>
          )}
          {item.officialSituationType ? (
            <AppText variant="caption" color="muted">
              Tipo: {item.officialSituationType}
            </AppText>
          ) : null}
          {isClosed && (
            <AppText color="muted" variant="caption">
              Encerrado no 1746. Esse estado administrativo não confirma a
              resolução no local.
            </AppText>
          )}

          {item.statusJustification ? (
            <View style={styles.justificationBox}>
              <AppText
                variant="caption"
                color="muted"
                style={{ fontWeight: '700' }}
              >
                Justificativa oficial
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
                  Data de encerramento
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
                <AppText variant="label">
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

          {item.latitude != null && item.longitude != null &&
          Number.isFinite(item.latitude) && Number.isFinite(item.longitude) &&
          Math.abs(item.latitude) <= 90 && Math.abs(item.longitude) <= 180 ? (
            <View style={styles.mapContainer}>
              <ItemLocationMap
                id={item.id}
                latitude={item.latitude}
                longitude={item.longitude}
                neighborhood={item.neighborhoodName || undefined}
                address={item.neighborhoodName || 'Rio de Janeiro'}
                title={item.serviceSubtype}
                color={status.color}
                height={200}
                showExpandAction={true}
              />
            </View>
          ) : (
            <AppText
              variant="caption"
              color="muted"
              style={{ marginTop: spacing.sm }}
            >
              Coordenadas exatas não fornecidas pela prefeitura para este
              chamado.
            </AppText>
          )}
        </View>

        {/* Citizen Information & 1746 Channels */}
        <View style={[styles.sectionCard, styles.infoCard]}>
          <View style={styles.infoCardHeader}>
            <Ionicons
              name="information-circle"
              size={20}
              color={colors.accent}
            />
            <AppText
              variant="sectionTitle"
              color="ink"
              style={{ fontSize: 16 }}
            >
              Fonte e atendimento oficial
            </AppText>
          </View>
          <AppText variant="caption" color="muted" style={{ lineHeight: 18 }}>
            Fonte: DATA.RIO, da Prefeitura do Rio de Janeiro. O Fiscaliza aí é independente da prefeitura.
          </AppText>
          <AppText variant="caption" color="muted">
            O atendimento acontece no canal oficial da prefeitura.
          </AppText>
          <OfficialChannel />
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
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingVertical: spacing.xs,
      gap: spacing.sm,
    },
    saveButton: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: layout.radius.pill,
      backgroundColor: colors.surfaceSubdued,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingBottom: spacing.sm,
    },
    neighborhood: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    sectionCard: {
      paddingVertical: spacing.md,
      gap: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: colors.divider,
    },
    mainTitle: {
      fontSize: 24,
      lineHeight: 30,
    },
    sectionHeading: {
      fontSize: 16,
      marginBottom: spacing.xs,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      maxWidth: '55%',
      flexShrink: 1,
    },
    statusIndicator: {
      width: 7,
      height: 7,
      borderRadius: 4,
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
      gap: spacing.sm,
    },
    infoCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
  });
}
