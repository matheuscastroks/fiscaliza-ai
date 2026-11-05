import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { useTheme, layout, spacing } from '@/theme';
export function CitizenAction({
  title,
  description,
  icon,
  onPress,
  primary = false,
}: {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  primary?: boolean;
}) {
  const { colors } = useTheme();
  const color = primary ? colors.onAccent : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => ({
        padding: spacing.lg,
        borderRadius: primary ? layout.radius.pill : layout.radius.card,
        backgroundColor: primary ? colors.ink : colors.surface,
        opacity: pressed ? 0.8 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        minHeight: 100,
      })}
    >
      <Ionicons name={icon} size={26} color={color} />
      <View style={{ flex: 1, gap: spacing.xxs }}>
        <AppText variant="label" style={{ color }}>
          {title}
        </AppText>
        <AppText
          variant="caption"
          style={{ color: primary ? colors.onAccent : colors.muted }}
        >
          {description}
        </AppText>
      </View>
      <Ionicons name="arrow-forward" size={22} color={color} />
    </Pressable>
  );
}
