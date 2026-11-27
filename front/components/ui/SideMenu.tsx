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

export const useMenu = create<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>((set) => ({ open: false, setOpen: (open) => set({ open }) }));

type Destination = {
  label: string;
  path: Href;
};
export const citizenNavigationSections: {
  title: string;
  items: Destination[];
}[] = [
  {
    title: 'Cidade e chamados',
    items: [
      {
        label: 'Explorar',
        path: '/(tabs)/TerritoryScreen',
      },
      {
        label: 'Salvos',
        path: '/(tabs)/FollowScreen',
      },
      {
        label: 'Agir',
        path: '/(tabs)/ParticipateScreen',
      },
      {
        label: 'Dados do bairro',
        path: '/ResultsScreen',
      },
    ],
  },
  {
    title: 'Conta e preferências',
    items: [
      {
        label: 'Meu perfil',
        path: '/(tabs)/ProfileScreen',
      },
      {
        label: 'Preferências',
        path: '/SettingsScreen',
      },
    ],
  },
  {
    title: 'Ajuda e informações',
    items: [
      {
        label: 'Como funciona',
        path: '/OnboardingScreen',
      },
      { label: 'Ajuda', path: '/HelpScreen' },
      {
        label: 'Sobre o app',
        path: '/AboutScreen',
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
  const { colors, elevation } = useTheme();
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
          <View style={styles.brandWords} accessible accessibilityLabel="Fiscaliza aí">
            <AppText variant="sectionTitle">Fiscaliza</AppText>
            <AppText variant="sectionTitle" color={colors.onSurfaceBrand}>aí</AppText>
          </View>
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
          {authenticated && <UserAvatar size={44} />}
          <View style={styles.flex}>
            <AppText variant="label">
              {user?.name || 'Entrar na conta'}
            </AppText>
            <AppText color="muted" variant="caption">
              {user?.municipality
                ? user.municipality.name + ' · ' + user.municipality.state
                : authenticated
                  ? 'Definir cidade'
                  : 'Seus salvos em qualquer aparelho'}
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
            {section.title === 'Cidade e chamados' && preferred ? (
              <AppText variant="caption" color="muted" style={styles.sectionTitle}>Bairro preferido · {preferred}</AppText>
            ) : null}
            {section.items.filter((item) => !authenticated || item.path !== '/(tabs)/ProfileScreen').map((item) => {
              const selected =
                pathname === String(item.path).replace('/(tabs)', '') ||
                (pathname === '/' && item.path === '/(tabs)/TerritoryScreen');
              return (
                <Pressable
                  key={item.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  disabled={!visible}
                  onPress={() => navigate(item.path)}
                  style={({ pressed }) => [
                    styles.destination,
                    selected && [styles.selected, elevation.subtle],
                    pressed && { opacity: 0.65 },
                  ]}
                >
                  <AppText style={styles.flex}>{item.label}</AppText>
                  {selected && (
                    <Ionicons
                      name="checkmark"
                      size={layout.iconSize.md}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
      {authenticated && <View style={styles.footer}>
        <AppButton
          title="Sair da conta"
          variant="quiet"
          disabled={!visible}
          onPress={() =>
            onClose(() => useSignOutSheet.getState().setOpen(true))
          }
        />
      </View>}
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
    brandWords: { flexShrink: 1, flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.xxs },
    iconButton: {
      minWidth: 48,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    flex: { flex: 1, minWidth: 0 },
    content: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      gap: spacing.lg,
    },
    profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm },
    section: { gap: spacing.xxs },
    sectionTitle: { paddingHorizontal: spacing.sm, marginBottom: spacing.xs },
    destination: {
      minHeight: layout.touchTarget.minHeight,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: layout.radius.sm,
    },
    selected: { backgroundColor: colors.surfaceRaised },
    footer: {
      paddingHorizontal: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
  });
}
