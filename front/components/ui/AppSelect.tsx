import React, { useMemo, useState, useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import type { ElevationTokens } from '@/theme/elevation';
import { layout, spacing } from '@/theme';
import { fontFamilies , fontSizes } from '@/theme/typography';
import { AppText } from './AppText';
import {
  AppBottomSheetModal,
  BottomSheetFlatList,
  BottomSheetTextInput,
} from './AppBottomSheetModal';


export interface SelectOption {
  value: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface AppSelectProps {
  label: string;
  options: readonly SelectOption[];
  triggerLabel?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  compact?: boolean;
  defaultValue?: string;
  clearable?: boolean;
  snapPoints?: (string | number)[];
}

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function AppSelect({
  label,
  triggerLabel,
  options,
  value,
  onChange,
  placeholder = 'Pesquisar opção…',
  icon,
  compact = false,
  defaultValue = '',
  clearable = true,
  snapPoints: customSnapPoints,
}: AppSelectProps) {
  const { colors, elevation, isDark, mode } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [headerHeight, setHeaderHeight] = useState(0);
  const [optionsHeight, setOptionsHeight] = useState(0);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const fitOptions = !customSnapPoints && options.length <= 3;

  const shortSnapPoint = headerHeight && optionsHeight
    ? Math.ceil(Math.min(windowHeight - insets.top - spacing.sm, headerHeight + optionsHeight + 30))
    : '40%';
  const computedSnapPoints = customSnapPoints ?? (
    fitOptions ? [shortSnapPoint] : options.length <= 5 ? ['40%'] : ['55%', '85%']
  );

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value) || options[0],
    [options, value],
  );

  const isFiltered = value !== defaultValue && Boolean(value);

  const searchableOptions = useMemo(
    () => open ? options.map(option => ({ option, text: normalizeText(option.label) })) : [],
    [open, options],
  );
  const filteredOptions = useMemo(() => {
    if (!open) return [];
    if (!search.trim()) return options;
    const query = normalizeText(search);
    return searchableOptions.filter(({ text }) => text.includes(query)).map(({ option }) => option);
  }, [open, options, search, searchableOptions]);

  const handleOpen = () => {
    setSearch('');
    setOpen(true);
  };

  const handleSelect = useCallback(
    (nextValue: string) => {
      onChange(nextValue);
      setOpen(false);
      setSearch('');
    },
    [onChange],
  );

  const renderOption = useCallback(
    ({ item }: { item: SelectOption }) => {
      const active = item.value === value;
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: active }}
          onPress={() => handleSelect(item.value)}
          style={({ pressed }) => [
            styles.optionRow,
            active && { backgroundColor: isDark ? colors.surfaceRaised : colors.surfaceSubdued },
            pressed && { opacity: 0.75 },
          ]}
        >
          <View style={styles.optionLeft}>
            {item.icon && (
              <Ionicons
                name={item.icon}
                size={layout.iconSize.md}
                color={active ? colors.accent : colors.muted}
              />
            )}
            <AppText
              variant="body"
              style={[
                styles.optionLabel,
                active && { fontWeight: '600', color: colors.ink },
              ]}
            >
              {item.label}
            </AppText>
          </View>
          {active && (
            <Ionicons
              name="checkmark-circle"
              size={layout.iconSize.md}
              color={colors.accent}
            />
          )}
        </Pressable>
      );
    },
    [colors.accent, colors.ink, colors.muted, colors.surfaceRaised, colors.surfaceSubdued, handleSelect, isDark, styles.optionLabel, styles.optionLeft, styles.optionRow, value],
  );

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={triggerLabel ?? `${label}: ${selectedOption?.label || 'Selecionar'}`}
        onPress={handleOpen}
        style={({ pressed }) => [
          compact ? styles.compactTrigger : styles.trigger,
          isFiltered && (compact ? styles.compactTriggerActive : styles.triggerActive),
          pressed && { opacity: 0.82 },
        ]}
      >
        <View style={styles.triggerLeft}>
          {(icon || selectedOption?.icon) && (
            <Ionicons
              name={(icon || selectedOption?.icon)!}
              size={compact ? 15 : 18}
              color={
                isFiltered
                  ? compact
                    ? colors.onSelection
                    : colors.accent
                  : colors.muted
              }
            />
          )}
          <AppText
            variant={compact ? 'caption' : 'label'}
            numberOfLines={1}
            style={[
              styles.triggerText,
              compact && { fontWeight: '600' },
              isFiltered && compact && { color: colors.onSelection },
              !isFiltered && !compact && { color: colors.ink },
            ]}
          >
            {triggerLabel ?? (selectedOption?.label || label)}
          </AppText>
        </View>

        <View style={styles.triggerRight}>
          {isFiltered && clearable ? (
            <Pressable
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`Limpar ${label}`}
              onPress={(e) => {
                e.stopPropagation();
                onChange(defaultValue);
              }}
              style={styles.clearIconBtn}
            >
              <Ionicons
                name="close-circle"
                size={compact ? 15 : 18}
                color={compact ? colors.onSelection : colors.muted}
              />
            </Pressable>
          ) : (
            <Ionicons
              name="chevron-down"
              size={compact ? 14 : 18}
              color={isFiltered && compact ? colors.onSelection : colors.muted}
            />
          )}
        </View>
      </Pressable>

      <AppBottomSheetModal
        visible={open}
        onClose={() => setOpen(false)}
        title={label}
        snapPoints={computedSnapPoints}
        onHeaderHeightChange={fitOptions ? setHeaderHeight : undefined}
        keyboardBehavior="fillParent"
        keyboardBlurBehavior="restore"
      >
        {options.length > 5 && (
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: colors.surfaceRecessed,
                ...elevation.recessed,
              },
            ]}
          >
            <Ionicons name="search-outline" size={layout.iconSize.md} color={colors.muted} />
            <BottomSheetTextInput
              accessibilityLabel={placeholder}
              value={search}
              onChangeText={setSearch}
              placeholder={placeholder}
              placeholderTextColor={colors.muted}
              keyboardAppearance={mode}
              autoCorrect={false}
              style={[styles.searchInput, { color: colors.ink }]}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <Ionicons name="close-circle" size={layout.iconSize.md} color={colors.muted} />
              </Pressable>
            )}
          </View>
        )}

        <BottomSheetFlatList
          data={filteredOptions}
          keyExtractor={(item) => item.value || '__empty__'}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, spacing.md) }}
          onContentSizeChange={fitOptions ? (_, height) => setOptionsHeight(height) : undefined}
          showsVerticalScrollIndicator={false}
          initialNumToRender={15}
          maxToRenderPerBatch={15}
          windowSize={5}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <AppText variant="body" color="muted">
                Nenhuma opção encontrada para &ldquo;{search}&rdquo;.
              </AppText>
            </View>
          }
          renderItem={renderOption}
        />
      </AppBottomSheetModal>
    </>
  );
}

