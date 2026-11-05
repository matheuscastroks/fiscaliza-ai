import { useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';

export interface AppDividerProps {
  spacingVertical?: keyof typeof spacing;
  style?: ViewStyle;
}

export const AppDivider: React.FC<AppDividerProps> = ({
  spacingVertical,
  style,
}) => {
  const styles = useThemedStyles(createStyles);

  const marginV = spacingVertical ? spacing[spacingVertical] : 0;

  return (
    <View
      style={[
        styles.divider,
        marginV > 0 && { marginVertical: marginV },
        style,
      ]}
    />
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    divider: {
      height: layout.borderWidth.hairline,
      backgroundColor: colors.divider,
      width: '100%',
    },
  });
