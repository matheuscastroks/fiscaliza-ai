import { useTheme } from '@/theme/useTheme';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { spacing } from '@/theme';
import { fontFamilies, fontSizes } from '@/theme/typography';

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
  /**
   * Com `leftElement`, a busca fica recolhida num ícone para o elemento à esquerda
   * (ex.: bairro) ter a largura toda; ao tocar, o campo ocupa o lugar dele.
   */
  searchCollapsed?: boolean;
  onExpandSearch?: () => void;
  onCollapseSearch?: () => void;
}

const ICON_BUTTON = layout.touchTarget.minHeight - 4;

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
  searchCollapsed,
  onExpandSearch,
  onCollapseSearch,
}: CitySearchProps) {
  const { colors, mode } = useTheme();

  const handleAction = onAction ?? onFilters;
  const resolvedIcon =
    actionIcon ?? (onAction ? 'list-outline' : 'options-outline');
  const resolvedLabel =
    actionLabel ??
    (onAction ? 'Alternar visualização' : 'Filtros');
  const isActionActive = actionActive ?? (filterCount > 0 || expanded);
  const collapsible = Boolean(leftElement) && searchCollapsed !== undefined;
  const showLeft = Boolean(leftElement) && (!collapsible || searchCollapsed);
  const showInput = Boolean(onChangeText) && (!collapsible || !searchCollapsed);

  const iconButton = {
    width: ICON_BUTTON,
    height: ICON_BUTTON,
    borderRadius: layout.radius.panel,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };

  return (
    <View
      style={{
        minHeight: layout.touchTarget.minHeight + 4,
        backgroundColor: colors.surface,
        borderRadius: layout.radius.card,
        paddingLeft: leftElement ? 2 : spacing.md,
        paddingRight: 3,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {showLeft && <View style={{ flex: 1, minWidth: 0 }}>{leftElement}</View>}
      {collapsible && !searchCollapsed && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar busca"
          onPress={onCollapseSearch}
          style={iconButton}
        >
          <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.ink} />
        </Pressable>
      )}
      {!leftElement && <Ionicons name="search-outline" size={layout.iconSize.md} color={colors.muted} />}
      {collapsible && searchCollapsed && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buscar chamado ou serviço"
          onPress={onExpandSearch}
          style={iconButton}
        >
          <Ionicons name="search-outline" size={layout.iconSize.md} color={colors.ink} />
        </Pressable>
      )}
      {showInput && onChangeText ? (
        <TextInput
          accessibilityLabel="Buscar"
          keyboardAppearance={mode}
          autoFocus={collapsible}
          placeholder={leftElement ? 'Assunto ou protocolo' : 'Buscar por protocolo, assunto ou bairro…'}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          style={{
            flex: 1,
            minHeight: 44,
            fontSize: fontSizes.label,
            fontFamily: fontFamilies.regular,
            color: colors.ink,
          }}
        />
      ) : !onChangeText ? (
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
      ) : null}
      {showInput && onChangeText && Boolean(value) && (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Limpar busca"
        >
          <Ionicons name="close-circle" size={layout.iconSize.md} color={colors.muted} />
        </Pressable>
      )}
      {handleAction && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={filterCount > 0 ? `${resolvedLabel}, ${filterCount} ativos` : resolvedLabel}
          accessibilityState={{ expanded: expanded || Boolean(actionActive) }}
          aria-expanded={expanded || Boolean(actionActive)}
          onPress={handleAction}
          style={{
            ...iconButton,
            backgroundColor: isActionActive ? colors.accent : colors.ink,
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
