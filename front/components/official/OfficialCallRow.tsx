import React, { memo, useState } from 'react';
import { StyleSheet, View, Pressable, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { layout, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { useFollowStore } from '@/stores/followStore';
import { resolveServiceCategoryTheme } from '@/features/city/officialCategoryThemes';
import type { OfficialCall } from '@/shared/contracts';
import { isOfficialCallClosed } from '@/shared/official-call-state';
import { formatCallDate, formatTimeRemainingShort } from '@/features/city/formatDates';
import {
  officialCallStatus,
  resolveOfficialCallDeadline,
} from '@/features/city/officialCallStatus';
import { fontSizes } from '@/theme/typography';
import { lightColors } from '@/theme/colors';

export interface OfficialCallRowProps {
  call: OfficialCall;
  onPress: () => void;
  onLocateOnMap?: () => void;
  width?: ViewStyle['width'];
}

function formatRelativeTime(dateIso?: string | null): string | null {
  if (!dateIso) return null;
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 0) return 'Recente';
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) {
    if (diffHours <= 1) return 'Hoje';
    return `Há ${diffHours}h`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 30) return `Há ${diffDays} dias`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return 'Há 1 mês';
  if (diffMonths < 12) return `Há ${diffMonths} meses`;
  const diffYears = Math.floor(diffDays / 365);
  return `Há ${diffYears} ${diffYears === 1 ? 'ano' : 'anos'}`;
}

