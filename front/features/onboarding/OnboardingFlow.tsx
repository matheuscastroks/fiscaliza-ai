import { useReducedMotion } from '@/hooks/useReducedMotion';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppBrandGlyph } from '@/components/ui/AppBrandGlyph';
import { layout, useTheme } from '@/theme';
import { styles } from './onboardingStyles';
import { slides, type OnboardingSlide } from './slides';
import { OnboardingSlideView } from './OnboardingSlideView';

export function OnboardingFlow({
  onFinish,
  replay = false,
}: {
  onFinish: () => Promise<unknown> | void;
  replay?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const [viewport, setViewport] = useState(Math.min(width, 1200));
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const reduced = useReducedMotion();
  const list = useRef<FlatList<OnboardingSlide>>(null);
  const wide = viewport >= 850;
  const pageRef = useRef(page);


  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    list.current?.scrollToOffset({
      offset: pageRef.current * viewport,
      animated: false,
    });
  }, [viewport]);

  const finish = async () => {
    if (busy) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBusy(true);
    try {
      await onFinish();
    } finally {
      setBusy(false);
    }
  };

  const goToPage = (target: number) => {
    const clamped = Math.max(0, Math.min(slides.length - 1, target));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPage(clamped);
    list.current?.scrollToOffset({
      offset: clamped * viewport,
      animated: !reduced,
    });
  };

  const next = () => {
    if (page === slides.length - 1) {
      void finish();
      return;
    }
    goToPage(page + 1);
  };

  const prev = () => {
    if (page > 0) {
      goToPage(page - 1);
    }
  };

  return (
    <AppScreen edges={['top', 'bottom', 'left', 'right']}>
      <View
        onLayout={(event) => setViewport(event.nativeEvent.layout.width)}
        style={styles.root}
      >
        {/* Top Header Bar */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <AppBrandGlyph size={32} active />
            <View style={styles.brandTextCol}>
              <AppText
                variant="sectionTitle"
                style={styles.brandTitle}
              >
                Fiscaliza{' '}
                <AppText
                  variant="sectionTitle"
                  style={[styles.brandTitle, { color: colors.onSurfaceBrand }]}
                >
                  aí
                </AppText>
              </AppText>
            </View>
          </View>

        </View>

        {/* Carousel Slides */}
        <FlatList
          ref={list}
          data={slides}
          horizontal
          pagingEnabled
          scrollEnabled={replay}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          extraData={{ viewport, page, wide, height, isDark }}
          getItemLayout={(_, index) => ({
            length: viewport,
            offset: viewport * index,
            index,
          })}
          onMomentumScrollEnd={(event) =>
            setPage(
              Math.max(
                0,
                Math.min(
                  slides.length - 1,
                  Math.round(event.nativeEvent.contentOffset.x / viewport),
                ),
              ),
            )
          }
          renderItem={({ item, index }) => (
            <OnboardingSlideView item={item} index={index} page={page} viewport={viewport} wide={wide} height={height} />
          )}
        />

        {/* Footer Controls */}
        <View style={styles.footer}>
          <View style={styles.paginationRow}>
            <AppText
              variant="caption"
              color="muted"
              accessibilityLiveRegion="polite"
            >
              Etapa {page + 1} de {slides.length}
            </AppText>
          </View>

          <View style={styles.actionRow}>
            {page > 0 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Etapa anterior"
                disabled={busy}
                onPress={prev}
                style={({ pressed }) => [
                  styles.backCircle,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.divider,
                    opacity: busy ? 0.5 : pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.ink} />
              </Pressable>
            )}
            <View style={styles.primaryBtnWrapper}>
              <AppButton
                title={
                  page === slides.length - 1
                    ? replay
                      ? 'Voltar ao app'
                      : 'Começar a explorar'
                    : 'Continuar'
                }
                loading={busy}
                onPress={next}
              />
            </View>
          </View>
        </View>
      </View>
    </AppScreen>
  );
}

