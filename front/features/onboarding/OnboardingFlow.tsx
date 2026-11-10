import React, { useEffect, useRef, useState } from 'react';
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
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppBrandGlyph } from '@/components/ui/AppBrandGlyph';
import { ThemeToggleButton } from '@/components/ui/ThemeToggleButton';
import { layout, spacing, useTheme } from '@/theme';
import { fontSizes } from '@/theme/typography';
import { lightColors } from '@/theme/colors';

interface OnboardingBenefit {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

interface OnboardingSlide {
  id: string;
  badge: string;
  badgeIcon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  image: any;
  imageAlt: string;
  benefits: OnboardingBenefit[];
}

const slides: OnboardingSlide[] = [
  {
    id: 'territory',
    badge: 'Explorar',
    badgeIcon: 'map-outline',
    title: 'Veja o que o 1746 publicou perto de você',
    description:
      'Explore no mapa os chamados registrados na sua região e encontre escolas, postos de saúde e praças. Os dados são oficiais e têm data de atualização.',
    image: require('@/assets/images/onboarding-territory.jpg'),
    imageAlt: 'Vista da cidade do Rio de Janeiro com montanhas e ruas ensolaradas',
    benefits: [
      {
        icon: 'locate-outline',
        title: 'Chamados por bairro ou raio',
        description: 'Escolha um bairro ou um lugar seu e veja só o que está por perto.',
      },
      {
        icon: 'business-outline',
        title: 'Serviços públicos',
        description: 'Consulte endereço e contato de escolas, saúde e praças.',
      },
    ],
  },
  {
    id: 'save',
    badge: 'Salvar e agir',
    badgeIcon: 'bookmark-outline',
    title: 'Salve chamados e ache o canal oficial',
    description:
      'Guarde os chamados que importam para voltar a eles. Para abrir um novo, o app leva você ao atendimento oficial da Prefeitura; o envio é sempre feito por você.',
    image: require('@/assets/images/onboarding-follow.jpg'),
    imageAlt: 'Espaço urbano no Rio de Janeiro com calçada de pedras portuguesas e arborização',
    benefits: [
      {
        icon: 'time-outline',
        title: 'Situação e prazo publicados',
        description: 'Veja protocolo, datas e prazo conforme divulgados pela Prefeitura.',
      },
      {
        icon: 'chatbubbles-outline',
        title: 'Canais oficiais reunidos',
        description: 'Telefone 1746, WhatsApp e portal da Prefeitura em um só lugar.',
      },
    ],
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
  const list = useRef<FlatList<OnboardingSlide>>(null);
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
                  borderColor: colors.divider,
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

        {/* Carousel Slides */}
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
                {/* Hero Photographic Stage */}
                <View
                  style={[
                    styles.heroCard,
                    {
                      flex: wide ? 1.1 : undefined,
                      backgroundColor: colors.surfaceSubdued,
                      borderColor: colors.divider,
                    },
                  ]}
                >
                  <Image
                    source={item.image}
                    contentFit="cover"
                    transition={250}
                    style={[
                      styles.heroImage,
                      {
                        height: wide
                          ? 360
                          : Math.max(170, Math.min(240, Math.round(height * 0.27))),
                      },
                    ]}
                    accessibilityLabel={item.imageAlt}
                  />

                  {/* Gradient Overlay for Edge Depth */}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.45)']}
                    style={styles.heroGradient}
                  />

                  {/* Top-Left Floating Feature Badge */}
                  <View style={styles.floatingPill}>
                    <Ionicons name={item.badgeIcon} size={layout.iconSize.sm} color={lightColors.white} />
                    <AppText variant="caption" style={styles.floatingPillText}>
                      {item.badge}
                    </AppText>
                  </View>

                  {/* Top-Right Step Counter */}
                  <View style={styles.stepBadge}>
                    <AppText variant="meta" style={styles.stepBadgeText}>
                      0{index + 1} / 0{slides.length}
                    </AppText>
                  </View>
                </View>

                {/* Copy & Value Inset Table */}
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
                    <AppText color="muted" style={styles.descriptionText}>
                      {item.description}
                    </AppText>
                  </View>

                  {/* Benefits Inset Table (Apple HIG) */}
                  <View
                    style={[
                      styles.benefitsInsetTable,
                      {
                        backgroundColor: isDark ? colors.surface : colors.surfaceSubdued,
                        borderColor: colors.divider,
                      },
                    ]}
                  >
                    {item.benefits.map((benefit, bIdx) => (
                      <View key={benefit.title}>
                        {bIdx > 0 && (
                          <View
                            style={[
                              styles.benefitDivider,
                              { backgroundColor: colors.divider },
                            ]}
                          />
                        )}
                        <View style={styles.benefitRow}>
                          <View
                            style={[
                              styles.benefitIconSquircle,
                              {
                                backgroundColor: isDark
                                  ? colors.surfaceSubdued
                                  : colors.primaryContainer,
                              },
                            ]}
                          >
                            <Ionicons
                              name={benefit.icon}
                              size={layout.iconSize.md}
                              color={colors.primary}
                            />
                          </View>
                          <View style={styles.benefitTextCol}>
                            <AppText variant="label" style={styles.benefitTitle}>
                              {benefit.title}
                            </AppText>
                            <AppText variant="caption" color="muted">
                              {benefit.description}
                            </AppText>
                          </View>
                        </View>
                      </View>
                    ))}
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
                        index === page ? colors.primary : colors.divider,
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
                icon={
                  <Ionicons
                    name={
                      page === slides.length - 1
                        ? replay
                          ? 'checkmark-outline'
                          : 'compass-outline'
                        : 'arrow-forward'
                    }
                    size={layout.iconSize.md}
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
    fontWeight: '600',
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
    borderWidth: StyleSheet.hairlineWidth,
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
    paddingVertical: spacing.sm,
  },
  slideLayout: {
    justifyContent: 'center',
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
  },
  heroCard: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    borderRadius: layout.radius.panel,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
  },
  floatingPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: layout.radius.pill,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  floatingPillText: {
    color: lightColors.white,
    fontWeight: '600',
    fontSize: fontSizes.caption,
  },
  stepBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: layout.radius.pill,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  stepBadgeText: {
    color: lightColors.white,
    fontWeight: '600',
    fontSize: fontSizes.caption,
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
  descriptionText: {
    lineHeight: 21,
  },
  benefitsInsetTable: {
    borderRadius: layout.radius.panel,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  benefitDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 62,
  },
  benefitIconSquircle: {
    width: 36,
    height: 36,
    borderRadius: layout.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTextCol: {
    flex: 1,
    gap: 2,
  },
  benefitTitle: {
    fontSize: fontSizes.meta,
    fontWeight: '600',
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
    borderRadius: layout.radius.xs,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backCircle: {
    width: 54,
    height: 54,
    borderRadius: layout.radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnWrapper: {
    flex: 1,
  },
});
