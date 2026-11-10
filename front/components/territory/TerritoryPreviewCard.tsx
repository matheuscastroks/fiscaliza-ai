import { FacilityRow, facilityTitle } from './FacilityRow';
import type { PublicFacilitySummary } from '@/shared/public-data';
import { facilityColors } from '@/features/territory/selectors';
import type { MapMarker } from '@/components/ui/MapboxMapView';
import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { layout, spacing } from '@/theme';
import type { OfficialCall } from '@/shared/contracts';
import { isOfficialCallClosed } from '@/shared/official-call-state';
import { useFollowStore } from '@/stores/followStore';
import {
  officialCallStatus,
  resolveOfficialCallDeadline,
} from '@/features/city/officialCallStatus';
import { resolveServiceCategoryTheme } from '@/features/city/officialCategoryThemes';
import { formatCallDate, formatTimeRemainingShort } from '@/features/city/formatDates';
import { lightColors } from '@/theme/colors';
import { fontSizes } from '@/theme/typography';

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

export type Entry =
  | { type: 'facility'; item: PublicFacilitySummary }
  | { type: 'official'; item: OfficialCall };

export function entryLocation(entry: Entry) {
  if (entry.type === 'official') {
    const item = entry.item;
    return item.latitude != null &&
      item.longitude != null &&
      Number.isFinite(item.latitude) &&
      Number.isFinite(item.longitude) &&
      Math.abs(item.latitude) <= 90 &&
      Math.abs(item.longitude) <= 180
      ? { latitude: item.latitude, longitude: item.longitude }
      : undefined;
  }
  if (entry.type === 'facility') return entry.item.location || undefined;
  return undefined;
}

export function entryToMarker(entry: Entry): MapMarker | null {
  if (entry.type === 'facility') {
    return entry.item.location
      ? {
          id: entry.item.id,
          ...entry.item.location,
          title: facilityTitle(entry.item),
          kind: entry.item.category,
          color: facilityColors[entry.item.category],
        }
      : null;
  }
  if (entry.type !== 'official') return null;
  const point = entryLocation(entry);
  return point
    ? {
        id: entry.item.id,
        latitude: point.latitude,
        longitude: point.longitude,
        title: `1746 · ${entry.item.serviceSubtype || entry.item.serviceType}`,
        color:
          entry.item.officialSituation === 'Encerrado' ? lightColors.completed : lightColors.primary,
        kind: 'official',
      }
    : null;
}

interface TerritoryPreviewCardProps {
  entry: Entry;
  onOpen: (entry: Entry) => void;
  onClose: () => void;
  bottomOffset?: number;
}

