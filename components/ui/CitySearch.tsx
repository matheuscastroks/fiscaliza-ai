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
        minHeight: 48,
        backgroundColor: colors.surface,
        borderRadius: 24,
        paddingLeft: spacing.md,
        paddingRight: 5,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Ionicons name="search-outline" size={20} color={colors.muted} />
      {onChangeText ? (
        <TextInput
          accessibilityLabel="Buscar no território"
          keyboardAppearance={mode}
          placeholder="Buscar protocolo, serviço ou bairro..."
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          style={{
            flex: 1,
            minHeight: 44,
            fontSize: 15,
            fontFamily: fontFamilies.regular,
            color: colors.ink,
          }}
        />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pesquisar no território"
          onPress={onPress}
          style={{ flex: 1, minHeight: 44, justifyContent: 'center' }}
        >
          <AppText color="muted" style={{ fontSize: 15 }}>
            Buscar serviço, bairro ou protocolo 1746...
          </AppText>
        </Pressable>
      )}
      {onChangeText && Boolean(value) && (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Limpar busca"
        >
          <Ionicons name="close-circle" size={18} color={colors.muted} />
        </Pressable>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Filtros do território"
        accessibilityState={{ expanded }}
        aria-expanded={expanded}
        onPress={onFilters}
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: filterCount > 0 ? colors.accent : colors.ink,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="options-outline" size={18} color={colors.onAccent} />
        {filterCount > 0 && (
          <View
            style={{
              position: 'absolute',
              right: -2,
              top: -2,
              minWidth: 17,
              height: 17,
              borderRadius: 9,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppText variant="meta" style={{ fontSize: 10, fontWeight: '800' }}>
              {filterCount}
            </AppText>
          </View>
        )}
      </Pressable>
    </View>
  );
}
