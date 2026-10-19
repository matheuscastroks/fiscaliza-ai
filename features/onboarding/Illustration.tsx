import { Image } from 'expo-image';
import { View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { spacing } from '@/theme';

const illustrations = {
  territory: require('@/assets/illustrations/oc-project-development.svg'),
  report: require('@/assets/illustrations/oc-taking-note.svg'),
  participation: require('@/assets/illustrations/nc-design-proposal.svg'),
  results: require('@/assets/illustrations/nc-reviewing.svg'),
  empty: require('@/assets/illustrations/nc-no-answer.svg'),
  target: require('@/assets/illustrations/oc-target.svg'),
  consultation: require('@/assets/illustrations/nc-research-panel.svg'),
  action: require('@/assets/illustrations/oc-puzzle.svg'),
};
export type IllustrationKind = keyof typeof illustrations;

/** Adapts stroke and fill to current theme ink color (light/dark) with transparent background. */
export function Illustration({
  kind,
  height = 260,
  label,
}: {
  kind: IllustrationKind;
  height?: number;
  label: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        height,
        width: '100%',
        maxWidth: 440,
        alignSelf: 'center',
        paddingVertical: spacing.xs,
        overflow: 'hidden',
      }}
    >
      <Image
        source={illustrations[kind]}
        contentFit="contain"
        tintColor={colors.ink}
        style={{ width: '100%', height: '100%' }}
        accessibilityLabel={label}
      />
    </View>
  );
}
