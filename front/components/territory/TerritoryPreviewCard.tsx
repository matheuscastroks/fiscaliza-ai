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
import { useFollowStore } from '@/stores/followStore';
import { officialCallStatus } from '@/features/city/officialCallStatus';
import { resolveServiceCategoryTheme } from '@/features/city/officialCategoryThemes';

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
          entry.item.officialSituation === 'Encerrado' ? '#236B50' : '#0072BB',
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
        <Ionicons name="close" size={20} color={colors.muted} />
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
  const address = official.neighborhoodName || 'Bairro não informado';
  const status = officialCallStatus(official, colors, isDark);
  const date = new Date(official.openedAt);
  const dateLabel = Number.isNaN(date.getTime())
    ? 'Data não informada'
    : date.toLocaleDateString('pt-BR');
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
        {/* Top: Category + Status Badge */}
        <View style={[styles.headerRow, close && { paddingRight: 36 }]}>
          <View style={styles.categoryBadge}>
            <View
              style={[
                styles.categoryIconWrap,
                { backgroundColor: isDark ? colors.surfaceSubdued : colors.canvas },
              ]}
            >
              <Ionicons
                name={theme.icon as React.ComponentProps<typeof Ionicons>['name']}
                size={14}
                color={colors.ink}
              />
            </View>
            <AppText
              variant="caption"
              numberOfLines={1}
              style={styles.categoryLabel}
            >
              {theme.label}
            </AppText>
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
          <Ionicons name="location-outline" size={15} color={colors.muted} />
          <AppText
            variant="caption"
            color="muted"
            numberOfLines={1}
            style={styles.flex}
          >
            {address}
          </AppText>
        </View>

        {/* Date & Protocol */}
        <AppText
          variant="meta"
          color="muted"
          numberOfLines={1}
          style={styles.date}
        >
          {dateLabel} · Central 1746 #{official.externalId}
        </AppText>
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
          <Ionicons name="arrow-forward" size={16} color={colors.ink} />
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
                : 'Acompanhar chamado ' + official.externalId
            }
            hitSlop={8}
            style={({ pressed }) => [
              styles.heart,
              { opacity: !hydrated || busy ? 0.5 : pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons
              name={saved ? 'heart' : 'heart-outline'}
              size={22}
              color={saved ? colors.risk : colors.muted}
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
          Não foi possível salvar. Toque no coração para tentar novamente.
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
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      flex: 1,
      minWidth: 0,
    },
    categoryIconWrap: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryLabel: {
      fontWeight: '600',
      color: colors.ink,
      flexShrink: 1,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: layout.radius.pill,
    },
    dot: { width: 6, height: 6, borderRadius: 3 },
    statusText: {
      fontWeight: '600',
      fontSize: 11,
      lineHeight: 15,
    },
    title: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '700',
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
