import { View, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { AppText } from './AppText';
import { useTheme, spacing, layout } from '@/theme';
import { useTerritoryStore } from '@/stores/territoryStore';
export const useMenu = create<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>((set) => ({ open: false, setOpen: (open) => set({ open }) }));
export const citizenDestinations = [
  { label: 'Início', path: '/' as Href, icon: 'home-outline' as const },
  {
    label: 'Explorar',
    path: '/(tabs)/TerritoryScreen' as Href,
    icon: 'map-outline' as const,
  },
  {
    label: 'Acompanhar',
    path: '/(tabs)/FollowScreen' as Href,
    icon: 'bookmark-outline' as const,
  },
  {
    label: 'Agir',
    path: '/(tabs)/ParticipateScreen' as Href,
    icon: 'hand-left-outline' as const,
  },
  {
    label: 'Preferências',
    path: '/SettingsScreen' as Href,
    icon: 'settings-outline' as const,
  },
  {
    label: 'Como funciona',
    path: '/OnboardingScreen' as Href,
    icon: 'book-outline' as const,
  },
  {
    label: 'Ajuda',
    path: '/HelpScreen' as Href,
    icon: 'help-circle-outline' as const,
  },
  {
    label: 'Sobre e fontes',
    path: '/AboutScreen' as Href,
    icon: 'information-circle-outline' as const,
  },
  {
    label: 'Aprofundar nos dados',
    path: '/ResultsScreen' as Href,
    icon: 'stats-chart-outline' as const,
  },
];
export function SideMenu({
  onClose,
  visible,
}: {
  onClose: (afterClose?: () => void) => void;
  visible: boolean;
}) {
  const { colors } = useTheme();
  const preferred = useTerritoryStore((s) => s.preferredNeighborhood);
  const navigate = (path: Href) => onClose(() => router.push(path));
  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      role="dialog"
      accessibilityLabel="Menu de navegação"
      aria-modal={visible}
      aria-hidden={!visible}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'yes' : 'no-hide-descendants'}
      pointerEvents={visible ? 'auto' : 'none'}
      style={{
        flex: 1,
        backgroundColor: colors.canvas,
        borderTopRightRadius: layout.radius.sheet,
        borderBottomRightRadius: layout.radius.sheet,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          padding: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <AppText variant="sectionTitle">Fiscaliza aí</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar menu"
          disabled={!visible}
          onPress={() => onClose()}
          style={{ padding: spacing.sm }}
        >
          <Ionicons name="close" size={24} color={colors.ink} />
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
      >
        <Pressable
          disabled={!visible}
          accessibilityRole="button"
          accessibilityLabel="Escolher minha região"
          onPress={() => navigate('/SettingsScreen')}
          style={{
            backgroundColor: colors.surface,
            borderRadius: layout.radius.card,
            padding: spacing.lg,
            gap: spacing.xs,
          }}
        >
          <Ionicons name="location-outline" size={26} color={colors.ink} />
          <AppText variant="label">Minha região</AppText>
          <AppText color="muted" variant="caption">
            {preferred || 'Rio de Janeiro · todo o município'}
          </AppText>
        </Pressable>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: layout.radius.card,
            overflow: 'hidden',
          }}
        >
          {citizenDestinations.map((item) => (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              disabled={!visible}
              onPress={() => navigate(item.path)}
              style={({ pressed }) => ({
                minHeight: 58,
                paddingHorizontal: spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <Ionicons name={item.icon} size={21} color={colors.ink} />
              <AppText style={{ flex: 1 }}>{item.label}</AppText>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </Pressable>
          ))}
        </View>
        <AppText variant="caption" color="muted">
          Seus salvos ficam neste aparelho.
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}
