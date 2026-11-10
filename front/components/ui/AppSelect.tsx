import React, { useMemo, useState, useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { layout, spacing } from '@/theme';
import { fontFamilies } from '@/theme/typography';
import { AppText } from './AppText';
import {
  AppBottomSheetModal,
  BottomSheetFlatList,
  BottomSheetTextInput,
} from './AppBottomSheetModal';
import { fontSizes } from '@/theme/typography';

export interface SelectOption {
  value: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface AppSelectProps {
  label: string;
  options: readonly SelectOption[];
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
  options,
  value,
  onChange,
  placeholder = 'Pesquisar opção...',
  icon,
  compact = false,
  defaultValue = '',
  clearable = true,
  snapPoints: customSnapPoints,
}: AppSelectProps) {
  const { colors, mode } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const computedSnapPoints = useMemo(() => {
    if (customSnapPoints) return customSnapPoints;
    if (options.length <= 3) return ['30%'];
    if (options.length <= 5) return ['40%'];
    return ['55%', '85%'];
  }, [customSnapPoints, options.length]);

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
            active && { backgroundColor: colors.surfaceSubdued },
            pressed && { opacity: 0.75 },
          ]}
        >
          <View style={styles.optionLeft}>
            {item.icon && (
              <Ionicons
                name={item.icon}
                size={18}
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
              size={20}
              color={colors.accent}
            />
          )}
        </Pressable>
      );
    },
    [colors.accent, colors.ink, colors.muted, colors.surfaceSubdued, handleSelect, styles.optionLabel, styles.optionLeft, styles.optionRow, value],
  );

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selectedOption?.label || 'Selecionar'}`}
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
            {selectedOption?.label || label}
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
      >
        {options.length > 5 && (
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: colors.surfaceSubdued,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="search-outline" size={18} color={colors.muted} />
            <BottomSheetTextInput
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
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </Pressable>
            )}
          </View>
        )}

        <BottomSheetFlatList
          data={filteredOptions}
          keyExtractor={(item) => item.value || '__empty__'}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          contentContainerStyle={{ paddingBottom: spacing.md }}
          scrollEnabled={options.length > 3}
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    trigger: {
      minHeight: 48,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: layout.radius.panel,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    triggerActive: {
      borderColor: colors.ink,
    },
    compactTrigger: {
      height: 38,
      paddingHorizontal: spacing.sm + 4,
      borderRadius: layout.radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
      maxWidth: 220,
    },
    compactTriggerActive: {
      backgroundColor: colors.darkPill,
      borderColor: colors.darkPill,
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
      borderRadius: layout.radius.pill,
      borderWidth: 1,
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
