import React, { memo, useState } from 'react';
import { StyleSheet, View, Pressable, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
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
  const d = describeCall(call, colors);
  const { title, locationText, openedLabel } = d;
  const situation = d.status.label;

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
  );
  const locateControl = (
    <>
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
    </>
  );

  return (
    <View style={[styles.card, width !== undefined && { width }]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${locationText}. ${situation}. ${openedLabel}. Protocolo ${call.externalId}. Ver detalhes do chamado.`}
        style={({ pressed }) => [styles.pressable, pressed && { opacity: 0.88 }]}
      >
        <CallSummary call={call} headerAccessory={saveButton} metaTrailing={locateControl} />
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
    heart: {
      width: 32,
      height: 32,
      borderRadius: layout.radius.compact,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    locatePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: layout.radius.compact,
      backgroundColor: colors.surfaceSubdued,
      borderWidth: 1,
      borderColor: colors.border,
    },
    locatePillText: {
      fontSize: fontSizes.caption,
      fontWeight: '600',
      color: colors.onSurfaceBrand,
    },
    error: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
    },
  });
}
