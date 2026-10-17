import React from 'react';
import { Text, TextProps } from 'react-native';
import { colors } from '@/theme/colors';
import { typography, TypographyVariant } from '@/theme/typography';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: keyof typeof colors | string;
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
  const textColor = (colors as Record<string, string>)[color] || color;
  const typographyStyle = typography[variant] || typography.body;

  return (
    <Text
      style={[typographyStyle, { color: textColor }, style]}
      allowFontScaling={allowFontScaling}
      {...rest}
    >
      {children}
    </Text>
  );
};
