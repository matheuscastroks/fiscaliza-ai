import React, { useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { layout } from '@/theme/layout';
import { AppText } from './AppText';

export interface AppInputProps extends TextInputProps {
  label: string;
  error?: string | null;
  helper?: string;
  containerStyle?: ViewStyle;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  helper,
  containerStyle,
  style,
  editable = true,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <AppText variant="label" color="ink" style={styles.label}>
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error || helper}
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          Boolean(error) && styles.inputError,
          !editable && styles.inputDisabled,
          style,
        ]}
        placeholderTextColor={colors.subtle}
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

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: layout.touchTarget.minHeight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: layout.borderWidth.hairline,
    borderColor: colors.border,
    borderRadius: layout.radius.button,
    color: colors.ink,
    fontSize: 16,
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
