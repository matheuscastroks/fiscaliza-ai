import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@/theme/colors';
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

const styles = StyleSheet.create({
  divider: {
    height: layout.borderWidth.hairline,
    backgroundColor: colors.divider,
    width: '100%',
  },
});
