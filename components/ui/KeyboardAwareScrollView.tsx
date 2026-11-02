import React, {
  createContext,
  forwardRef,
  useContext,
  useRef,
  useImperativeHandle,
} from 'react';
import {
  ScrollView,
  TextInput,
} from 'react-native';
import {
  KeyboardAwareScrollView as NativeKeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps as NativeProps,
} from 'react-native-keyboard-controller';

type FocusedInput = {
  focus: (input: TextInput) => void;
  blur: (input: TextInput) => void;
};

const KeyboardScrollContext = createContext<FocusedInput | null>(null);

/** Registers an input with its nearest scroll container, including inside sheets. */
export function useKeyboardAwareInput() {
  return useContext(KeyboardScrollContext);
}

export interface KeyboardAwareScrollViewProps extends NativeProps {
  bottomOffset?: number;
}

const NOOP_FOCUSED_INPUT: FocusedInput = {
  focus: () => {},
  blur: () => {},
};

/**
 * Modern keyboard-aware scroll container powered by react-native-keyboard-controller.
 * Synchronizes with native keyboard transitions at 60/120 FPS on iOS and Android.
 */
export const KeyboardAwareScrollView = forwardRef<ScrollView, KeyboardAwareScrollViewProps>(
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
    const scrollRef = useRef<ScrollView>(null);
    useImperativeHandle(forwardedRef, () => scrollRef.current!, []);

    return (
      <KeyboardScrollContext.Provider value={NOOP_FOCUSED_INPUT}>
        <NativeKeyboardAwareScrollView
          ref={scrollRef as any}
          bottomOffset={bottomOffset}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          {...props}
        >
          {children}
        </NativeKeyboardAwareScrollView>
      </KeyboardScrollContext.Provider>
    );
  },
);