export const OfficialCallRow = memo(function OfficialCallRow({
  call,
  onPress,
  onLocateOnMap,
  width,
}: OfficialCallRowProps) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isSaved = useFollowStore((s) =>
    s.savedCalls.some((c) => c.id === call.id),
  );
  const hydrated = useFollowStore((s) => s.hydrated);
  const busy = useFollowStore((s) => s.busy);
  const toggleSavedCall = useFollowStore((s) => s.toggleSavedCall);
  const [saveError, setSaveError] = useState('');
  const theme = resolveServiceCategoryTheme(
    call.serviceType,
    call.serviceSubtype,
  );

  const title = call.serviceSubtype || call.serviceType;
  const { label: situation, color: statusColor } = officialCallStatus(
    call,
    colors,
    isDark,
  );
  const isClosed = isOfficialCallClosed(call);
  const deadlineInfo = resolveOfficialCallDeadline(call, isClosed);
  const isOverdue = !isClosed && deadlineInfo?.isOverdue === true;

  const openedDate = formatCallDate(call.openedAt);
  const openedLabel = openedDate
    ? `Aberto em ${openedDate}`
    : 'Data de abertura não informada';

  const relativeTime = formatRelativeTime(call.openedAt);
  const agencyName = call.organizationName?.trim() || null;

  const locationText = [
    call.streetName,
    call.neighborhoodName || 'Bairro não informado',
  ]
    .filter(Boolean)
    .join(' · ');

  const slaText = isClosed
    ? null
    : isOverdue
      ? 'Prazo vencido'
      : formatTimeRemainingShort(call.timeRemaining, call.timeUnit)
        ? `Restam ${formatTimeRemainingShort(call.timeRemaining, call.timeUnit)}`
        : null;

  const toggle = async () => {
    setSaveError('');
    try {
      if (!(await toggleSavedCall(call)))
        setSaveError(
          'Não foi possível atualizar seus acompanhamentos. Toque em Salvar para tentar novamente.',
        );
    } catch {
      setSaveError(
        'Não foi possível atualizar seus acompanhamentos. Toque em Salvar para tentar novamente.',
      );
    }
  };

  return (
    <View style={[styles.card, width !== undefined && { width }]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${locationText}. ${situation}. ${openedLabel}. Protocolo ${call.externalId}. Ver detalhes do chamado.`}
        style={({ pressed }) => [styles.pressable, pressed && { opacity: 0.88 }]}
      >
        {/* Header: Categoria, Órgão, Situação e Coração */}
        <View style={styles.header}>
          <View style={styles.categoryCluster}>
            <View style={styles.categoryBadge}>
              <Ionicons
                name={theme.icon as React.ComponentProps<typeof Ionicons>['name']}
                size={15}
                color={colors.ink}
              />
              <AppText
                variant="caption"
                numberOfLines={1}
                style={styles.categoryLabel}
              >
                {theme.label}
              </AppText>
            </View>

            {agencyName && (
              <View style={[styles.agencyBadge, { backgroundColor: colors.surfaceSubdued }]}>
                <AppText variant="caption" numberOfLines={1} style={styles.agencyText}>
                  {agencyName}
                </AppText>
              </View>
            )}
          </View>

          <View style={styles.headerRight}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isDark
                    ? statusColor + '25'
                    : statusColor + '18',
                },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: statusColor }]}
              />
              <AppText
                variant="caption"
                style={[styles.statusText, { color: statusColor }]}
              >
                {situation}
              </AppText>
            </View>

            <Pressable
              onPress={(e) => {
                e?.stopPropagation?.();
                void toggle();
              }}
              disabled={!hydrated || busy}
              accessibilityRole="checkbox"
              accessibilityState={{
                checked: isSaved,
                disabled: !hydrated || busy,
                busy,
              }}
              accessibilityLabel={
                isSaved
                  ? `Deixar de acompanhar chamado ${call.externalId}`
                  : `Salvar chamado ${call.externalId}`
              }
              accessibilityHint="Guarda este chamado nos seus acompanhamentos."
              hitSlop={8}
              style={({ pressed }) => [
                styles.heart,
                { backgroundColor: isDark ? colors.surfaceSubdued : colors.canvas },
                { opacity: !hydrated || busy ? 0.6 : pressed ? 0.75 : 1 },
              ]}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={layout.iconSize.md}
                color={isSaved ? colors.accent : colors.muted}
              />
            </Pressable>
          </View>
        </View>

        {/* Título Principal */}
        <AppText variant="sectionTitle" numberOfLines={2} style={styles.title}>
          {title}
        </AppText>

        {/* Localização */}
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={layout.iconSize.sm} color={colors.muted} />
          <AppText
            color="muted"
            variant="caption"
            style={styles.flex}
            numberOfLines={1}
          >
            {locationText}
          </AppText>
        </View>

        {/* Rodapé Inteligente: Metadados Cívicos e Ações */}
        <View style={styles.footerRow}>
          <View style={styles.footerLeft}>
            {relativeTime && (
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={layout.iconSize.sm} color={colors.muted} />
                <AppText variant="caption" color="muted" style={styles.metaChipText}>
                  {relativeTime}
                </AppText>
              </View>
            )}

            {slaText && (
              <View
                style={[
                  styles.slaBadge,
                  isOverdue
                    ? { backgroundColor: colors.riskSurface, borderColor: colors.risk }
                    : { backgroundColor: colors.surfaceSubdued, borderColor: colors.border },
                ]}
              >
                <Ionicons
                  name={isOverdue ? 'alert-circle' : 'hourglass-outline'}
                  size={layout.iconSize.sm}
                  color={isOverdue ? colors.risk : colors.onSurfaceBrand}
                />
                <AppText
                  variant="caption"
                  style={[
                    styles.slaBadgeText,
                    { color: isOverdue ? colors.risk : colors.ink },
                  ]}
                >
                  {slaText}
                </AppText>
              </View>
            )}

            <View style={[styles.protocolChip, { backgroundColor: colors.surfaceSubdued }]}>
              <AppText variant="caption" color="muted" style={styles.protocolText}>
                #{call.externalId}
              </AppText>
            </View>
          </View>

          <View style={styles.footerRight}>
            {onLocateOnMap &&
            call.latitude != null &&
            call.longitude != null &&
            Number.isFinite(call.latitude) &&
            Number.isFinite(call.longitude) ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Localizar chamado ${call.externalId} no mapa`}
                hitSlop={6}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  onLocateOnMap();
                }}
                style={({ pressed }) => [
                  styles.locatePill,
                  pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] },
                ]}
              >
                <Ionicons
                  name="map-outline"
                  size={layout.iconSize.sm}
                  color={colors.onSurfaceBrand}
                />
                <AppText variant="caption" style={styles.locatePillText}>
                  No mapa
                </AppText>
              </Pressable>
            ) : (
              <Ionicons name="chevron-forward" size={layout.iconSize.sm} color={colors.muted} />
            )}
          </View>
        </View>
      </Pressable>

      {saveError !== '' && (
        <AppText
          color="risk"
          variant="meta"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={styles.error}
        >
          {saveError}
        </AppText>
      )}
    </View>
  );
});

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      width: '100%',
      borderRadius: layout.radius.card,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    pressable: {
      padding: spacing.md,
      gap: spacing.xs + 2,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xs,
    },
    categoryCluster: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
      minWidth: 0,
      marginRight: spacing.xs,
    },
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      flexShrink: 1,
    },
    categoryLabel: {
      fontWeight: '600',
      color: colors.ink,
      fontSize: fontSizes.caption,
    },
    agencyBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: layout.radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      flexShrink: 0,
    },
    agencyText: {
      fontSize: fontSizes.caption,
      fontWeight: '600',
      color: colors.muted,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: layout.radius.pill,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: layout.radius.xs,
    },
    statusText: {
      fontWeight: '600',
      fontSize: fontSizes.caption,
      lineHeight: 15,
    },
    heart: {
      width: 32,
      height: 32,
      borderRadius: layout.radius.panel,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    title: {
      fontSize: fontSizes.body,
      lineHeight: 22,
      fontWeight: '600',
      color: colors.ink,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xxs,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xs,
      paddingTop: spacing.xs + 2,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
      marginTop: 2,
    },
    footerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      flex: 1,
      minWidth: 0,
    },
    footerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 0,
    },
    metaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    metaChipText: {
      fontSize: fontSizes.caption,
      fontWeight: '500',
    },
    slaBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: layout.radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
    },
    slaBadgeText: {
      fontSize: fontSizes.caption,
      fontWeight: '600',
    },
    protocolChip: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: layout.radius.xs,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    protocolText: {
      fontSize: fontSizes.caption,
      fontWeight: '600',
      color: colors.muted,
    },
    locatePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: layout.radius.pill,
      backgroundColor: colors.surfaceSubdued,
      borderWidth: 1,
      borderColor: colors.border,
    },
    locatePillText: {
      fontSize: fontSizes.caption,
      fontWeight: '600',
      color: colors.onSurfaceBrand,
    },
    flex: {
      flex: 1,
      minWidth: 0,
    },
    error: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
    },
  });
}
