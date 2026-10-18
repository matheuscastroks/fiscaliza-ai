import React from 'react';
import {
  StyleSheet,
  ViewProps,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { KeyboardAwareScrollView } from './KeyboardAwareScrollView';

export interface AppScreenProps extends ViewProps {
  scroll?: boolean;
  keyboardAvoiding?: boolean;
  edges?: Edge[];
  children: React.ReactNode;
}

export const AppScreen: React.FC<AppScreenProps> = ({
  scroll = false,
  keyboardAvoiding = false,
  edges = ['top', 'left', 'right'],
  style,
  children,
  ...rest
}) => {
  const content = scroll ? (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </KeyboardAwareScrollView>
  ) : (
    children
  );

  const wrappedContent = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <SafeAreaView edges={edges} style={[styles.container, style]} {...rest}>
      {wrappedContent}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.contentPadding,
    paddingVertical: spacing.md,
  },
});
