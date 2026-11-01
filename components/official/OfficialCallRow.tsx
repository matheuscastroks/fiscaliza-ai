import React, { memo } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { layout, spacing } from '@/theme';
import { AppText } from '@/components/ui/AppText';
import { useFollowStore } from '@/stores/followStore';
import { isOfficialCallClosed } from '@/shared/official-call-state';
import { resolveServiceCategoryTheme } from '@/features/city/officialCategoryThemes';
import type { OfficialCall } from '@/shared/contracts';

export interface OfficialCallRowProps {
  call: OfficialCall;
  onPress: () => void;
  width?: number | string;
}

export const OfficialCallRow = memo(function OfficialCallRow({
  call,
  onPress,
  width,
}: OfficialCallRowProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isSaved = useFollowStore((s) =>
    s.savedCalls.some((c) => c.id === call.id),
  );
  const hydrated = useFollowStore((s) => s.hydrated);
  const busy = useFollowStore((s) => s.busy);
  const toggleSavedCall = useFollowStore((s) => s.toggleSavedCall);

  const isClosed = isOfficialCallClosed(call);
  const situationColor = isClosed ? colors.completed : colors.accent;
  const theme = resolveServiceCategoryTheme(call.serviceType, call.serviceSubtype);

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

  const primaryStateLabel =
    call.officialStatus && call.officialStatus !== call.officialSituation
      ? `${call.officialSituation || 'Registrado'} · ${call.officialStatus}`
      : call.officialSituation || call.officialStatus || 'Registrado';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        width !== undefined ? { width: width as any } : undefined,
        pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Chamado ${call.externalId}, ${call.serviceSubtype || call.serviceType}, ${isClosed ? 'Encerrado no 1746' : primaryStateLabel}`}
      onPress={onPress}
    >
      {/* Imagem de Fundo por Categoria com Tratamento Visual e Gradiente */}
      <Image
        source={{ uri: theme.imageUrl }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={200}
        priority="normal"
        accessibilityIgnoresInvertColors
      />
      <LinearGradient
        colors={[
          'rgba(15, 23, 42, 0.40)',
          'rgba(15, 23, 42, 0.75)',
          'rgba(15, 23, 42, 0.96)',
        ]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.cardInner}>
        {/* Linha Superior: Tipo de Serviço + Protocolo + Ação Salvar */}
        <View style={styles.topRow}>
          <View style={styles.categoryBadge}>
            <Ionicons name={theme.icon as any} size={14} color="#FFFFFF" />
            <AppText
              variant="caption"
              numberOfLines={1}
              style={styles.categoryBadgeText}
            >
              {call.serviceType}
            </AppText>
          </View>

          <View style={styles.rightHeaderGroup}>
            <View style={styles.officialPill}>
              <Ionicons name="shield-checkmark" size={12} color="#60A5FA" />
              <AppText variant="caption" style={styles.officialPillText}>
                #{call.externalId}
              </AppText>
            </View>

            <Pressable
              disabled={!hydrated || busy}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={
                isSaved
                  ? `Remover chamado ${call.externalId} da sua conta`
                  : `Salvar chamado ${call.externalId} na sua conta`
              }
              onPress={(e) => {
                e.stopPropagation();
                void toggleSavedCall(call);
              }}
              style={[
                styles.savePill,
                isSaved && { backgroundColor: '#FFFFFF' },
              ]}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={14}
                color={isSaved ? '#0F172A' : '#FFFFFF'}
              />
              <AppText
                variant="caption"
                style={[
                  styles.savePillText,
                  { color: isSaved ? '#0F172A' : '#FFFFFF' },
                ]}
              >
                {isSaved ? 'Salvo' : 'Salvar'}
              </AppText>
            </Pressable>
          </View>
        </View>

        {/* Bloco Central: Subtipo e Descrição em Destaque */}
        <View style={styles.centerBlock}>
          <AppText variant="sectionTitle" numberOfLines={2} style={styles.title}>
            {call.serviceSubtype || call.serviceType}
          </AppText>

          {/* Status do Atendimento com badge translúcida */}
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: situationColor },
              ]}
            />
            <AppText
              variant="label"
              numberOfLines={1}
              style={{
                color: '#FFFFFF',
                fontWeight: '700',
                fontSize: 13,
                flexShrink: 1,
              }}
            >
              {primaryStateLabel}
            </AppText>
            {call.withinDeadline ? (
              <AppText variant="caption" style={styles.subtleText}>
                · {call.withinDeadline}
              </AppText>
            ) : null}
          </View>
        </View>

        {/* Rodapé: Bairro / Órgão + Data */}
        <View style={styles.footerRow}>
          <View style={styles.locationGroup}>
            <Ionicons name="location-outline" size={15} color="#CBD5E1" />
            <AppText
              variant="caption"
              numberOfLines={1}
              style={styles.locationText}
            >
              {[call.neighborhoodName || 'Rio de Janeiro', call.organizationName]
                .filter(Boolean)
                .join(' · ')}
            </AppText>
          </View>

          <AppText variant="caption" style={styles.dateText}>
            {formatDate(call.openedAt)}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
});

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      minHeight: 220,
      borderRadius: layout.radius.card + 4,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 5,
      backgroundColor: colors.surface,
      marginVertical: 6,
    },
    cardInner: {
      flex: 1,
      minHeight: 220,
      padding: spacing.lg,
      justifyContent: 'space-between',
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      zIndex: 2,
    },
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 5,
      borderRadius: layout.radius.pill,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.18)',
      flexShrink: 1,
    },
    categoryBadgeText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 12,
      letterSpacing: 0.3,
    },
    rightHeaderGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexShrink: 0,
    },
    officialPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: layout.radius.pill,
      borderWidth: 1,
      borderColor: 'rgba(96, 165, 250, 0.35)',
    },
    officialPillText: {
      color: '#93C5FD',
      fontWeight: '800',
      fontSize: 11,
    },
    savePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: layout.radius.pill,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.22)',
    },
    savePillText: {
      fontWeight: '700',
      fontSize: 12,
    },
    centerBlock: {
      gap: spacing.sm,
      marginVertical: spacing.md,
      zIndex: 2,
    },
    title: {
      color: '#FFFFFF',
      fontSize: 19,
      lineHeight: 25,
      fontWeight: '700',
      textShadowColor: 'rgba(0, 0, 0, 0.65)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 4,
      borderRadius: layout.radius.pill,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    subtleText: {
      color: '#CBD5E1',
      fontSize: 12,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: 'rgba(255, 255, 255, 0.2)',
      paddingTop: spacing.sm + 2,
      zIndex: 2,
    },
    locationGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      flex: 1,
      marginRight: spacing.md,
    },
    locationText: {
      color: '#E2E8F0',
      fontSize: 12,
      fontWeight: '500',
    },
    dateText: {
      color: '#CBD5E1',
      fontSize: 12,
      fontWeight: '500',
    },
  });
}
