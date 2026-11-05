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
  const category = 'Central 1746 · ' + official.serviceType;
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
      >
        <View style={[styles.heading, close && { paddingRight: 40 }]}>
          <AppText
            variant="caption"
            color="muted"
            numberOfLines={1}
            style={styles.flex}
          >
            {category}
          </AppText>
        </View>
        <AppText variant="label" numberOfLines={2} style={styles.title}>
          {title}
        </AppText>
        <View style={styles.meta}>
          <View style={styles.location}>
            <Ionicons name="location-outline" size={15} color={colors.muted} />
            <AppText
              variant="caption"
              color="muted"
              numberOfLines={2}
              style={styles.flex}
            >
              {address}
            </AppText>
          </View>
          <View style={styles.status}>
            <View style={[styles.dot, { backgroundColor: status.color }]} />
            <AppText
              variant="caption"
              numberOfLines={2}
              style={{ color: status.color, flexShrink: 1, textAlign: 'right' }}
            >
              {status.label}
            </AppText>
          </View>
        </View>
        <AppText
          variant="caption"
          color="muted"
          numberOfLines={1}
          style={styles.date}
        >
          {dateLabel}
          {official ? ' · Protocolo ' + official.externalId : ''}
        </AppText>
      </Pressable>
      <View style={styles.actions}>
        <Pressable
          onPress={() => onOpen(entry)}
          accessibilityRole="button"
          accessibilityLabel={`Ver detalhes de ${title}`}
          style={styles.details}
        >
          <AppText variant="label">Ver detalhes</AppText>
          <Ionicons name="arrow-forward" size={18} color={colors.ink} />
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
            style={({ pressed }) => [
              styles.heart,
              { opacity: !hydrated || busy ? 0.5 : pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons
              name={saved ? 'heart' : 'heart-outline'}
              size={23}
              color={saved ? colors.risk : colors.ink}
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
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      zIndex: 100,
      overflow: 'hidden',
    },
    content: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xxs,
      gap: spacing.xxs,
    },
    flex: { flex: 1, minWidth: 0 },
    heading: {
      minHeight: 32,
      justifyContent: 'center',
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: { fontSize: 17, lineHeight: 23, marginBottom: spacing.xs },
    meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    location: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xxs,
    },
    status: {
      flexShrink: 1,
      maxWidth: '55%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: spacing.xs,
    },
    dot: { width: 7, height: 7, borderRadius: 4 },
    date: { marginTop: spacing.xs },
    actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    details: {
      flex: 1,
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    heart: {
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: layout.radius.pill,
    },
    close: {
      position: 'absolute',
      top: 0,
      right: 0,
      minWidth: 48,
      minHeight: 48,
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
