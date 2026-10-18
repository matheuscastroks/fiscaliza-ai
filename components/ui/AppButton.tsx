import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { colors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { AppText } from './AppText';

export type AppButtonVariant =
  | 'primary'
  | 'secondary'
  | 'quiet'
  | 'destructive';

export interface AppButtonProps
  extends Omit<TouchableOpacityProps, 'children'> {
  title: string;
  variant?: AppButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  onPress,
  accessibilityLabel,
  ...rest
}) => {
  const isInteractive = !loading && !disabled;

  const getContainerStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryContainer;
      case 'secondary':
        return styles.secondaryContainer;
      case 'destructive':
        return styles.destructiveContainer;
      case 'quiet':
      default:
        return styles.quietContainer;
    }
  };

  const getTextColor = (): keyof typeof colors => {
    if (disabled) return 'subtle';
    switch (variant) {
      case 'primary':
        return 'white';
      case 'secondary':
        return 'ink';
      case 'destructive':
        return 'white';
      case 'quiet':
      default:
        return 'accent';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.baseContainer,
        getContainerStyle(),
        disabled && styles.disabledContainer,
        style,
      ]}
      onPress={isInteractive ? onPress : undefined}
      activeOpacity={0.75}
      disabled={!isInteractive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'primary' || variant === 'destructive'
              ? colors.white
              : colors.ink
          }
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconMargin}>{icon}</View>}
          <AppText variant="label" color={getTextColor()}>
            {title}
          </AppText>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: layout.radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryContainer: {
    backgroundColor: colors.accent,
  },
  secondaryContainer: {
    backgroundColor: colors.surface,
    borderWidth: layout.borderWidth.hairline,
    borderColor: colors.border,
  },
  destructiveContainer: {
    backgroundColor: colors.risk,
  },
  quietContainer: {
    backgroundColor: 'transparent',
  },
  disabledContainer: {
    backgroundColor: colors.surfaceSubdued,
    borderColor: colors.border,
    borderWidth: layout.borderWidth.hairline,
    opacity: 0.6,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconMargin: {
    marginRight: spacing.xs,
  },
});
