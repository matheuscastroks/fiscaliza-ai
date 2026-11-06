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
          borderColor: isDark ? colors.border : '#E2E8F0',
        },
      ]}
    >
      <View style={styles.header}>
        <Ionicons
          name="navigate-outline"
          size={24}
          color={colors.ink}
          style={{ marginTop: 2 }}
        />

        <View style={styles.headerText}>
          <AppText variant="sectionTitle" style={styles.title}>
            O que acontece ao seu redor?
          </AppText>
          <AppText variant="caption" color="muted" style={styles.subtitle}>
            Descubra ocorrências de asfalto, luz e limpeza na sua rua ou no seu bairro.
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
          <Ionicons name="close" size={20} color={colors.muted} />
        </Pressable>
      </View>

      <View style={styles.actions}>
        <AppButton
          title="Usar minha localização"
          loading={busy}
          onPress={() => {
            void dismissPrompt();
            onLocate();
          }}
        />
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
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: layout.radius.card,
    borderWidth: 1,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  closeBtn: {
    padding: 2,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