export function TerritoryCardContent({
  entry,
  onOpen,
  onClose,
  hideClose = false,
}: {
  entry: Entry;
  onOpen: (entry: Entry) => void;
  onClose?: () => void;
  hideClose?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const officialId = entry.type === 'official' ? entry.item.id : '';
  const saved = useFollowStore((s) =>
    officialId ? s.savedCalls.some((c) => c.id === officialId) : false,
  );
  const hydrated = useFollowStore((s) => s.hydrated);
  const busy = useFollowStore((s) => s.busy);
  const toggleSavedCall = useFollowStore((s) => s.toggleSavedCall);
  const [failedId, setFailedId] = useState<string | null>(null);
  const close =
    !hideClose && onClose ? (
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Fechar visualização rápida"
        hitSlop={8}
        style={styles.close}
      >
        <Ionicons name="close" size={layout.iconSize.md} color={colors.muted} />
      </Pressable>
    ) : null;

  if (entry.type === 'facility')
    return (
      <View>
        <View style={styles.facilityHeader}>
          <AppText variant="caption" color="muted">
            Equipamento público
          </AppText>
        </View>
        <FacilityRow item={entry.item} onPress={() => onOpen(entry)} />
        {close}
      </View>
    );

  const official = entry.item;
  const title = official.serviceSubtype || official.serviceType;
  const theme = resolveServiceCategoryTheme(
    official.serviceType,
    official.serviceSubtype,
  );
  const address =
    [official.streetName, official.neighborhoodName]
      .filter(Boolean)
      .join(' · ') || 'Bairro não informado';
  const status = officialCallStatus(official, colors, isDark);
  const dateLabel = formatCallDate(official.openedAt) ?? 'Data não informada';

  const isClosed = isOfficialCallClosed(official);
  const deadlineInfo = resolveOfficialCallDeadline(official, isClosed);
  const isOverdue = !isClosed && deadlineInfo?.isOverdue === true;
  const relativeTime = formatRelativeTime(official.openedAt);
  const agencyName = official.organizationName?.trim() || null;
  const slaText = isClosed
    ? null
    : isOverdue
      ? 'Prazo vencido'
      : formatTimeRemainingShort(official.timeRemaining, official.timeUnit)
        ? `Restam ${formatTimeRemainingShort(official.timeRemaining, official.timeUnit)}`
        : null;

  const save = async () => {
    if (!official) return;
    setFailedId(null);
    try {
      if (!(await toggleSavedCall(official))) setFailedId(official.id);
    } catch {
      setFailedId(official.id);
    }
  };
  return (
    <View style={styles.content}>
      <Pressable
        onPress={() => onOpen(entry)}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${address}. ${status.label}. ${dateLabel}.${official ? ' Protocolo ' + official.externalId + '.' : ''} Ver detalhes.`}
        style={({ pressed }) => pressed && { opacity: 0.85 }}
      >
        {/* Top: Category + Agency + Status Badge */}
        <View style={[styles.headerRow, close && { paddingRight: 36 }]}>
          <View style={styles.categoryCluster}>
            <View style={styles.categoryBadge}>
              <Ionicons
                name={theme.icon as React.ComponentProps<typeof Ionicons>['name']}
                size={14}
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

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isDark ? status.color + '25' : status.color + '18' },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: status.color }]} />
            <AppText
              variant="caption"
              style={[styles.statusText, { color: status.color }]}
            >
              {status.label}
            </AppText>
          </View>
        </View>

        {/* Title */}
        <AppText variant="sectionTitle" numberOfLines={2} style={styles.title}>
          {title}
        </AppText>

        {/* Location */}
        <View style={styles.location}>
          <Ionicons name="location-outline" size={layout.iconSize.sm} color={colors.muted} />
          <AppText
            variant="caption"
            color="muted"
            numberOfLines={1}
            style={styles.flex}
          >
            {address}
          </AppText>
        </View>

        {/* Metadados Cívicos Inteligentes */}
        <View style={styles.metadataRow}>
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
              #{official.externalId}
            </AppText>
          </View>
        </View>
      </Pressable>

      {/* Action footer */}
      <View style={styles.actions}>
        <Pressable
          onPress={() => onOpen(entry)}
          accessibilityRole="button"
          accessibilityLabel={`Ver detalhes de ${title}`}
          style={styles.details}
        >
          <AppText variant="label" style={{ color: colors.ink }}>Ver detalhes</AppText>
          <Ionicons name="arrow-forward" size={layout.iconSize.sm} color={colors.ink} />
        </Pressable>
        {official && (
          <Pressable
            onPress={() => {
              void save();
            }}
            disabled={!hydrated || busy}
            accessibilityRole="checkbox"
            accessibilityState={{
              checked: saved,
              disabled: !hydrated || busy,
              busy,
            }}
            accessibilityLabel={
              saved
                ? 'Deixar de acompanhar chamado ' + official.externalId
                : 'Salvar chamado ' + official.externalId
            }
            hitSlop={8}
            style={({ pressed }) => [
              styles.heart,
              { opacity: !hydrated || busy ? 0.5 : pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={layout.iconSize.md}
              color={saved ? colors.accent : colors.muted}
            />
          </Pressable>
        )}
      </View>

      {failedId === officialId && (
        <AppText
          variant="meta"
          color="risk"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          Não foi possível salvar. Toque em Salvar para tentar novamente.
        </AppText>
      )}
      {close}
    </View>
  );
}

export function TerritoryPreviewCard({
  entry,
  onOpen,
  onClose,
  bottomOffset = 90,
}: TerritoryPreviewCardProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.card, { bottom: bottomOffset }]}>
      <TerritoryCardContent entry={entry} onOpen={onOpen} onClose={onClose} />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      position: 'absolute',
      left: spacing.md,
      right: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: layout.radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      zIndex: 100,
      overflow: 'hidden',
    },
    content: {
      padding: spacing.md,
      gap: spacing.xs,
    },
    flex: { flex: 1, minWidth: 0 },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xs,
      marginBottom: 2,
    },
    categoryCluster: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      flex: 1,
      minWidth: 0,
      marginRight: 6,
    },
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      flexShrink: 1,
    },
    categoryLabel: {
      fontWeight: '600',
      color: colors.ink,
      fontSize: fontSizes.caption,
    },
    agencyBadge: {
      paddingHorizontal: 5,
      paddingVertical: 1,
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
    metadataRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: spacing.xxs,
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
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: layout.radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
    },
    slaBadgeText: {
      fontSize: fontSizes.caption,
      fontWeight: '600',
    },
    protocolChip: {
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: layout.radius.xs,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    protocolText: {
      fontSize: fontSizes.caption,
      fontWeight: '600',
      color: colors.muted,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: layout.radius.pill,
    },
    dot: { width: 6, height: 6, borderRadius: layout.radius.xs },
    statusText: {
      fontWeight: '600',
      fontSize: fontSizes.caption,
      lineHeight: 15,
    },
    title: {
      fontSize: fontSizes.body,
      lineHeight: 22,
      fontWeight: '600',
      color: colors.ink,
    },
    location: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xxs,
      marginTop: 2,
    },
    date: {
      marginTop: spacing.xxs,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: spacing.xs,
      marginTop: spacing.xs,
    },
    details: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.xs,
    },
    heart: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: layout.radius.pill,
    },
    close: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    facilityHeader: {
      paddingTop: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingRight: 48,
      minHeight: 40,
      justifyContent: 'center',
    },
  });
