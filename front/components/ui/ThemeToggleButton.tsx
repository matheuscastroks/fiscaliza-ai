import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { useThemeStore } from '@/stores/themeStore';
import { layout } from '@/theme/layout';
import { useTheme } from '@/theme/useTheme';

export function ThemeToggleButton({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const setPreference = useThemeStore((state) => state.setPreference);
  const label = isDark ? 'Ativar modo claro' : 'Ativar modo escuro';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      accessibilityHint="Salva a aparência escolhida para o aplicativo."
      onPress={() => {
        void setPreference(isDark ? 'light' : 'dark');
      }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.surfaceSubdued,
          opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
        },
      ]}
    >
      <Ionicons
        name={isDark ? 'sunny-outline' : 'moon-outline'}
        size={layout.iconSize.md}
        color={colors.ink}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: layout.touchTarget.minWidth,
    minHeight: layout.touchTarget.minHeight,
    borderRadius: layout.radius.compact,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
