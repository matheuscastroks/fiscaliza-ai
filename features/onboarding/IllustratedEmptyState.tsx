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
}: {
  title: string;
  description: string;
  kind?: IllustrationKind;
  action?: { title: string; onPress: () => void };
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
      <Illustration kind={kind} height={170} label={title} />
      <View style={{ gap: spacing.xs }}>
        <AppText variant="sectionTitle">{title}</AppText>
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
