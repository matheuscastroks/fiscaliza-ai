import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppBrandGlyph } from '@/components/ui/AppBrandGlyph';
import { ThemeToggleButton } from '@/components/ui/ThemeToggleButton';
import { layout, spacing, useTheme } from '@/theme';
import { Illustration, type IllustrationKind } from './Illustration';

const slides: {
  id: IllustrationKind;
  kicker: string;
  title: string;
  description: string;
  imageLabel: string;
  highlights: { icon: keyof typeof Ionicons.glyphMap; label: string }[];
  noteIcon: keyof typeof Ionicons.glyphMap;
  note: string;
}[] = [
  {
    id: 'territory',
    kicker: 'Exploração territorial',
    title: 'Descubra sua região',
    description:
      'Explore demandas urbanas do 1746 e encontre escolas, unidades de saúde e praças no mapa colorido ou na lista.',
    imageLabel: 'Pessoas explorando um território',
    highlights: [
      { icon: 'map-outline', label: 'Mapa e lista' },
      { icon: 'locate-outline', label: 'Raio ou bairro' },
    ],
    noteIcon: 'lock-closed-outline',
    note: 'Escolher um bairro é opcional. Não precisa de conta ou GPS para explorar.',
  },
  {
    id: 'results',
    kicker: 'Acompanhamento cidadão',
    title: 'Salve e acompanhe',
    description:
      'Guarde os chamados do seu interesse e volte quando quiser para consultar a situação oficial publicada.',
    imageLabel: 'Pessoas acompanhando um trabalho',
    highlights: [
      { icon: 'bookmark-outline', label: 'Salvos no aparelho' },
      { icon: 'time-outline', label: 'Histórico e situação' },
    ],
    noteIcon: 'information-circle-outline',
    note: 'Seus salvos ficam neste aparelho. Encerrado no 1746 não significa resolução confirmada.',
  },
  {
    id: 'participation',
    kicker: 'Canais oficiais',
    title: 'Encontre como agir',
    description:
      'Consulte as orientações de cada serviço público e acesse diretamente o atendimento oficial para abrir solicitações.',
    imageLabel: 'Acesso aos canais oficiais representado por um avião de papel',
    highlights: [
      { icon: 'megaphone-outline', label: 'Central 1746' },
      { icon: 'open-outline', label: 'Acesso direto' },
    ],
    noteIcon: 'shield-checkmark-outline',
    note: 'O Fiscaliza aí é independente. Solicitações são feitas no canal oficial da prefeitura.',
  },
];

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
  const [reduced, setReduced] = useState(false);
  const list = useRef<FlatList<(typeof slides)[number]>>(null);
  const wide = viewport >= 850;
  const pageRef = useRef(page);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduced,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  // Keep the current slide after rotation or resizing, without resetting progress.
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
    setBusy(true);
    try {
      await onFinish();
    } finally {
      setBusy(false);
    }
  };

  const goToPage = (target: number) => {
    const clamped = Math.max(0, Math.min(slides.length - 1, target));
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
        {/* Top Bar */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <AppBrandGlyph size={32} active />
            <View style={styles.brandTextCol}>
              <AppText
                variant="sectionTitle"
                numberOfLines={1}
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
              <AppText variant="caption" color="muted" numberOfLines={1}>
                Seu bairro, em acompanhamento.
              </AppText>
            </View>
          </View>

          <View style={styles.headerActions}>
            <ThemeToggleButton />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={replay ? 'Fechar apresentação' : 'Pular apresentação'}
              disabled={busy}
              onPress={() => {
                void finish();
              }}
              style={({ pressed }) => [
                styles.skipPill,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: busy ? 0.5 : pressed ? 0.75 : 1,
                },
              ]}
            >
              <AppText variant="label" style={styles.skipText}>
                {replay ? 'Fechar' : 'Pular'}
              </AppText>
            </Pressable>
          </View>
        </View>

        {/* Slides Carousel */}
        <FlatList
          ref={list}
          data={slides}
          horizontal
          pagingEnabled
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
            <ScrollView
              style={{ width: viewport }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.slideScroll}
              accessibilityElementsHidden={index !== page}
              importantForAccessibility={
                index === page ? 'auto' : 'no-hide-descendants'
              }
              aria-hidden={index !== page}
            >
              <View
                style={[
                  styles.slideLayout,
                  {
                    flexDirection: wide ? 'row' : 'column',
                    alignItems: wide ? 'center' : 'stretch',
                    gap: wide ? spacing.xxxl : spacing.lg,
                  },
                ]}
              >
                {/* Stage Card with Kicker, Illustration & Feature Chips */}
                <View
                  style={[
                    styles.stageCard,
                    {
                      flex: wide ? 1 : undefined,
                      backgroundColor: isDark
                        ? colors.surfaceSubdued
                        : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.stageTopRow}>
                    <View
                      style={[
                        styles.kickerPill,
                        {
                          backgroundColor: isDark
                            ? colors.surface
                            : colors.surfaceSubdued,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.kickerDot,
                          { backgroundColor: colors.brandYellow },
                        ]}
                      />
                      <AppText
                        variant="meta"
                        style={[
                          styles.kickerText,
                          { color: colors.onSurfaceBrand },
                        ]}
                      >
                        {item.kicker}
                      </AppText>
                    </View>

                    <AppText variant="protocol" color="muted">
                      0{index + 1} / 0{slides.length}
                    </AppText>
                  </View>

                  <Illustration
                    kind={item.id}
                    height={
                      wide ? 280 : Math.max(135, Math.min(200, height * 0.22))
                    }
                    label={item.imageLabel}
                  />

                  <View style={styles.highlightsRow}>
                    {item.highlights.map((chip) => (
                      <View
                        key={chip.label}
                        style={[
                          styles.highlightChip,
                          {
                            backgroundColor: isDark
                              ? colors.surface
                              : colors.canvas,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Ionicons
                          name={chip.icon}
                          size={14}
                          color={colors.onSurfaceBrand}
                        />
                        <AppText
                          variant="caption"
                          style={styles.highlightChipText}
                        >
                          {chip.label}
                        </AppText>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Copy & Transparency Callout */}
                <View
                  style={[
                    styles.copyBlock,
                    { flex: wide ? 1 : undefined },
                  ]}
                >
                  <View style={styles.headingGroup}>
                    <AppText variant="screenTitle" accessibilityRole="header">
                      {item.title}
                    </AppText>
                    <AppText color="muted">{item.description}</AppText>
                  </View>

                  <View
                    style={[
                      styles.noteCard,
                      {
                        backgroundColor: isDark
                          ? colors.surface
                          : colors.surfaceSubdued,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.noteIconCircle,
                        {
                          backgroundColor: isDark
                            ? colors.surfaceSubdued
                            : colors.surface,
                        },
                      ]}
                    >
                      <Ionicons
                        name={item.noteIcon}
                        size={16}
                        color={colors.onSurfaceBrand}
                      />
                    </View>
                    <AppText
                      variant="caption"
                      color="muted"
                      style={styles.noteText}
                    >
                      {item.note}
                    </AppText>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}
        />

        {/* Footer Controls */}
        <View style={styles.footer}>
          <View style={styles.paginationRow}>
            <View
              style={styles.dotsRow}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              aria-hidden
            >
              {slides.map((slide, index) => (
                <View
                  key={slide.id}
                  style={[
                    styles.dot,
                    {
                      width: index === page ? 28 : 8,
                      backgroundColor:
                        index === page ? colors.onSurfaceBrand : colors.border,
                    },
                  ]}
                />
              ))}
            </View>
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
                    borderColor: colors.border,
                    opacity: busy ? 0.5 : pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Ionicons name="arrow-back" size={20} color={colors.ink} />
              </Pressable>
            )}
            <View style={styles.primaryBtnWrapper}>
              <AppButton
                title={
                  page === slides.length - 1
                    ? replay
                      ? 'Voltar ao app'
                      : 'Começar a explorar'
                    : 'Próximo'
                }
                loading={busy}
                onPress={next}
                icon={
                  <Ionicons
                    name={
                      page === slides.length - 1
                        ? 'compass-outline'
                        : 'arrow-forward'
                    }
                    size={20}
                    color={colors.onAccentBrand}
                  />
                }
              />
            </View>
          </View>
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.contentPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  brandRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandTextCol: {
    flex: 1,
  },
  brandTitle: {
    fontWeight: '700',
    lineHeight: 24,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  skipPill: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: layout.radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontWeight: '600',
  },
  slideScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.contentPadding,
    paddingVertical: spacing.md,
  },
  slideLayout: {
    justifyContent: 'center',
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
  },
  stageCard: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    borderRadius: layout.radius.card,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  stageTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  kickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: layout.radius.pill,
  },
  kickerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  kickerText: {
    fontWeight: '700',
  },
  highlightsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingTop: spacing.xxs,
  },
  highlightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: layout.radius.pill,
    borderWidth: 1,
  },
  highlightChipText: {
    fontWeight: '600',
  },
  copyBlock: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    gap: spacing.md,
  },
  headingGroup: {
    gap: spacing.xs,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: layout.radius.panel,
    borderWidth: 1,
  },
  noteIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteText: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.contentPadding,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    gap: spacing.md,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnWrapper: {
    flex: 1,
  },
});
