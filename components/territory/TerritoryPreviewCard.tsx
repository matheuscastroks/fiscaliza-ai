import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { layout, spacing } from '@/theme';
import type { CivicItem, Occurrence, OfficialCall } from '@/shared/contracts';
import { kindLabel, statusLabel } from '@/features/city/CityUI';
import { assetUrl } from '@/services/http';

export type Entry =
  | { type: 'occurrence'; item: Occurrence }
  | { type: 'civic'; item: CivicItem }
  | { type: 'official'; item: OfficialCall };

const occurrenceStatus: Record<string, string> = {
  pending: 'Recebida',
  in_progress: 'Em atendimento',
  resolved: 'Concluída',
};

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
  const [imageError, setImageError] = useState(false);

  const title =
    entry.type === 'official'
      ? entry.item.serviceSubtype || entry.item.serviceType
      : entry.item.title;

  let status = '';
  let categoryLabel = '';
  let address = '';
  let rawPhoto: string | null = null;
  let badgeColor = colors.accent;

  if (entry.type === 'occurrence') {
    const occ = entry.item;
    status = occurrenceStatus[occ.status] || occ.status;
    categoryLabel = 'Ocorrência';
    address = occ.location.address || occ.location.neighborhood || 'Local indicado';
    rawPhoto = occ.images && occ.images.length > 0 ? occ.images[0] : null;
    badgeColor = colors.accent;
  } else if (entry.type === 'official') {
    const off = entry.item;
    status = off.officialSituation || off.officialStatus || 'Registrado';
    categoryLabel = off.serviceType || 'Central 1746';
    address =
      [off.neighborhoodName, off.subprefecture].filter(Boolean).join(' · ') ||
      'Rio de Janeiro';
    rawPhoto = null;
    badgeColor = '#0072BB';
  } else {
    const civic = entry.item;
    status = statusLabel[civic.status] || civic.status;
    categoryLabel = kindLabel[civic.kind];
    address = civic.neighborhood || 'Território municipal';
    rawPhoto =
      'images' in civic && Array.isArray(civic.images) && civic.images.length > 0
        ? civic.images[0]
        : 'evidence' in civic && Array.isArray(civic.evidence) && civic.evidence.length > 0
          ? civic.evidence[0]
          : null;
    badgeColor =
      civic.kind === 'proposal'
        ? colors.attention
        : civic.kind === 'action'
          ? colors.completed
          : colors.muted;
  }

  const resolvedPhoto = rawPhoto ? assetUrl(rawPhoto) : null;
  const hasPhoto = Boolean(resolvedPhoto && !imageError);

  return (
    <Pressable
      style={styles.cardPressable}
      accessibilityRole="button"
      accessibilityLabel={`Ver detalhes de ${title}`}
      onPress={() => onOpen(entry)}
    >
      {hasPhoto && resolvedPhoto && (
        <>
          <Image
            source={{ uri: resolvedPhoto }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={250}
            onError={() => setImageError(true)}
          />
          <LinearGradient
            colors={[
              'rgba(15,18,20,0.35)',
              'rgba(15,18,20,0.72)',
              'rgba(15,18,20,0.96)',
            ]}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />
        </>
      )}

      <View style={styles.cardInner}>
        {/* Top row: Badges + Close button */}
        <View style={styles.topRow}>
          <View style={styles.badgeGroup}>
            {entry.type === 'official' && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: '#0072BB1A',
                    borderColor: '#0072BB44',
                    borderWidth: 1,
                  },
                ]}
              >
                <AppText
                  variant="caption"
                  style={{
                    color: '#0072BB',
                    fontWeight: '800',
                    fontSize: 10,
                  }}
                >
                  1746 OFICIAL
                </AppText>
              </View>
            )}
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: hasPhoto
                    ? 'rgba(255,255,255,0.22)'
                    : badgeColor + '18',
                },
              ]}
            >
              <View
                style={[
                  styles.badgeDot,
                  { backgroundColor: hasPhoto ? colors.white : badgeColor },
                ]}
              />
              <AppText
                variant="caption"
                style={{
                  color: hasPhoto ? colors.white : badgeColor,
                  fontWeight: '700',
                }}
              >
                {categoryLabel}
              </AppText>
            </View>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: hasPhoto
                    ? 'rgba(0,0,0,0.35)'
                    : colors.surfaceSubdued,
                },
              ]}
            >
              <AppText
                variant="caption"
                style={{
                  color: hasPhoto ? 'rgba(255,255,255,0.9)' : colors.muted,
                  fontWeight: '600',
                }}
              >
                {status}
              </AppText>
            </View>
          </View>

          {!hideClose && onClose && (
            <Pressable
              style={[
                styles.closeCircle,
                {
                  backgroundColor: hasPhoto
                    ? 'rgba(0,0,0,0.45)'
                    : colors.surfaceSubdued,
                },
              ]}
              onPress={onClose}
              hitSlop={12}
              accessibilityLabel="Fechar visualização rápida"
            >
              <Ionicons
                name="close"
                size={16}
                color={hasPhoto ? colors.white : colors.ink}
              />
            </Pressable>
          )}
        </View>

        {/* Bottom section: Title, Location and Action CTA */}
        <View style={styles.bottomSection}>
          <AppText
            variant="sectionTitle"
            numberOfLines={2}
            style={[
              styles.cardTitle,
              hasPhoto ? { color: colors.white } : { color: colors.ink },
            ]}
          >
            {title}
          </AppText>

          <View style={styles.locationRow}>
            <Ionicons
              name="location"
              size={14}
              color={hasPhoto ? 'rgba(255,255,255,0.85)' : colors.muted}
            />
            <AppText
              variant="caption"
              numberOfLines={1}
              style={[
                styles.addressText,
                hasPhoto
                  ? { color: 'rgba(255,255,255,0.85)' }
                  : { color: colors.muted },
              ]}
            >
              {address}
            </AppText>
          </View>

          <View style={styles.actionRow}>
            <View
              style={[
                styles.actionButton,
                {
                  backgroundColor: hasPhoto
                    ? 'rgba(255,255,255,0.92)'
                    : colors.ink,
                },
              ]}
            >
              <AppText
                variant="label"
                style={{
                  color: hasPhoto ? '#111827' : colors.surface,
                  fontWeight: '700',
                  fontSize: 13,
                }}
              >
                Ver detalhes
              </AppText>
              <Ionicons
                name="arrow-forward"
                size={14}
                color={hasPhoto ? '#111827' : colors.surface}
              />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
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
      <TerritoryCardContent
        entry={entry}
        onOpen={onOpen}
        onClose={onClose}
      />
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
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.22,
      shadowRadius: 18,
      elevation: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      zIndex: 100,
      overflow: 'hidden',
    },
    cardPressable: {
      minHeight: 220,
    },
    cardInner: {
      flex: 1,
      minHeight: 220,
      padding: spacing.md,
      justifyContent: 'space-between',
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 2,
    },
    badgeGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      flexWrap: 'wrap',
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: layout.radius.pill,
    },
    badgeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: layout.radius.pill,
    },
    closeCircle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bottomSection: {
      gap: 6,
      zIndex: 2,
      marginTop: spacing.md,
    },
    cardTitle: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '700',
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    addressText: {
      flex: 1,
      fontSize: 12,
    },
    actionRow: {
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: layout.radius.pill,
    },
  });
