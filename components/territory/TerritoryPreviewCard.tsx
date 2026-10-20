import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { layout, spacing } from '@/theme';
import type { CivicItem, Occurrence } from '@/shared/contracts';
import { kindLabel, statusLabel } from '@/features/city/CityUI';

export type Entry =
  | { type: 'occurrence'; item: Occurrence }
  | { type: 'civic'; item: CivicItem };

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

export function TerritoryPreviewCard({
  entry,
  onOpen,
  onClose,
  bottomOffset = 90,
}: TerritoryPreviewCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const title = entry.item.title;

  let status = '';
  let categoryLabel = '';
  let address = '';
  let photoUri: string | null = null;
  let badgeColor = colors.accent;

  if (entry.type === 'occurrence') {
    const occ = entry.item;
    status = occurrenceStatus[occ.status] || occ.status;
    categoryLabel = 'Ocorrência';
    address = occ.location.address || occ.location.neighborhood || 'Local indicado';
    photoUri = occ.images && occ.images.length > 0 ? occ.images[0] : null;
    badgeColor = colors.accent;
  } else {
    const civic = entry.item;
    status = statusLabel[civic.status] || civic.status;
    categoryLabel = kindLabel[civic.kind];
    address = civic.neighborhood || 'Território municipal';
    badgeColor =
      civic.kind === 'proposal'
        ? colors.attention
        : civic.kind === 'action'
          ? colors.completed
          : colors.muted;
  }

  return (
    <View style={[styles.card, { bottom: bottomOffset }]}>
      <Pressable
        style={styles.content}
        accessibilityRole="button"
        accessibilityLabel={`Ver detalhes de ${title}`}
        onPress={() => onOpen(entry)}
      >
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={styles.thumbnail}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.surfaceSubdued }]}>
            <Ionicons
              name={entry.type === 'occurrence' ? 'alert-circle-outline' : 'bulb-outline'}
              size={24}
              color={colors.muted}
            />
          </View>
        )}

        <View style={styles.details}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: badgeColor + '18' }]}>
              <View style={[styles.badgeDot, { backgroundColor: badgeColor }]} />
              <AppText variant="caption" style={{ color: badgeColor, fontWeight: '700' }}>
                {categoryLabel}
              </AppText>
            </View>
            <AppText variant="caption" color="muted">
              {status}
            </AppText>
          </View>

          <AppText variant="label" numberOfLines={1} style={styles.title}>
            {title}
          </AppText>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={colors.muted} />
            <AppText variant="meta" color="muted" numberOfLines={1} style={styles.address}>
              {address}
            </AppText>
          </View>
        </View>

        <Pressable
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={12}
          accessibilityLabel="Fechar visualização rápida"
        >
          <Ionicons name="close" size={18} color={colors.muted} />
        </Pressable>
      </Pressable>

      <View style={styles.actions}>
        <AppButton
          title="Ver detalhes"
          variant="secondary"
          onPress={() => onOpen(entry)}
        />
      </View>
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
      padding: spacing.sm,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 16,
      elevation: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      zIndex: 100,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    thumbnail: {
      width: 58,
      height: 58,
      borderRadius: layout.radius.button,
    },
    thumbnailPlaceholder: {
      width: 58,
      height: 58,
      borderRadius: layout.radius.button,
      alignItems: 'center',
      justifyContent: 'center',
    },
    details: {
      flex: 1,
      gap: 2,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: layout.radius.pill,
    },
    badgeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    title: {
      fontSize: 14,
      lineHeight: 18,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    address: {
      flex: 1,
    },
    closeButton: {
      padding: spacing.xxs,
      alignSelf: 'flex-start',
    },
    actions: {
      marginTop: spacing.xs,
      paddingTop: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
  });
