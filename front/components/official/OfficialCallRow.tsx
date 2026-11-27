import React, { memo, useState } from 'react';
import { StyleSheet, View, Pressable, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import type { ElevationTokens } from '@/theme/elevation';
import { layout, spacing } from '@/theme';
import { fontSizes } from '@/theme/typography';
import { AppText } from '@/components/ui/AppText';
import { CallSummary, describeCall } from '@/components/official/CallSummary';
import { useFollowStore } from '@/stores/followStore';
import type { OfficialCall } from '@/shared/contracts';

export interface OfficialCallRowProps {
  call: OfficialCall;
  onPress: () => void;
  onLocateOnMap?: () => void;
  width?: ViewStyle['width'];
  variant?: 'detailed' | 'compact';
}

export const OfficialCallRow = memo(function OfficialCallRow({
  call,
  onPress,
  onLocateOnMap,
  width,
  variant = 'detailed',
}: OfficialCallRowProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isSaved = useFollowStore((s) =>
    s.savedCalls.some((c) => c.id === call.id),
  );
  const hydrated = useFollowStore((s) => s.hydrated);
  const busy = useFollowStore((s) => s.busy);
  const toggleSavedCall = useFollowStore((s) => s.toggleSavedCall);
  const [saveError, setSaveError] = useState('');
  const d = describeCall(call, colors);
  const { title, locationText, openedLabel } = d;
  const situation = d.status.label;
  const compact = variant === 'compact';
  const neighborhood = call.neighborhoodName?.trim();
  const callLabel = neighborhood ? `${title}, ${neighborhood}` : title;
  const canLocate = onLocateOnMap && Number.isFinite(call.latitude) && Number.isFinite(call.longitude);

  const toggle = async () => {
    setSaveError('');
    try {
      if (!(await toggleSavedCall(call)))
        setSaveError(
          'Não conseguimos atualizar seus acompanhamentos. Toque em Salvar para tentar de novo.',
        );
    } catch {
      setSaveError(
        'Não conseguimos atualizar seus acompanhamentos. Toque em Salvar para tentar de novo.',
      );
    }
  };

  const saveButton = (
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
            ? `Deixar de acompanhar chamado ${compact ? callLabel : call.externalId}`
            : `Salvar chamado ${compact ? callLabel : call.externalId}`
        }
        accessibilityHint={isSaved ? undefined : 'Guarda este chamado nos seus acompanhamentos.'}
        hitSlop={compact ? undefined : 8}
        style={({ pressed }) => [
          compact ? styles.compactAction : styles.heart,
          !compact && { backgroundColor: colors.surfaceRecessed },
          { opacity: !hydrated || busy ? 0.6 : pressed ? 0.75 : 1 },
        ]}
      >
        <Ionicons
          name={isSaved ? 'bookmark' : 'bookmark-outline'}
          size={layout.iconSize.md}
          color={isSaved ? colors.accent : colors.muted}
        />
      </Pressable>
  );
  const locateControl = (
    <>
      {canLocate ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Localizar chamado ${compact ? callLabel : call.externalId} no mapa`}
          hitSlop={compact ? undefined : 6}
          onPress={(e) => {
            e?.stopPropagation?.();
            onLocateOnMap();
          }}
          style={({ pressed }) => [
            compact ? styles.compactAction : styles.locatePill,
            pressed && { opacity: 0.75 },
          ]}
        >
          <Ionicons
            name="map-outline"
            size={compact ? layout.iconSize.md : layout.iconSize.sm}
            color={colors.primary}
          />
          {!compact && <AppText variant="caption" style={styles.locatePillText}>No mapa</AppText>}
        </Pressable>
      ) : compact ? null : (
        <Ionicons name="chevron-forward" size={layout.iconSize.sm} color={colors.muted} />
      )}
    </>
  );

  return (
    <View style={[compact ? styles.listRow : styles.card, width !== undefined && { width }]}>
      {compact ? (
        <View style={styles.compactRow}>
          <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={[callLabel, situation, d.slaText].filter(Boolean).join('. ')}
            accessibilityHint="Abre os detalhes do chamado."
            style={({ pressed }) => [styles.compactBody, pressed && { opacity: 0.75 }]}
          >
            <AppText variant="label" numberOfLines={3}>{title}</AppText>
            <AppText variant="caption" color="muted" numberOfLines={2}>
              {[neighborhood, situation].filter(Boolean).join(' · ')}
            </AppText>
            {d.slaText && (
              <AppText variant="caption" color={d.isOverdue ? 'risk' : 'muted'}>{d.slaText}</AppText>
            )}
          </Pressable>
          {saveButton}
          {locateControl}
        </View>
      ) : (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`${title}. ${locationText}. ${situation}. ${openedLabel}. Protocolo ${call.externalId}. Ver detalhes do chamado.`}
          style={({ pressed }) => [styles.pressable, pressed && { opacity: 0.88 }]}
        >
          <CallSummary call={call} headerAccessory={saveButton} metaTrailing={locateControl} />
        </Pressable>
      )}

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

function createStyles(colors: ThemeColors, elevation?: ElevationTokens) {
  return StyleSheet.create({
    card: {
      width: '100%',
      borderRadius: layout.radius.card,
      backgroundColor: colors.surface,
      ...elevation?.subtle,
    },
    pressable: {
      padding: spacing.md,
      gap: spacing.xs + 2,
    },
    listRow: { width: '100%' },
    compactRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    compactBody: {
      flex: 1,
      minWidth: 0,
      minHeight: layout.touchTarget.minHeight,
      justifyContent: 'center',
      gap: spacing.xxs,
      paddingRight: spacing.xs,
      paddingVertical: spacing.sm,
    },
    compactAction: {
      width: layout.touchTarget.minWidth,
      height: layout.touchTarget.minHeight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heart: {
      width: 32,
      height: 32,
      borderRadius: layout.radius.compact,
      alignItems: 'center',
      justifyContent: 'center',
    },
    locatePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: layout.radius.compact,
      backgroundColor: colors.surfaceRecessed,
    },
    locatePillText: {
      fontSize: fontSizes.caption,
      fontWeight: '600',
      color: colors.primary,
    },
    error: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
    },
  });
}
