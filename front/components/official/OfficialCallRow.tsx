import React, { memo, useState } from 'react';
import { StyleSheet, View, Pressable, type ViewStyle } from 'react-native';
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

  const locationText = [
    call.streetName,
    call.neighborhoodName || 'Bairro não informado',
  ]
    .filter(Boolean)
    .join(' · ');

  const slaShort =
    call.timeRemaining != null && call.timeRemaining > 0
      ? `${call.timeRemaining}${(call.timeUnit || '').toUpperCase().startsWith('H') ? 'h' : 'd'}`
      : null;

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
        accessibilityLabel={`${title}. ${locationText}. ${situation}. ${openedLabel}. Protocolo ${call.externalId}. Ver detalhes do chamado.`}
        style={({ pressed }) => [styles.pressable, pressed && { opacity: 0.85 }]}
      >
        {/* Header: Categoria e Ações */}
        <View style={styles.header}>
          <View style={styles.categoryBadge}>
            <Ionicons
              name={theme.icon as React.ComponentProps<typeof Ionicons>['name']}
              size={17}
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

          <View style={styles.headerRight}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isDark
                    ? statusColor + '25'
                    : statusColor + '18',
                },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: statusColor }]}
              />
              <AppText
                variant="caption"
                style={[styles.statusText, { color: statusColor }]}
              >
                {situation}
              </AppText>
            </View>

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
              hitSlop={8}
              style={({ pressed }) => [
                styles.heart,
                { opacity: !hydrated || busy ? 0.6 : pressed ? 0.75 : 1 },
              ]}
            >
              <Ionicons
                name={isSaved ? 'heart' : 'heart-outline'}
                size={22}
                color={isSaved ? colors.risk : colors.muted}
              />
            </Pressable>
          </View>
        </View>

        {/* Título */}
        <AppText variant="sectionTitle" numberOfLines={2} style={styles.title}>
          {title}
        </AppText>

        {/* Localização */}
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color={colors.muted} />
          <AppText
            color="muted"
            variant="caption"
            style={styles.flex}
            numberOfLines={1}
          >
            {locationText}
          </AppText>
        </View>

        {/* Rodapé: Metadados e seta de ação */}
        <View style={styles.footerRow}>
          <AppText
            variant="caption"
            color="muted"
            numberOfLines={1}
            style={styles.flex}
          >
            {openedLabel} · Central 1746 #{call.externalId}
            {slaShort ? ` · Prazo ${slaShort}` : ''}
            {call.latitude == null || call.longitude == null
              ? ' · Sem ponto no mapa'
              : ''}
          </AppText>
          {onLocateOnMap &&
          call.latitude != null &&
          call.longitude != null &&
          Number.isFinite(call.latitude) &&
          Number.isFinite(call.longitude) ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Localizar chamado ${call.externalId} no mapa`}
              hitSlop={6}
              onPress={onLocateOnMap}
              style={({ pressed }) => [
                styles.locatePill,
                pressed && { opacity: 0.75 },
              ]}
            >
              <Ionicons
                name="map-outline"
                size={13}
                color={colors.onSurfaceBrand}
              />
              <AppText variant="caption" style={styles.locatePillText}>
                No mapa
              </AppText>
            </Pressable>
          ) : (
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          )}
        </View>
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
      gap: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xs,
    },
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      flex: 1,
      minWidth: 0,
      marginRight: spacing.xs,
    },
    categoryLabel: {
      fontWeight: '600',
      color: colors.ink,
      flexShrink: 1,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: layout.radius.pill,
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    statusText: {
      fontWeight: '600',
      fontSize: 12,
      lineHeight: 16,
    },
    heart: {
      width: 36,
      height: 36,
      borderRadius: layout.radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 17,
      lineHeight: 23,
      fontWeight: '700',
      color: colors.ink,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xxs,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xs,
      paddingTop: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      marginTop: 2,
    },
    locatePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: layout.radius.pill,
      backgroundColor: colors.surfaceSubdued,
      borderWidth: 1,
      borderColor: colors.border,
    },
    locatePillText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.onSurfaceBrand,
    },
    flex: {
      flex: 1,
      minWidth: 0,
    },
    error: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
    },
  });
}
