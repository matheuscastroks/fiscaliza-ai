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
        pressed && { opacity: 0.88 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Chamado ${call.externalId}, ${call.serviceSubtype || call.serviceType}, ${isClosed ? 'Encerrado no 1746' : primaryStateLabel}`}
      onPress={onPress}
    >
      {/* Imagem de Fundo em alta resolução por Categoria */}
      <Image
        source={{ uri: theme.imageUrl }}
        style={styles.photo}
        contentFit="cover"
        transition={250}
        priority="normal"
        accessibilityIgnoresInvertColors
      />

      {/* Linha Superior Flutuante: Categoria + Protocolo 1746 + Salvar */}
      <View style={styles.topRow}>
        <View style={styles.categoryBadge}>
          <Ionicons name={theme.icon as any} size={14} color="#FFFFFF" />
          <AppText
            variant="caption"
            numberOfLines={1}
            style={styles.categoryBadgeText}
          >
            {theme.label || call.serviceType}
          </AppText>
        </View>

        <View style={styles.rightHeaderGroup}>
          <View style={styles.officialPill}>
            <Ionicons name="shield-checkmark" size={12} color="#93C5FD" />
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
              isSaved && styles.savePillActive,
            ]}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={13}
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

      {/* Espaço de respiro para a fotografia respirar no topo */}
      <View style={styles.photoSpace} />

      {/* Conteúdo com Gradiente Editorial Contínuo (Scrim) */}
      <View style={styles.content}>
        <LinearGradient
          pointerEvents="none"
          colors={[
            'rgba(15, 23, 42, 0)',
            'rgba(15, 23, 42, 0.72)',
            'rgba(15, 23, 42, 0.97)',
          ]}
          locations={[0, 0.3, 1]}
          style={styles.scrim}
        />

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
            style={styles.statusLabelText}
          >
            {primaryStateLabel}
          </AppText>
          {call.withinDeadline ? (
            <AppText variant="caption" style={styles.subtleText}>
              · {call.withinDeadline}
            </AppText>
          ) : null}
        </View>

        {/* Título Principal / Subtipo do Serviço */}
        <AppText variant="sectionTitle" numberOfLines={2} style={styles.title}>
          {call.serviceSubtype || call.serviceType}
        </AppText>

        {/* Metadados: Localização e Data */}
        <View style={styles.metaRow}>
          <View style={styles.locationGroup}>
            <Ionicons name="location-outline" size={14} color="#94A3B8" />
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

        {/* Ação em Pílula Translúcida com Botão de Avanço Circular */}
        <View style={styles.photoAction}>
          <AppText variant="label" style={styles.actionLabel}>
            Ver detalhes do chamado
          </AppText>
          <View style={styles.actionArrow}>
            <Ionicons name="arrow-forward" size={18} color="#0F172A" />
          </View>
        </View>
      </View>
    </Pressable>
  );
});

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      width: '100%',
      minHeight: 380,
      borderRadius: layout.radius.card,
      backgroundColor: colors.surface,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.14)',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.28,
      shadowRadius: 14,
      elevation: 6,
      justifyContent: 'space-between',
    },
    photo: {
      ...StyleSheet.absoluteFillObject,
      width: '100%',
      height: '100%',
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      padding: spacing.md,
      zIndex: 3,
    },
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 5,
      borderRadius: layout.radius.pill,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      flexShrink: 1,
    },
    categoryBadgeText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 12,
      letterSpacing: 0.2,
    },
    rightHeaderGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 0,
    },
    officialPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: layout.radius.pill,
      borderWidth: 1,
      borderColor: 'rgba(147, 197, 253, 0.35)',
    },
    officialPillText: {
      color: '#93C5FD',
      fontWeight: '800',
      fontSize: 11,
    },
    savePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: layout.radius.pill,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.22)',
    },
    savePillActive: {
      backgroundColor: '#FFFFFF',
      borderColor: '#FFFFFF',
    },
    savePillText: {
      fontWeight: '700',
      fontSize: 11,
    },
    photoSpace: {
      flexGrow: 1,
      minHeight: 110,
    },
    content: {
      padding: spacing.lg,
      gap: spacing.sm,
      position: 'relative',
      zIndex: 2,
    },
    scrim: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: -110,
      bottom: 0,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(15, 23, 42, 0.55)',
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: layout.radius.pill,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.14)',
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    statusLabelText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 12,
      flexShrink: 1,
    },
    subtleText: {
      color: '#CBD5E1',
      fontSize: 11,
    },
    title: {
      color: '#FFFFFF',
      fontSize: 20,
      lineHeight: 26,
      fontWeight: '700',
      textShadowColor: 'rgba(0, 0, 0, 0.6)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingBottom: 2,
    },
    locationGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flex: 1,
    },
    locationText: {
      color: '#CBD5E1',
      fontSize: 12,
      fontWeight: '500',
    },
    dateText: {
      color: '#94A3B8',
      fontSize: 12,
      fontWeight: '500',
    },
    photoAction: {
      backgroundColor: 'rgba(255, 255, 255, 0.14)',
      borderRadius: layout.radius.pill,
      paddingLeft: spacing.lg,
      paddingRight: spacing.xxs,
      paddingVertical: spacing.xxs,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginTop: spacing.xs,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.16)',
    },
    actionLabel: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 13,
      letterSpacing: 0.2,
    },
    actionArrow: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 4,
      elevation: 2,
    },
  });
}