const createStyles = (colors: ThemeColors, elevation?: ElevationTokens) =>
  StyleSheet.create({
    trigger: {
      minHeight: 48,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: layout.radius.panel,
      backgroundColor: colors.surfaceRecessed,
      ...elevation?.recessed,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    triggerActive: {
      backgroundColor: colors.surfaceRaised,
      ...elevation?.subtle,
    },
    compactTrigger: {
      height: 38,
      paddingHorizontal: spacing.sm + 4,
      borderRadius: layout.radius.compact,
      backgroundColor: colors.surfaceRecessed,
      ...elevation?.recessed,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
      maxWidth: 220,
    },
    compactTriggerActive: {
      backgroundColor: colors.darkPill,
      ...elevation?.subtle,
    },
    triggerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 1,
    },
    triggerText: {
      flexShrink: 1,
    },
    triggerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    clearIconBtn: {
      padding: 2,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: spacing.lg,
      marginVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      height: 44,
      borderRadius: layout.radius.control,
      gap: spacing.xs,
    },
    searchInput: {
      flex: 1,
      height: 44,
      fontSize: fontSizes.label,
      fontFamily: fontFamilies.regular,
    },
    list: {
      marginTop: spacing.xs,
    },
    optionRow: {
      minHeight: 48,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    optionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    optionLabel: {
      flex: 1,
    },
    emptyBox: {
      padding: spacing.xl,
      alignItems: 'center',
    },
  });
