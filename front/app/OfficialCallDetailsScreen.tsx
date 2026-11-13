import { OfficialChannel } from '@/features/city/OfficialChannel';
import { isOfficialCallClosed } from '@/shared/official-call-state';
import React, { useEffect, useState } from 'react';
import {
  describeOfficialPhase,
  officialCallStatus,
  resolveOfficialCallDeadline,
} from '@/features/city/officialCallStatus';
import { resolveServiceCategoryTheme } from '@/features/city/officialCategoryThemes';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Share,
} from 'react-native';
import * as Haptics from 'expo-haptics';
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
import { OfficialCallTimeline } from '@/components/official/OfficialCallTimeline';
import { goBack } from '@/utils/navigation';
import { formatCallDateTime, formatTimeRemaining } from '@/features/city/formatDates';
import { fontSizes } from '@/theme/typography';
import { useShallow } from 'zustand/react/shallow';
import { AppToast } from '@/components/ui/AppToast';
import { copyText } from '@/utils/clipboard';

export default function OfficialCallDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [saveFailed, setSaveFailed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const styles = useThemedStyles(createStyles);

  const { data, isLoading, isError, error, refetch, isRefetching } =
    useOfficialCall(id);
  // Sem rede é diferente de chamado inexistente: um pede para tentar de novo, o outro não.
  const offline = error?.name === 'NetworkError';
  const savedCalls = useFollowStore((s) => s.savedCalls);
  const toggleSavedCall = useFollowStore((s) => s.toggleSavedCall);
  const { busy, hydrated, persistenceError, updateSnapshots } = useFollowStore(useShallow((s) => ({ busy: s.busy, hydrated: s.hydrated, persistenceError: s.persistenceError, updateSnapshots: s.updateSnapshots })));
  const item = data || savedCalls.find((c) => c.id === id);
  useEffect(() => {
    if (data && useFollowStore.getState().isCallSaved(data.id))
      void updateSnapshots([data]);
  }, [data, updateSnapshots]);
  const isSaved = Boolean(item && savedCalls.some((c) => c.id === item.id));

  if (isLoading && !item) {
    return (
      <AppScreen>
        <AppHeader title="Chamado" onBack={() => goBack()} />
        <View style={styles.centerContainer}>
          <Ionicons name="sync" size={layout.iconSize.lg} color={colors.muted} />
          <AppText variant="body" color="muted">
            Carregando dados oficiais do chamado…
          </AppText>
        </View>
      </AppScreen>
    );
  }

  if (!item) {
    return (
      <AppScreen>
        <AppHeader title="Chamado" onBack={() => goBack()} />
        <View style={styles.centerContainer}>
          <Ionicons
            name={offline ? 'cloud-offline-outline' : 'alert-circle-outline'}
            size={layout.iconSize.lg}
            color={offline ? colors.muted : colors.risk}
          />
          <AppText variant="sectionTitle" accessibilityRole="header" style={{ textAlign: 'center' }}>
            {offline ? 'Sem internet no momento' : 'Chamado indisponível'}
          </AppText>
          <AppText variant="body" color="muted" style={{ textAlign: 'center' }}>
            {offline
              ? 'Confira sua conexão e tente de novo.'
              : 'Não achamos este chamado nos dados da Prefeitura. Ele pode ter saído da base do 1746.'}
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
  const deadlineInfo = resolveOfficialCallDeadline(item, isClosed);
  const categoryTheme = resolveServiceCategoryTheme(
    item.serviceType,
    item.serviceSubtype,
  );

  const save = async () => {
    setSaveFailed(false);
    try {
      if (!(await toggleSavedCall(item))) setSaveFailed(true);
    } catch {
      setSaveFailed(true);
    }
  };

  const formatSla = () => {
    const remaining = formatTimeRemaining(item.timeRemaining, item.timeUnit);
    if (!remaining) return null;
    const typeSuffix =
      item.deadlineType === 'D'
        ? ' (diagnóstico)'
        : item.deadlineType === 'F'
        ? ' (finalização)'
        : '';
    return `${remaining}${typeSuffix}`;
  };

  const slaLabel = formatSla();
  const fullLocationLabel = [
    item.streetName,
    item.neighborhoodName,
    item.subprefecture,
    'Rio de Janeiro',
  ]
    .filter(Boolean)
    .join(' · ');

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          `Chamado 1746: ${item.serviceSubtype || item.serviceType}\n` +
          `Protocolo: ${item.externalId}\n` +
          `Situação: ${status.label}\n` +
          (deadlineInfo ? `Prazo: ${deadlineInfo.label}\n` : '') +
          `Local: ${fullLocationLabel}\n` +
          `Acompanhe este chamado pelo Fiscaliza aí`,
        title: `Protocolo 1746 nº ${item.externalId}`,
      });
    } catch {
      // Ignora cancelamentos de compartilhamento
    }
  };

  return (
    <AppScreen>
      <AppHeader
        title="Chamado"
        onBack={() => goBack()}
        rightElement={
          <View style={styles.headerActions}>
            <Pressable
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel="Compartilhar chamado"
              style={({ pressed }) => [
                styles.actionButton,
                pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] },
              ]}
            >
              <Ionicons name="share-social-outline" size={layout.iconSize.md} color={colors.ink} />
            </Pressable>

            <Pressable
              disabled={!hydrated || busy}
              onPress={() => {
                void save();
              }}
              accessibilityRole="checkbox"
              accessibilityState={{
                checked: isSaved,
                disabled: !hydrated || busy,
                busy,
              }}
              accessibilityLabel={
                isSaved
                  ? 'Remover dos chamados salvos neste celular'
                  : 'Salvar chamado neste celular para acompanhar'
              }
              style={({ pressed }) => [
                styles.saveButton,
                { opacity: !hydrated || busy ? 0.5 : pressed ? 0.75 : 1 },
              ]}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={layout.iconSize.md}
                color={isSaved ? colors.accent : colors.ink}
              />
            </Pressable>
          </View>
        }
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
            Última informação consultada e salva neste celular.
          </AppText>
        )}
        {isError && (
          <AppText color="risk">
            {offline ? 'Sem internet no momento. ' : 'Não conseguimos atualizar. '}
            Mostrando o que você já tinha salvo.
          </AppText>
        )}
        {(persistenceError || saveFailed) && (
          <AppText
            color="risk"
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {persistenceError ||
              'Não conseguimos salvar. Toque em Salvar para tentar de novo.'}
          </AppText>
        )}

        {/* Cabeçalho editorial do chamado (sem card aninhado) */}
        <View style={styles.officialHeaderBadge}>
          <View style={styles.headerTextCol}>
            <View style={styles.categoryLine}>
              <Ionicons
                name={
                  categoryTheme.icon as React.ComponentProps<
                    typeof Ionicons
                  >['name']
                }
                size={layout.iconSize.sm}
                color={colors.muted}
              />
              <AppText variant="caption" color="muted" numberOfLines={1}>
                {item.serviceType}
              </AppText>
            </View>
            <AppText variant="screenTitle" accessibilityRole="header" style={styles.mainTitle}>
              {item.serviceSubtype || item.serviceType}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Copiar protocolo ${item.externalId}`}
              hitSlop={{ top: 12, bottom: 12 }}
              onPress={async () => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                try {
                  if (await copyText(item.externalId)) {
                    setToast('Protocolo copiado');
                    return;
                  }
                } catch {
                  // Sem área de transferência: cai no compartilhamento abaixo.
                }
                await Share.share({
                  message: item.externalId,
                  title: `Protocolo 1746 nº ${item.externalId}`,
                }).catch(() => undefined);
              }}
              style={({ pressed }) => [
                styles.protocolPill,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons name="copy-outline" size={layout.iconSize.sm} color={colors.muted} />
              <AppText variant="protocol" color="muted">
                Protocolo {item.externalId}
              </AppText>
            </Pressable>
          </View>

        </View>

        {/* Badge de Prazo Oficial (SLA) em Destaque */}
        {deadlineInfo && (
          <View
            style={[
              styles.slaPill,
              deadlineInfo.isOverdue ? styles.slaPillOverdue : styles.slaPillNormal,
            ]}
          >
            <Ionicons
              name={deadlineInfo.isOverdue ? 'alert-circle' : 'time-outline'}
              size={layout.iconSize.sm}
              color={deadlineInfo.isOverdue ? colors.risk : colors.onSurfaceBrand}
            />
            <AppText
              variant="caption"
              style={[
                styles.slaPillText,
                { color: deadlineInfo.isOverdue ? colors.risk : colors.onSurfaceBrand },
              ]}
            >
              {deadlineInfo.label}
            </AppText>
          </View>
        )}

        <View style={styles.summaryRow}>
          <View style={styles.neighborhood}>
            <Ionicons name="location-outline" size={layout.iconSize.sm} color={colors.muted} />
            <AppText variant="meta" color="muted" style={{ flex: 1 }}>
              {[item.streetName, item.neighborhoodName || 'Bairro não informado']
                .filter(Boolean)
                .join(' · ')}
            </AppText>
          </View>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: status.color },
              ]}
            />
            <AppText
              variant="meta"
              style={{ color: status.color, flexShrink: 1 }}
            >
              {status.label}
            </AppText>
          </View>
        </View>

        {/* Seção: Atendimento */}
        <View style={styles.sectionCard}>
          <AppText variant="sectionTitle" style={styles.sectionHeading}>
            Atendimento
          </AppText>

          {item.organizationName ? (
            <AppText variant="body">{item.organizationName}</AppText>
          ) : (
            <AppText variant="body" color="muted">
              Órgão municipal não informado
            </AppText>
          )}

          {item.serviceCategory || item.officialSituationType ? (
            <AppText variant="caption" color="muted">
              {[
                item.serviceCategory,
                describeOfficialPhase(item.officialSituationType),
              ]
                .filter(Boolean)
                .join(' · ')}
            </AppText>
          ) : null}

          {item.complaintsCount != null && item.complaintsCount > 0 ? (
            <AppText variant="caption" color="muted">
              {item.complaintsCount === 1
                ? '1 reclamação registrada neste protocolo'
                : `${item.complaintsCount} reclamações registradas neste protocolo`}
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
              <AppText variant="caption" color="muted">
                Justificativa oficial
              </AppText>
              <AppText variant="body" color="ink">
                {item.statusJustification}
              </AppText>
            </View>
          ) : null}
        </View>

        {/* Seção: Linha do Tempo Oficial */}
        <View style={styles.sectionCard}>
          <AppText variant="sectionTitle" style={styles.sectionHeading}>
            Linha do tempo oficial
          </AppText>
          <OfficialCallTimeline call={item} />
        </View>

        {/* Seção: Prazos e datas */}
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
                {formatCallDateTime(item.openedAt)}
              </AppText>
            </View>

            <View style={styles.gridItem}>
              <AppText variant="caption" color="muted">
                Prazo estimado
              </AppText>
              <AppText variant="label" color="ink">
                {formatCallDateTime(item.targetDate)}
              </AppText>
            </View>

            {slaLabel ? (
              <View style={styles.gridItem}>
                <AppText variant="caption" color="muted">
                  Prazo da Carta de Serviços
                </AppText>
                <AppText variant="label" color="ink">
                  {slaLabel}
                </AppText>
              </View>
            ) : null}

            {item.diagnosisTargetDate ? (
              <View style={styles.gridItem}>
                <AppText variant="caption" color="muted">
                  Previsão de diagnóstico
                </AppText>
                <AppText variant="label" color="ink">
                  {formatCallDateTime(item.diagnosisTargetDate)}
                </AppText>
              </View>
            ) : null}

            {item.closedAt ? (
              <View style={styles.gridItem}>
                <AppText variant="caption" color="muted">
                  Data de encerramento
                </AppText>
                <AppText variant="label" color="ink">
                  {formatCallDateTime(item.closedAt)}
                </AppText>
              </View>
            ) : null}

            {deadlineInfo ? (
              <View style={styles.gridItem}>
                <AppText variant="caption" color="muted">
                  Conformidade de prazo
                </AppText>
                <AppText
                  variant="label"
                  color={deadlineInfo.isOverdue ? 'risk' : 'ink'}
                >
                  {deadlineInfo.label}
                </AppText>
              </View>
            ) : null}
          </View>
        </View>

        {/* Seção: Localização */}
        <View style={styles.sectionCard}>
          <AppText variant="sectionTitle" style={styles.sectionHeading}>
            Localização
          </AppText>
          <View style={styles.locationSummary}>
            <Ionicons name="location-outline" size={layout.iconSize.md} color={colors.ink} />
            <AppText variant="body" color="ink" style={{ flex: 1 }} selectable>
              {fullLocationLabel}
            </AppText>
          </View>

          {item.latitude != null &&
          item.longitude != null &&
          Number.isFinite(item.latitude) &&
          Number.isFinite(item.longitude) &&
          Math.abs(item.latitude) <= 90 &&
          Math.abs(item.longitude) <= 180 ? (
            <View style={styles.mapContainer}>
              <ItemLocationMap
                id={item.id}
                latitude={item.latitude}
                longitude={item.longitude}
                neighborhood={item.neighborhoodName || undefined}
                address={fullLocationLabel}
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

        {/* Seção: De onde vem e onde pedir */}
        <View style={[styles.sectionCard, styles.infoCard]}>
          <AppText variant="sectionTitle" style={styles.sectionHeading}>
            De onde vem e onde pedir
          </AppText>
          <AppText variant="caption" color="muted" style={{ lineHeight: 18 }}>
            Fonte: Prefeitura do Rio (Data.Rio). O Fiscaliza aí não faz parte
            da Prefeitura.
          </AppText>
          <AppText variant="caption" color="muted">
            Para pedir ou acompanhar, use o canal oficial da Prefeitura.
          </AppText>
        </View>
      </ScrollView>
      <View
        style={[
          styles.officialAction,
          { paddingBottom: Math.max(insets.bottom, spacing.md) },
        ]}
      >
        <OfficialChannel variant="primary" />
      </View>
      <AppToast message={toast} onDismiss={() => setToast(null)} type="info" />
    </AppScreen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    officialAction: {
      paddingHorizontal: spacing.contentPadding,
      paddingTop: spacing.sm,
      backgroundColor: colors.canvas,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
    },
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
      // Ações em cima, título com a largura toda (títulos longos não quebram no meio da palavra).
      flexDirection: 'column',
      alignItems: 'stretch',
    },
    headerTextCol: {
      flex: 1,
      gap: spacing.xxs,
    },
    categoryLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xxs,
    },
    saveButton: {
      width: layout.touchTarget.minWidth,
      height: layout.touchTarget.minHeight,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: layout.radius.pill,
      backgroundColor: colors.surfaceSubdued,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: spacing.xs,
    },
    actionButton: {
      width: layout.touchTarget.minWidth,
      height: layout.touchTarget.minHeight,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: layout.radius.pill,
      backgroundColor: colors.surfaceSubdued,
    },
    protocolPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      alignSelf: 'flex-start',
      marginTop: 2,
    },
    slaPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingVertical: 5,
      paddingHorizontal: 12,
      borderRadius: layout.radius.pill,
      borderWidth: 1,
      marginTop: -spacing.xs,
      marginBottom: spacing.xs,
    },
    slaPillOverdue: {
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
      borderColor: 'rgba(239, 68, 68, 0.25)',
    },
    slaPillNormal: {
      backgroundColor: colors.surfaceSubdued,
      borderColor: colors.border,
    },
    slaPillText: {
      fontWeight: '600',
      fontSize: fontSizes.caption,
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
      fontSize: fontSizes.screenTitle,
      lineHeight: 30,
    },
    sectionHeading: {
      fontSize: fontSizes.body,
      marginBottom: spacing.xxs,
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
      borderRadius: layout.radius.xs,
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
  });
}
