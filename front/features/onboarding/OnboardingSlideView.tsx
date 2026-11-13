import React from 'react';
import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/ui/AppText';
import { layout, spacing, useTheme } from '@/theme';
import { lightColors } from '@/theme/colors';
import { styles } from './onboardingStyles';
import { slides, type OnboardingSlide } from './slides';

type Props = { item: OnboardingSlide; index: number; page: number; viewport: number; wide: boolean; height: number };
export function OnboardingSlideView({ item, index, page, viewport, wide, height }: Props) {
  const { colors, isDark } = useTheme();
  return (
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
                          : Math.max(130, Math.min(220, Math.round(height * 0.2))),
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
  );
}
