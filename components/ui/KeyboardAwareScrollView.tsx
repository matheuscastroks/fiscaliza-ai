import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  TextInput,
} from 'react-native';

const FIELD_CLEARANCE = 16;

type FocusedInput = {
  focus: (input: TextInput) => void;
  blur: (input: TextInput) => void;
};

const KeyboardScrollContext = createContext<FocusedInput | null>(null);

/** Registers an input with its nearest scroll container, including inside sheets. */
export function useKeyboardAwareInput() {
  return useContext(KeyboardScrollContext);
}

/**
 * Uses the actual viewport rather than assuming the scroll view fills the screen.
 * Works with Expo Go and keeps the original ScrollView ref and event handlers.
 */
export const KeyboardAwareScrollView = forwardRef<ScrollView, ScrollViewProps>(
  function KeyboardAwareScrollView(
    {
      children,
      contentContainerStyle,
      onLayout,
      onContentSizeChange,
      onScroll,
      keyboardShouldPersistTaps = 'handled',
      scrollEventThrottle = 16,
      ...props
    },
    forwardedRef,
  ) {
    const scroll = useRef<ScrollView>(null);
    const focusedInput = useRef<TextInput | null>(null);
    const scrollOffset = useRef(0);
    const keyboardTop = useRef<number | null>(null);
    const frame = useRef<number | null>(null);
    const [keyboardOverlap, setKeyboardOverlap] = useState(0);

    useImperativeHandle(forwardedRef, () => scroll.current!, []);

    const revealFocusedInput = useCallback(() => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        const input = focusedInput.current;
        const container = scroll.current;
        if (!input || !container || !input.isFocused()) return;

        container
          .getNativeScrollRef()
          ?.measureInWindow((_x, viewportY, _width, viewportHeight) => {
            if (scroll.current !== container || focusedInput.current !== input)
              return;
            let visibleBottom = viewportY + viewportHeight;
            if (Platform.OS === 'web') {
              // Mobile browsers resize the visual viewport independently of layout.
              const viewport = window.visualViewport;
              visibleBottom = Math.min(
                visibleBottom,
                viewport
                  ? viewport.offsetTop + viewport.height
                  : window.innerHeight,
              );
            } else if (keyboardTop.current !== null) {
              visibleBottom = Math.min(visibleBottom, keyboardTop.current);
            }
            const overlap = Math.max(
              0,
              viewportY + viewportHeight - visibleBottom,
            );
            setKeyboardOverlap((previous) =>
              Math.abs(previous - overlap) < 1 ? previous : overlap,
            );

            input.measureInWindow(
              (_inputX, inputY, _inputWidth, inputHeight) => {
                if (focusedInput.current !== input || !input.isFocused())
                  return;
                const availableHeight =
                  visibleBottom - viewportY - FIELD_CLEARANCE * 2;
                if (availableHeight <= 0) return;
                // For very tall multiline fields, keep their top accessible.
                const bottom = inputY + Math.min(inputHeight, availableHeight);
                const delta =
                  bottom > visibleBottom - FIELD_CLEARANCE
                    ? bottom - visibleBottom + FIELD_CLEARANCE
                    : inputY < viewportY + FIELD_CLEARANCE
                      ? inputY - viewportY - FIELD_CLEARANCE
                      : 0;
                if (Math.abs(delta) > 1) {
                  container.scrollTo({
                    y: Math.max(0, scrollOffset.current + delta),
                    animated: false,
                  });
                }
              },
            );
          });
      });
    }, []);

    const focus = useCallback(
      (input: TextInput) => {
        focusedInput.current = input;
        revealFocusedInput();
      },
      [revealFocusedInput],
    );

    const blur = useCallback((input: TextInput) => {
      if (focusedInput.current === input) focusedInput.current = null;
    }, []);

    useEffect(() => {
      if (Platform.OS === 'web') {
        const viewport = window.visualViewport;
        const update = () => {
          if (focusedInput.current) revealFocusedInput();
          else setKeyboardOverlap(0);
        };
        viewport?.addEventListener('resize', update);
        viewport?.addEventListener('scroll', update);
        window.addEventListener('resize', update);
        return () => {
          viewport?.removeEventListener('resize', update);
          viewport?.removeEventListener('scroll', update);
          window.removeEventListener('resize', update);
          if (frame.current !== null) cancelAnimationFrame(frame.current);
        };
      }
      const show = Keyboard.addListener('keyboardDidShow', (event) => {
        keyboardTop.current = event.endCoordinates.screenY;
        revealFocusedInput();
      });
      const change = Keyboard.addListener('keyboardDidChangeFrame', (event) => {
        keyboardTop.current = event.endCoordinates.screenY;
        revealFocusedInput();
      });
      const hide = Keyboard.addListener('keyboardDidHide', () => {
        keyboardTop.current = null;
        setKeyboardOverlap(0);
      });
      const metrics = Keyboard.metrics();
      if (metrics) keyboardTop.current = metrics.screenY;
      return () => {
        show.remove();
        change.remove();
        hide.remove();
        if (frame.current !== null) cancelAnimationFrame(frame.current);
      };
    }, [revealFocusedInput]);

    const basePadding =
      StyleSheet.flatten(contentContainerStyle)?.paddingBottom ??
      StyleSheet.flatten(contentContainerStyle)?.paddingVertical ??
      StyleSheet.flatten(contentContainerStyle)?.padding ??
      0;

    return (
      <KeyboardScrollContext.Provider value={{ focus, blur }}>
        <ScrollView
          {...props}
          ref={scroll}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          scrollEventThrottle={scrollEventThrottle}
          contentContainerStyle={[
            contentContainerStyle,
            keyboardOverlap > 0 && {
              paddingBottom:
                (typeof basePadding === 'number' ? basePadding : 0) +
                keyboardOverlap +
                FIELD_CLEARANCE,
            },
          ]}
          onLayout={(event) => {
            onLayout?.(event);
            revealFocusedInput();
          }}
          onContentSizeChange={(width, height) => {
            onContentSizeChange?.(width, height);
            revealFocusedInput();
          }}
          onScroll={(event) => {
            scrollOffset.current = event.nativeEvent.contentOffset.y;
            onScroll?.(event);
          }}
        >
          {children}
        </ScrollView>
      </KeyboardScrollContext.Provider>
    );
  },
);
