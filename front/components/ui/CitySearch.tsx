import { useTheme } from '@/theme/useTheme';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { spacing } from '@/theme';
import { fontFamilies , fontSizes } from '@/theme/typography';

import { layout } from '@/theme/layout';

export interface CitySearchProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  onAction?: () => void;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  actionActive?: boolean;
  /** @deprecated use onAction */
  onFilters?: () => void;
  /** @deprecated use actionActive */
  expanded?: boolean;
  filterCount?: number;
  leftElement?: React.ReactNode;
}

export function CitySearch({
  value,
  onChangeText,
  onPress,
  onAction,
  actionIcon,
  actionLabel,
  actionActive,
  onFilters,
  expanded = false,
  filterCount = 0,
  leftElement,
}: CitySearchProps) {
  const { colors, mode } = useTheme();

  const handleAction = onAction ?? onFilters;
  const resolvedIcon =
    actionIcon ?? (onAction ? 'list-outline' : 'options-outline');
  const resolvedLabel =
    actionLabel ??
    (onAction ? 'Alternar visualização' : 'Filtros');
  const isActionActive = actionActive ?? (filterCount > 0 || expanded);

  return (
    <View
      style={{
        minHeight: 48,
        backgroundColor: colors.surface,
        borderRadius: layout.radius.card,
        paddingLeft: leftElement ? 6 : spacing.md,
        paddingRight: 5,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {leftElement}
      {!leftElement && <Ionicons name="search-outline" size={layout.iconSize.md} color={colors.muted} />}
      {onChangeText ? (
        <TextInput
          accessibilityLabel="Buscar"
          keyboardAppearance={mode}
          placeholder={leftElement ? 'Buscar chamado ou serviço...' : 'Buscar por protocolo, assunto ou bairro...'}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          style={{
            flex: 1,
            minHeight: 44,
            fontSize: leftElement ? 14 : 15,
            fontFamily: fontFamilies.regular,
            color: colors.ink,
          }}
        />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buscar"
          onPress={onPress}
          style={{ flex: 1, minHeight: 44, justifyContent: 'center' }}
        >
          <AppText color="muted" style={{ fontSize: fontSizes.label }}>
            Buscar na minha região…
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
          <Ionicons name="close-circle" size={layout.iconSize.md} color={colors.muted} />
        </Pressable>
      )}
      {handleAction && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={resolvedLabel}
          accessibilityState={{ expanded: expanded || Boolean(actionActive) }}
          aria-expanded={expanded || Boolean(actionActive)}
          onPress={handleAction}
          style={{
            width: 38,
            height: 38,
            borderRadius: layout.radius.panel,
            backgroundColor: isActionActive ? colors.accent : colors.ink,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name={resolvedIcon}
            size={layout.iconSize.md}
            color={colors.onAccent}
          />
          {filterCount > 0 && (
            <View
              style={{
                position: 'absolute',
                right: -2,
                top: -2,
                minWidth: 17,
                height: 17,
                borderRadius: layout.radius.sm,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppText variant="meta" style={{ fontSize: fontSizes.caption, fontWeight: '600' }}>
                {filterCount}
              </AppText>
            </View>
          )}
        </Pressable>
      )}
    </View>
  );
}
