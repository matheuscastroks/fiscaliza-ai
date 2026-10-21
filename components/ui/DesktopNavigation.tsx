import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useTheme } from '@/theme/useTheme';
import { useTerritoryStore } from '@/stores/territoryStore';
import { AppText } from './AppText';
import { citizenDestinations } from './SideMenu';
export function DesktopNavigation() {
  const { colors } = useTheme();
  const path = usePathname();
  const preferred = useTerritoryStore((s) => s.preferredNeighborhood);
  return (
    <View
      style={{
        width: 256,
        backgroundColor: colors.surface,
        borderRightWidth: 1,
        borderRightColor: colors.divider,
        padding: 24,
        gap: 24,
      }}
    >
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Fiscaliza aí, início"
        onPress={() => router.push('/')}
      >
        <AppText variant="screenTitle">Fiscaliza aí</AppText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Escolher minha região"
        onPress={() => router.push('/SettingsScreen')}
        style={{ gap: 4 }}
      >
        <AppText variant="label">Minha região</AppText>
        <AppText variant="caption" color="muted">
          {preferred || 'Todo o município'} · Rio de Janeiro
        </AppText>
      </Pressable>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 8 }}>
        {citizenDestinations.map((item) => {
          const selected = path === String(item.path).replace('/(tabs)', '');
          return (
            <Pressable
              key={item.label}
              accessibilityRole="link"
              accessibilityLabel={item.label}
              accessibilityState={{ selected }}
              onPress={() => router.push(item.path)}
              style={({ pressed }) => ({
                minHeight: 52,
                borderRadius: 28,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: selected
                  ? colors.ink
                  : pressed
                    ? colors.surfaceSubdued
                    : colors.transparent,
              })}
            >
              <Ionicons
                name={item.icon}
                size={21}
                color={selected ? colors.onAccent : colors.muted}
              />
              <AppText variant="label" color={selected ? 'onAccent' : 'ink'}>
                {item.label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
      <AppText variant="caption" color="muted">
        Seus salvos ficam neste navegador.
      </AppText>
    </View>
  );
}
