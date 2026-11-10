import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { AppBrandGlyph } from './AppBrandGlyph';
import { UserAvatar } from './UserAvatar';
import { useSignOutSheet } from './SignOutSheet';
import { useTheme, useThemedStyles, spacing, layout } from '@/theme';
import type { ThemeColors } from '@/theme/colors';
import { useAuthStore } from '@/stores/authStore';
import { useTerritoryStore } from '@/stores/territoryStore';
import { useFollowStore } from '@/stores/followStore';
import { fontSizes } from '@/theme/typography';

export const useMenu = create<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>((set) => ({ open: false, setOpen: (open) => set({ open }) }));

type Destination = {
  label: string;
  path: Href;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};
export const citizenNavigationSections: {
  title: string;
  items: Destination[];
}[] = [
  {
    title: 'Minha região',
    items: [
      {
        label: 'Explorar',
        path: '/(tabs)/TerritoryScreen',
        icon: 'map-outline',
      },
      {
        label: 'Salvos',
        path: '/(tabs)/FollowScreen',
        icon: 'bookmark-outline',
      },
      {
        label: 'Agir',
        path: '/(tabs)/ParticipateScreen',
        icon: 'chatbubbles-outline',
      },
    ],
  },
  {
    title: 'Minha conta',
    items: [
      {
        label: 'Meu perfil',
        path: '/(tabs)/ProfileScreen',
        icon: 'person-outline',
      },
      {
        label: 'Preferências',
        path: '/SettingsScreen',
        icon: 'settings-outline',
      },
    ],
  },
  {
    title: 'Informações',
    items: [
      {
        label: 'Como funciona',
        path: '/OnboardingScreen',
        icon: 'book-outline',
      },
      { label: 'Ajuda', path: '/HelpScreen', icon: 'help-circle-outline' },
      {
        label: 'Sobre e fontes',
        path: '/AboutScreen',
        icon: 'information-circle-outline',
      },
      {
        label: 'Aprofundar nos dados',
        path: '/ResultsScreen',
        icon: 'stats-chart-outline',
      },
    ],
  },
];
export const citizenDestinations = citizenNavigationSections.flatMap(
  (section) => section.items,
);

export function SideMenu({
  onClose,
  visible,
}: {
  onClose: (afterClose?: () => void) => void;
  visible: boolean;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const authenticated = useAuthStore((s) => s.isAuthenticated);
  const preferred = useTerritoryStore((s) => s.preferredNeighborhood);
  const savedCount = useFollowStore((s) => s.savedCalls.length);
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
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.brand}>
          <AppBrandGlyph size={32} active={visible} />
          <AppText variant="sectionTitle" style={styles.brandName}>
            Fiscaliza{' '}
            <AppText
              variant="sectionTitle"
              style={[styles.brandName, { color: colors.onSurfaceBrand }]}
            >
              aí
            </AppText>
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar menu"
          disabled={!visible}
          onPress={() => onClose()}
          style={styles.iconButton}
        >
          <Ionicons name="close" size={layout.iconSize.lg} color={colors.ink} />
        </Pressable>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Pressable
          disabled={!visible}
          accessibilityRole="button"
          accessibilityLabel={
            authenticated ? 'Abrir meu perfil' : 'Entrar na minha conta'
          }
          onPress={() =>
            navigate(authenticated ? '/(tabs)/ProfileScreen' : '/LoginScreen')
          }
          style={styles.profile}
        >
          <UserAvatar size={44} />
          <View style={styles.flex}>
            <AppText variant="label" numberOfLines={1}>
              {user?.name || 'Entrar na conta'}
            </AppText>
            <AppText color="muted" variant="caption" numberOfLines={2}>
              {user?.municipality
                ? user.municipality.name + ' · ' + user.municipality.state
                : authenticated
                  ? 'Definir município'
                  : 'Acesse para salvar chamados'}
            </AppText>
            {authenticated && (
              <AppText variant="caption" color="muted">
                {savedCount}{' '}
                {savedCount === 1
                  ? 'chamado salvo'
                  : 'chamados salvos'}
              </AppText>
            )}
          </View>
          <Ionicons name="chevron-forward" size={layout.iconSize.md} color={colors.muted} />
        </Pressable>
        {citizenNavigationSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <AppText
              variant="label"
              color="muted"
              accessibilityRole="header"
              style={styles.sectionTitle}
            >
              {section.title}
            </AppText>
            {section.title === 'Minha região' && (
              <Pressable
                disabled={!visible}
                accessibilityRole="button"
                accessibilityLabel="Escolher minha região"
                onPress={() => navigate('/SettingsScreen')}
                style={styles.region}
              >
                <Ionicons
                  name="location-outline"
                  size={layout.iconSize.md}
                  color={colors.muted}
                />
                <AppText variant="caption" color="muted" style={styles.flex}>
                  {preferred ||
                    user?.neighborhood ||
                    'Rio de Janeiro · todo o município'}
                </AppText>
                <Ionicons
                  name="chevron-forward"
                  size={layout.iconSize.sm}
                  color={colors.muted}
                />
              </Pressable>
            )}
            {section.items.map((item) => {
              const selected =
                pathname === String(item.path).replace('/(tabs)', '');
              return (
                <Pressable
                  key={item.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  disabled={!visible}
                  onPress={() => navigate(item.path)}
                  style={({ pressed }) => [
                    styles.destination,
                    selected && styles.selected,
                    pressed && { opacity: 0.65 },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={layout.iconSize.md}
                    color={selected ? colors.onSurfaceBrand : colors.ink}
                  />
                  <AppText style={styles.flex}>{item.label}</AppText>
                  {selected && (
                    <Ionicons
                      name="checkmark"
                      size={layout.iconSize.md}
                      color={colors.onSurfaceBrand}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <AppButton
          title={authenticated ? 'Sair da conta' : 'Entrar na conta'}
          variant="quiet"
          disabled={!visible}
          onPress={() =>
            onClose(() => {
              if (authenticated) useSignOutSheet.getState().setOpen(true);
              else router.push('/LoginScreen');
            })
          }
        />
      </View>
    </SafeAreaView>
  );
}
function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.canvas,
      borderTopRightRadius: layout.radius.sheet,
      borderBottomRightRadius: layout.radius.sheet,
      overflow: 'hidden',
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xs,
    },
    brand: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    brandName: { fontSize: fontSizes.sectionTitle, flexShrink: 1 },
    iconButton: {
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    appearance: {
      marginHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    themeError: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
    flex: { flex: 1, minWidth: 0 },
    content: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      gap: spacing.xl,
    },
    profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    section: { gap: spacing.xxs },
    sectionTitle: { paddingHorizontal: spacing.sm, marginBottom: spacing.xs },
    region: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      gap: spacing.xs,
      marginBottom: spacing.xxs,
    },
    destination: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: layout.radius.sm,
    },
    selected: { backgroundColor: colors.surfaceSubdued },
    footer: {
      paddingHorizontal: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
  });
}
