import { Image } from 'expo-image';
import { View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { layout, spacing } from '@/theme';

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

/** Original SVGs on a light backing preserve their black outlines in both themes. */
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
        borderRadius: layout.radius.sheet,
        backgroundColor: colors.white,
        padding: spacing.xl,
        overflow: 'hidden',
      }}
    >
      <Image
        source={illustrations[kind]}
        contentFit="contain"
        style={{ width: '100%', height: '100%' }}
        accessibilityLabel={label}
      />
    </View>
  );
}
