import React, { memo, useState } from 'react';
import { StyleSheet, View, Pressable, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { layout, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { useFollowStore } from '@/stores/followStore';
import { resolveServiceCategoryTheme } from '@/features/city/officialCategoryThemes';
import type { OfficialCall } from '@/shared/contracts';
import { officialCallStatus } from '@/features/city/officialCallStatus';

export interface OfficialCallRowProps {
  call: OfficialCall;
  onPress: () => void;
  width?: ViewStyle['width'];
}

export const OfficialCallRow = memo(function OfficialCallRow({
  call,
  onPress,
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
  const opened = new Date(call.openedAt);
  const openedLabel = Number.isNaN(opened.getTime())
    ? 'Data de abertura não informada'
    : 'Aberto em ' +
      opened.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
  const toggle = async () => {
    setSaveError('');
    try {
      if (!(await toggleSavedCall(call)))
        setSaveError(
          'Não foi possível atualizar seus acompanhamentos. Toque no coração para tentar novamente.',
        );
    } catch {
      setSaveError(
        'Não foi possível atualizar seus acompanhamentos. Toque no coração para tentar novamente.',
      );
    }
  };
  return (
    <View style={[styles.card, width !== undefined && { width }]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${call.neighborhoodName || 'Bairro não informado'}. ${situation}. ${openedLabel}. Protocolo ${call.externalId}. Ver detalhes do chamado.`}
        style={({ pressed }) => pressed && { opacity: 0.85 }}
      >
        <View style={styles.photoArea}>
          <Image
            source={{ uri: theme.imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            accessibilityIgnoresInvertColors
            accessible={false}
          />
          <View style={styles.category}>
            <Ionicons
              name={theme.icon as React.ComponentProps<typeof Ionicons>['name']}
              size={16}
              color={colors.white}
            />
            <AppText
              variant="caption"
              numberOfLines={2}
              style={styles.categoryLabel}
            >
              {theme.label}
            </AppText>
          </View>
          <LinearGradient
            pointerEvents="none"
            colors={[colors.transparent, colors.surface]}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 64,
            }}
          />
        </View>
        <View style={styles.content}>
          <AppText
            variant="sectionTitle"
            numberOfLines={2}
            style={styles.title}
          >
            {title}
          </AppText>
          <View style={styles.locationStatusRow}>
            <View style={styles.location}>
              <Ionicons
                name="location-outline"
                size={17}
                color={colors.muted}
              />
              <AppText color="muted" style={styles.flex} numberOfLines={2}>
                {call.neighborhoodName || 'Bairro não informado'}
              </AppText>
            </View>
            <View style={styles.status}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: statusColor,
                }}
              />
              <AppText
                variant="caption"
                numberOfLines={2}
                style={{
                  color: statusColor,
                  flexShrink: 1,
                  textAlign: 'right',
                }}
              >
                {situation}
              </AppText>
            </View>
          </View>
          <AppText variant="meta" color="muted">
            {openedLabel}
          </AppText>
          <View style={styles.source}>
            <AppText variant="caption" color="muted" selectable>
              Central 1746 · Protocolo {call.externalId}
            </AppText>
          </View>
        </View>
      </Pressable>
      <Pressable
        onPress={() => {
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
            : `Acompanhar chamado ${call.externalId}`
        }
        accessibilityHint="Guarda este chamado nos seus acompanhamentos."
        style={({ pressed }) => [
          styles.heart,
          { opacity: !hydrated || busy ? 0.6 : pressed ? 0.75 : 1 },
        ]}
      >
        <Ionicons
          name={isSaved ? 'heart' : 'heart-outline'}
          size={25}
          color={isSaved ? colors.risk : colors.ink}
        />
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
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    photoArea: { height: 132, backgroundColor: colors.surfaceSubdued },
    category: {
      position: 'absolute',
      top: spacing.md,
      left: spacing.md,
      maxWidth: '65%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: layout.radius.panel,
      backgroundColor: 'rgba(0,0,0,0.75)',
    },
    categoryLabel: { color: colors.white, flexShrink: 1 },
    content: { padding: spacing.md, gap: spacing.xs, minHeight: 0 },
    title: { fontSize: 19, lineHeight: 25 },
    flex: { flex: 1, minWidth: 0 },
    locationStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    location: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xxs,
    },
    status: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      flexShrink: 1,
      maxWidth: '55%',
      justifyContent: 'flex-end',
    },
    source: { gap: spacing.xxs, paddingTop: spacing.xs },
    details: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 48,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      marginTop: spacing.xs,
    },
    heart: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      minWidth: 48,
      minHeight: 48,
      borderRadius: layout.radius.pill,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    error: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  });
}
