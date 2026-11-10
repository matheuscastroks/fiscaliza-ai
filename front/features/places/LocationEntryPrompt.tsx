import React from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { usePlacesStore } from '@/stores/placesStore';
import { layout, spacing, useTheme } from '@/theme';
import { fontSizes } from '@/theme/typography';
import { lightColors } from '@/theme/colors';

export function LocationEntryPrompt({
  onLocate,
  onChoose,
  busy,
  compact = false,
}: {
  onLocate: () => void;
  onChoose: () => void;
  busy: boolean;
  compact?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const { hydrated, promptSeen, dismissPrompt } = usePlacesStore();

  if (!hydrated || promptSeen) return null;

  if (compact) {
    return (
      <View
        style={[
          styles.compactBanner,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons
          name="navigate-outline"
          size={16}
          color={colors.onSurfaceBrand}
        />
        <AppText
          variant="caption"
          numberOfLines={1}
          style={styles.compactLabel}
        >
          Focar na sua região?
        </AppText>

        <View style={styles.compactActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Usar meu GPS"
            disabled={busy}
            onPress={() => {
              void dismissPrompt();
              onLocate();
            }}
            style={({ pressed }) => [
              styles.compactPrimaryPill,
              {
                backgroundColor: colors.accent,
                opacity: busy ? 0.6 : pressed ? 0.85 : 1,
              },
            ]}
          >
            {busy ? (
              <ActivityIndicator size="small" color={colors.onAccent} />
            ) : (
              <AppText
                variant="caption"
                style={[styles.compactPillText, { color: colors.onAccent }]}
              >
                Usar GPS
              </AppText>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Escolher bairro"
            onPress={() => {
              void dismissPrompt();
              onChoose();
            }}
            style={({ pressed }) => [
              styles.compactSecondaryPill,
              {
                backgroundColor: isDark
                  ? colors.surfaceSubdued
                  : colors.canvas,
                borderColor: colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <AppText variant="caption" style={styles.compactPillText}>
              Bairro
            </AppText>
          </Pressable>

          <Pressable
            onPress={() => {
              void dismissPrompt();
            }}
            hitSlop={10}
            style={styles.compactCloseBtn}
            accessibilityRole="button"
            accessibilityLabel="Fechar aviso de localização"
          >
            <Ionicons name="close" size={16} color={colors.muted} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.surfaceSubdued : colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconBadge,
            {
              backgroundColor: isDark ? colors.surface : colors.surfaceSubdued,
            },
          ]}
        >
          <Ionicons
            name="navigate-outline"
            size={20}
            color={colors.ink}
          />
        </View>

        <View style={styles.headerText}>
          <AppText variant="label" style={styles.title}>
            Quer ver o que acontece perto de você?
          </AppText>
          <AppText variant="caption" color="muted" style={styles.subtitle}>
            Ative o GPS para consultar sua rua ou escolha um bairro manualmente.
          </AppText>
        </View>

        <Pressable
          onPress={() => {
            void dismissPrompt();
          }}
          hitSlop={12}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="Fechar aviso de localização"
        >
          <Ionicons name="close" size={18} color={colors.muted} />
        </Pressable>
      </View>

      <View style={styles.actions}>
        <View style={styles.actionItem}>
          <AppButton
            title="Usar meu GPS"
            loading={busy}
            onPress={() => {
              void dismissPrompt();
              onLocate();
            }}
          />
        </View>
        <View style={styles.actionItem}>
          <AppButton
            title="Escolher bairro"
            variant="secondary"
            onPress={() => {
              void dismissPrompt();
              onChoose();
            }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: layout.radius.panel,
    borderWidth: 1,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontWeight: '600',
  },
  subtitle: {
    fontSize: fontSizes.caption,
    lineHeight: 17,
  },
  closeBtn: {
    padding: 4,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  actionItem: {
    flex: 1,
    minWidth: 140,
  },
  compactBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.sm + 2,
    paddingRight: spacing.xs,
    paddingVertical: 6,
    borderRadius: layout.radius.pill,
    borderWidth: 1,
    shadowColor: lightColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  compactLabel: {
    flex: 1,
    fontWeight: '600',
    fontSize: fontSizes.caption,
  },
  compactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactPrimaryPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: layout.radius.pill,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactSecondaryPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: layout.radius.pill,
    borderWidth: 1,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactPillText: {
    fontSize: fontSizes.caption,
    fontWeight: '600',
  },
  compactCloseBtn: {
    padding: 4,
  },
});
