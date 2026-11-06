import React, { useMemo, useState, useCallback } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { layout, spacing } from '@/theme';
import { fontFamilies } from '@/theme/typography';
import { AppText } from './AppText';

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
}: AppSelectProps) {
  const { colors, mode } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

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
                active && { fontWeight: '700', color: colors.ink },
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
              compact && { fontWeight: '700' },
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

      {open && (
        <Modal
          visible={open}
          transparent
          animationType="fade"
          onRequestClose={() => setOpen(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalBackdrop}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setOpen(false)}
              accessibilityLabel="Fechar seleção"
            />

            <View
              style={[
                styles.sheet,
                {
                  backgroundColor: colors.surface,
                  paddingBottom: Math.max(insets.bottom, spacing.md),
                },
              ]}
            >
              <View style={styles.sheetHandleBar}>
                <View style={[styles.sheetHandle, { backgroundColor: colors.divider }]} />
              </View>

              <View style={styles.sheetHeader}>
                <AppText variant="sectionTitle" style={{ fontSize: 17 }}>
                  {label}
                </AppText>
                <Pressable
                  onPress={() => setOpen(false)}
                  hitSlop={12}
                  style={[styles.closeButton, { backgroundColor: colors.surfaceSubdued }]}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar"
                >
                  <Ionicons name="close" size={18} color={colors.ink} />
                </Pressable>
              </View>

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
                  <TextInput
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

              <FlatList
                data={filteredOptions}
                keyExtractor={(item) => item.value || '__empty__'}
                keyboardShouldPersistTaps="handled"
                style={styles.list}
                contentContainerStyle={{ paddingBottom: spacing.md }}
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
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
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
      minHeight: 48,
      paddingHorizontal: spacing.sm + 2,
      borderRadius: layout.radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
      maxWidth: 200,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
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
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    sheet: {
      borderTopLeftRadius: layout.radius.sheet,
      borderTopRightRadius: layout.radius.sheet,
      maxHeight: '78%',
      paddingTop: spacing.xs,
    },
    sheetHandleBar: {
      alignItems: 'center',
      paddingVertical: 6,
    },
    sheetHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xs,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
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
      fontSize: 15,
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
