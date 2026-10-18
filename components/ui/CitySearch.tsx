import { useTheme } from '@/theme/useTheme';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { spacing } from '@/theme';
import { fontFamilies } from '@/theme/typography';

export function CitySearch({
  value,
  onChangeText,
  onPress,
  onFilters,
  expanded = false,
  filterCount = 0,
}: {
  value?: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  onFilters: () => void;
  expanded?: boolean;
  filterCount?: number;
}) {
  const { colors, mode } = useTheme();

  return (
    <View
      style={{
        minHeight: 64,
        backgroundColor: colors.surface,
        borderRadius: 32,
        paddingLeft: spacing.lg,
        paddingRight: spacing.xs,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
      }}
    >
      <Ionicons name="search-outline" size={24} color={colors.ink} />
      {onChangeText ? (
        <TextInput
          accessibilityLabel="Buscar no território"
          keyboardAppearance={mode}
          placeholder="Rua, bairro ou assunto"
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          style={{
            flex: 1,
            minHeight: 56,
            fontSize: 16,
            fontFamily: fontFamilies.regular,
            color: colors.ink,
          }}
        />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pesquisar no território"
          onPress={onPress}
          style={{ flex: 1, minHeight: 56, justifyContent: 'center' }}
        >
          <AppText color="muted">Pesquisar no território</AppText>
        </Pressable>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Filtros do território"
        accessibilityState={{ expanded }}
        aria-expanded={expanded}
        onPress={onFilters}
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.ink,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="options-outline" size={22} color={colors.onAccent} />
        {filterCount > 0 && (
          <View
            style={{
              position: 'absolute',
              right: -2,
              top: -2,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppText variant="meta">{filterCount}</AppText>
          </View>
        )}
      </Pressable>
    </View>
  );
}
