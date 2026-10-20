import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  ViewStyle,
} from 'react-native';

import { spacing } from '@/theme/spacing';
import { layout } from '@/theme/layout';
import { AppText } from './AppText';
import { useKeyboardAwareInput } from './KeyboardAwareScrollView';
import { fontFamilies } from '@/theme/typography';

export interface AppInputProps extends TextInputProps {
  label?: string;
  showLabel?: boolean;
  error?: string | null;
  helper?: string;
  containerStyle?: ViewStyle;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  showLabel = false,
  placeholder,
  error,
  helper,
  containerStyle,
  style,
  editable = true,
  onFocus,
  onBlur,
  ...rest
}) => {
  const { colors, mode } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [isFocused, setIsFocused] = useState(false);
  const input = useRef<TextInput>(null);
  const keyboardScroll = useKeyboardAwareInput();

  const handleFocus: NonNullable<TextInputProps['onFocus']> = (e) => {
    setIsFocused(true);
    if (input.current) keyboardScroll?.focus(input.current);
    onFocus?.(e);
  };

  const handleBlur: NonNullable<TextInputProps['onBlur']> = (e) => {
    setIsFocused(false);
    if (input.current) keyboardScroll?.blur(input.current);
    onBlur?.(e);
  };

  const effectivePlaceholder = placeholder || label;
  const effectiveAccessibilityLabel =
    rest.accessibilityLabel || label || placeholder;

  return (
    <View style={[styles.container, containerStyle]}>
      {showLabel && label ? (
        <AppText variant="label" color="ink" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        ref={input}
        keyboardAppearance={mode}
        accessibilityLabel={effectiveAccessibilityLabel}
        accessibilityHint={error || helper}
        placeholder={effectivePlaceholder}
        style={[
          styles.input,
          rest.multiline && styles.multiline,
          isFocused && styles.inputFocused,
          Boolean(error) && styles.inputError,
          !editable && styles.inputDisabled,
          style,
        ]}
        placeholderTextColor={colors.subtle}
        scrollEnabled={rest.multiline ? true : undefined}
        editable={editable}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...rest}
      />
      {error ? (
        <AppText
          variant="caption"
          color="risk"
          style={styles.feedback}
          accessibilityLiveRegion="polite"
        >
          {error}
        </AppText>
      ) : helper ? (
        <AppText variant="caption" color="muted" style={styles.feedback}>
          {helper}
        </AppText>
      ) : null}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    label: {
      marginBottom: spacing.xs,
    },
    input: {
      minHeight: 56,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: layout.borderWidth.hairline,
      borderColor: colors.border,
      borderRadius: layout.radius.button,
      color: colors.ink,
      fontSize: 16,
      fontFamily: fontFamilies.regular,
    },
    multiline: {
      minHeight: 120,
      maxHeight: 192,
      borderRadius: layout.radius.panel,
      textAlignVertical: 'top',
      paddingTop: spacing.md,
    },
    inputFocused: {
      borderColor: colors.borderActive,
    },
    inputError: {
      borderColor: colors.risk,
    },
    inputDisabled: {
      backgroundColor: colors.surfaceSubdued,
      color: colors.muted,
    },
    feedback: {
      marginTop: spacing.xxs,
    },
  });
