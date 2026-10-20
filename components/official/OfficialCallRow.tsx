import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { layout, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import type { OfficialCall } from '@/shared/contracts';

export interface OfficialCallRowProps {
  call: OfficialCall;
  onPress: () => void;
}

export function OfficialCallRow({ call, onPress }: OfficialCallRowProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const isClosed = Boolean(
    call.closedAt ||
    call.officialStatus === 'Encerrado' ||
    call.officialSituation?.toLowerCase().includes('encerrad')
  );

  const situationColor = isClosed ? colors.completed : colors.accent;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && { opacity: 0.8 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Chamado ${call.externalId}, ${call.serviceSubtype}, ${call.officialSituation || ''}`}
      onPress={onPress}
    >
      {/* Header: Service Type + 1746 Official Tag */}
      <View style={styles.topRow}>
        <View style={styles.typeBadge}>
          <AppText variant="caption" style={styles.typeBadgeText}>
            {call.serviceType}
          </AppText>
        </View>

        <View style={styles.officialPill}>
          <Ionicons name="shield-checkmark" size={12} color="#0072BB" />
          <AppText variant="caption" style={styles.officialPillText}>
            1746
          </AppText>
        </View>
      </View>

      {/* Main Title: Subtype */}
      <AppText variant="sectionTitle" numberOfLines={2} style={styles.title}>
        {call.serviceSubtype || call.serviceType}
      </AppText>

      {/* Situation / Status */}
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: situationColor }]} />
        <AppText
          variant="label"
          style={{ color: situationColor, fontWeight: '700', fontSize: 13 }}
        >
          {call.officialSituation || call.officialStatus || 'Registrado'}
        </AppText>
        {call.withinDeadline ? (
          <AppText variant="caption" color="muted">
            · {call.withinDeadline}
          </AppText>
        ) : null}
      </View>

      {/* Bottom Metadata: Org, Neighborhood, Date */}
      <View style={styles.footerRow}>
        <View style={styles.locationGroup}>
          <Ionicons name="location-outline" size={14} color={colors.muted} />
          <AppText variant="caption" color="muted" numberOfLines={1} style={{ flexShrink: 1 }}>
            {call.neighborhoodName || 'Rio de Janeiro'}
          </AppText>
        </View>

        <AppText variant="caption" color="muted">
          {formatDate(call.openedAt)}
        </AppText>
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: layout.radius.card,
      padding: spacing.md,
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.divider,
      marginVertical: 4,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    typeBadge: {
      backgroundColor: colors.surfaceSubdued,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: layout.radius.sm,
      maxWidth: '75%',
    },
    typeBadgeText: {
      color: colors.muted,
      fontWeight: '600',
      fontSize: 11,
      textTransform: 'uppercase',
    },
    officialPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: '#0072BB14',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: layout.radius.pill,
    },
    officialPillText: {
      color: '#0072BB',
      fontWeight: '800',
      fontSize: 10,
    },
    title: {
      fontSize: 16,
      lineHeight: 22,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.divider,
      paddingTop: spacing.xs,
      marginTop: 2,
    },
    locationGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flex: 1,
      marginRight: spacing.sm,
    },
  });
}
