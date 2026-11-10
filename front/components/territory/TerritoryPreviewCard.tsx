import { FacilityRow, facilityTitle } from './FacilityRow';
import type { PublicFacilitySummary } from '@/shared/public-data';
import { facilityColors } from '@/features/territory/selectors';
import type { MapMarker } from '@/components/ui/MapboxMapView';
import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { CallSummary, describeCall } from '@/components/official/CallSummary';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { layout, spacing } from '@/theme';
import type { OfficialCall } from '@/shared/contracts';
import { useFollowStore } from '@/stores/followStore';
import { formatCallDate } from '@/features/city/formatDates';
import { lightColors } from '@/theme/colors';

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
  const { colors } = useTheme();
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
  const d = describeCall(official, colors);
  const { title, locationText: address } = d;
  const dateLabel = formatCallDate(official.openedAt) ?? 'Data não informada';

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
        accessibilityLabel={`${title}. ${address}. ${d.status.label}. ${dateLabel}.${official ? ' Protocolo ' + official.externalId + '.' : ''} Ver detalhes.`}
        style={({ pressed }) => pressed && { opacity: 0.85 }}
      >
        <CallSummary call={official} headerInset={close ? 36 : 0} />
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
