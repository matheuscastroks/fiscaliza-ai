import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { layout } from '@/theme/layout';
import { AppText } from './AppText';

export interface AppHeaderProps {
  title: string;
  context?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  context,
  onBack,
  rightElement,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {onBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.ink} />
          </TouchableOpacity>
        )}
        <View style={styles.titleArea}>
          {context ? (
            <AppText variant="caption" color="muted" numberOfLines={1}>
              {context}
            </AppText>
          ) : null}
          <AppText variant="sectionTitle" color="ink" numberOfLines={1}>
            {title}
          </AppText>
        </View>
        {rightElement ? <View style={styles.rightArea}>{rightElement}</View> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.contentPadding,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    backgroundColor: colors.canvas,
    borderBottomWidth: layout.borderWidth.hairline,
    borderBottomColor: colors.divider,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.touchTarget.minHeight,
  },
  backButton: {
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
  },
  titleArea: {
    flex: 1,
    justifyContent: 'center',
  },
  rightArea: {
    marginLeft: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
