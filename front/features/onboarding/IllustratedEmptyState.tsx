import { View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { spacing } from '@/theme';
import { Illustration, type IllustrationKind } from './Illustration';

export function IllustratedEmptyState({
  title,
  description,
  kind = 'empty',
  action,
  height = 170,
}: {
  title?: string;
  description: string;
  kind?: IllustrationKind;
  action?: { title: string; onPress: () => void };
  height?: number;
}) {
  return (
    <View
      style={{
        gap: spacing.md,
        paddingVertical: spacing.md,
        maxWidth: 480,
        width: '100%',
        alignSelf: 'center',
      }}
    >
      <Illustration kind={kind} height={height} label={title || description} />
      <View style={{ gap: spacing.xs }}>
        {Boolean(title) && <AppText variant="sectionTitle">{title}</AppText>}
        <AppText color="muted">{description}</AppText>
      </View>
      {action && (
        <AppButton
          variant="secondary"
          title={action.title}
          onPress={action.onPress}
        />
      )}
    </View>
  );
}
