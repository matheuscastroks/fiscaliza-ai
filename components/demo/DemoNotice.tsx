import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@/theme/colors';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { AppText } from '@/components/ui/AppText';

export interface DemoNoticeProps {
  message?: string;
  style?: ViewStyle;
}

export const DemoNotice: React.FC<DemoNoticeProps> = ({
  message = 'Protótipo acadêmico • dados simulados • sem vínculo com prefeitura',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <AppText variant="caption" color="muted" style={styles.text}>
        {message}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceSubdued,
    borderRadius: layout.radius.xs,
    borderWidth: layout.borderWidth.hairline,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
});
