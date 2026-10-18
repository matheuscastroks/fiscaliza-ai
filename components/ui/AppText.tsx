import { useTheme } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

import {
  typography,
  TypographyVariant,
  fontForWeight,
} from '@/theme/typography';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: keyof ThemeColors | string;
  children?: React.ReactNode;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  color = 'ink',
  style,
  children,
  allowFontScaling = true,
  ...rest
}) => {
  const { colors } = useTheme();

  const textColor = (colors as Record<string, string>)[color] || color;
  const typographyStyle = typography[variant] || typography.body;
  const flattened = StyleSheet.flatten([typographyStyle, style]);

  return (
    <Text
      style={[
        typographyStyle,
        { color: textColor },
        style,
        {
          fontFamily: fontForWeight(flattened.fontWeight),
          fontWeight: 'normal',
        },
      ]}
      allowFontScaling={allowFontScaling}
      {...rest}
    >
      {children}
    </Text>
  );
};
