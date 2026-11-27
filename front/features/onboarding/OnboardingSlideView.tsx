import React from 'react';
import { ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { AppText } from '@/components/ui/AppText';
import { spacing, useTheme } from '@/theme';
import { styles } from './onboardingStyles';
import { type OnboardingSlide } from './slides';

type Props = { item: OnboardingSlide; index: number; page: number; viewport: number; wide: boolean; height: number };
export function OnboardingSlideView({ item, index, page, viewport, wide, height }: Props) {
  const { colors } = useTheme();
  return (
    <ScrollView
      style={{ width: viewport }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.slideScroll}
      accessibilityElementsHidden={index !== page}
      importantForAccessibility={index === page ? 'auto' : 'no-hide-descendants'}
    >
      <View style={[
        styles.slideLayout,
        {
          flexDirection: wide ? 'row' : 'column',
          alignItems: wide ? 'center' : 'stretch',
          gap: wide ? spacing.xxxl : spacing.lg,
        },
      ]}>
        <View style={[
          styles.heroCard,
          { flex: wide ? 1.1 : undefined, backgroundColor: colors.surfaceSubdued },
        ]}>
          <Image
            source={item.image}
            contentFit="cover"
            style={[styles.heroImage, {
              height: wide ? 360 : Math.max(110, Math.min(200, Math.round(height * 0.18))),
            }]}
            accessible={false}
          />
        </View>
        <View style={[styles.copyBlock, { flex: wide ? 1 : undefined }]}>
          <AppText variant="screenTitle" accessibilityRole="header">{item.title}</AppText>
          <AppText color="muted">{item.description}</AppText>
        </View>
      </View>
    </ScrollView>
  );
}
