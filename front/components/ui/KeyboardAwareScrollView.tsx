import React, {
  forwardRef,
  useRef,
  useImperativeHandle,
} from 'react';
import { ScrollView } from 'react-native';
import {
  KeyboardAwareScrollView as NativeKeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps as NativeProps,
} from 'react-native-keyboard-controller';

export interface KeyboardAwareScrollViewProps extends NativeProps {
  bottomOffset?: number;
}

/**
 * Modern keyboard-aware scroll container powered by react-native-keyboard-controller.
 * Synchronizes with native keyboard transitions at 60/120 FPS on iOS and Android.
 */
export const KeyboardAwareScrollView = forwardRef<
  React.ComponentRef<typeof ScrollView>,
  KeyboardAwareScrollViewProps
>(
  function KeyboardAwareScrollView(
    {
      children,
      bottomOffset = 24,
      keyboardShouldPersistTaps = 'handled',
      showsVerticalScrollIndicator = false,
      ...props
    },
    forwardedRef,
  ) {
    const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
    useImperativeHandle(forwardedRef, () => scrollRef.current!, []);

    return (
      <NativeKeyboardAwareScrollView
        ref={scrollRef as any}
        bottomOffset={bottomOffset}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        {...props}
      >
        {children}
      </NativeKeyboardAwareScrollView>
    );
  },
);
