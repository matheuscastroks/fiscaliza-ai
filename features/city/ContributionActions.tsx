import { useTheme } from '@/theme/useTheme';
import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { spacing } from '@/theme';

export function ContributionActions({
  camera = false,
  onChoose,
}: {
  camera?: boolean;
  onChoose?: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={{ gap: spacing.sm, width: '100%', alignSelf: 'stretch' }}>
      {(
        [
          {
            title: 'Registrar ocorrência',
            description: 'Um problema que precisa de atendimento.',
            icon: 'camera-outline',
            path: '/(tabs)/ReportScreen',
          },
          {
            title: 'Propor melhoria',
            description: 'Uma ideia para transformar um espaço.',
            icon: 'bulb-outline',
            path: '/ProposalScreen',
          },
        ] as const
      ).map((action) => (
        <Pressable
          key={action.path}
          accessibilityRole="button"
          accessibilityLabel={action.title}
          onPress={() => {
            onChoose?.();
            router.push({
              pathname: action.path,
              ...(camera ? { params: { camera: String(Date.now()) } } : {}),
            });
          }}
          style={({ pressed }) => ({
            flexDirection: 'row',
            width: '100%',
            alignItems: 'center',
            gap: spacing.sm,
            padding: spacing.md,
            borderRadius: 24,
            backgroundColor: pressed ? colors.surfaceSubdued : colors.surface,
          })}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor:
                action.icon === 'camera-outline'
                  ? colors.ink
                  : colors.surfaceSubdued,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name={action.icon}
              size={24}
              color={
                action.icon === 'camera-outline' ? colors.onAccent : colors.ink
              }
            />
          </View>
          <View style={{ flex: 1, gap: spacing.xxs }}>
            <AppText variant="label">{action.title}</AppText>
            <AppText variant="meta" color="muted">
              {action.description}
            </AppText>
          </View>
          <Ionicons name="arrow-forward" size={20} color={colors.ink} />
        </Pressable>
      ))}
    </View>
  );
}
