import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { usePlacesStore } from '@/stores/placesStore';
import { layout, spacing, useTheme } from '@/theme';

export function LocationEntryPrompt({
  onLocate,
  onChoose,
  busy,
}: {
  onLocate: () => void;
  onChoose: () => void;
  busy: boolean;
}) {
  const { colors, isDark } = useTheme();
  const { hydrated, promptSeen, dismissPrompt } = usePlacesStore();

  if (!hydrated || promptSeen) return null;

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
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
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
});
