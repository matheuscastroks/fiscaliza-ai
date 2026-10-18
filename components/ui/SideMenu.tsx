import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useSignOutSheet } from './SignOutSheet';
import { useAuthStore } from '@/stores/authStore';
import { layout, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { AppText } from './AppText';

export const useMenu = create<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>((set) => ({ open: false, setOpen: (open) => set({ open }) }));

interface MenuItem {
  label: string;
  subtitle?: string;
  path: Href;
  icon: keyof typeof Ionicons.glyphMap;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export function SideMenu({
  onClose,
  visible,
}: {
  onClose: (afterClose?: () => void) => void;
  visible: boolean;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const { user } = useAuthStore();
  const sections: MenuSection[] = [
    {
      title: 'Participar da cidade',
      items: [
        {
          label: 'Registrar ocorrência',
          subtitle: 'Relate problemas de vias, luz ou limpeza',
          path: '/(tabs)/ReportScreen',
          icon: 'add-circle-outline',
        },
        {
          label: 'Ocorrências',
          subtitle: 'Demandas e fiscalização da comunidade',
          path: '/(tabs)/ProblemsListScreen',
          icon: 'list-outline',
        },
        {
          label: 'Resultados',
          subtitle: 'Ações da gestão e prestação de contas',
          path: '/ResultsScreen',
          icon: 'stats-chart-outline',
        },
        {
          label: 'Meu município',
          subtitle: user?.municipality
            ? `${user.municipality.name} · ${user.municipality.state}`
            : 'Explore os limites territoriais e bairros',
          path: '/CityScreen',
          icon: 'business-outline',
        },
        {
          label: 'Propor melhoria',
          subtitle: 'Sugira uma mudança para a cidade',
          path: '/ProposalScreen',
          icon: 'bulb-outline',
        },
      ],
    },
    {
      title: 'Sua conta',
      items: [
        {
          label: 'Preferências',
          subtitle: 'Preferências da conta',
          path: '/SettingsScreen',
          icon: 'settings-outline',
        },
        {
          label: 'Acompanhar',
          subtitle: 'Respostas e contribuições que você segue',
          path: '/(tabs)/FollowScreen',
          icon: 'notifications-outline',
        },
        {
          label: 'Ajuda',
          subtitle: 'Perguntas frequentes e canais de contato',
          path: '/HelpScreen',
          icon: 'help-circle-outline',
        },
        {
          label: 'Sobre o Fiscaliza aí',
          subtitle: 'Propósito público, transparência e termos',
          path: '/AboutScreen',
          icon: 'information-circle-outline',
        },
      ],
    },
  ];

  const handleNavigate = (path: Href) => {
    onClose(() => {
      router.push(path);
    });
  };

  const handleOpenProfile = () => {
    onClose(() => {
      router.push('/(tabs)/ProfileScreen');
    });
  };

  const handleLogout = () => {
    onClose(() => useSignOutSheet.getState().setOpen(true));
  };

  return (
    <View
      style={styles.panel}
      pointerEvents={visible ? 'auto' : 'none'}
      role="dialog"
      accessibilityLabel="Menu de navegação"
      aria-hidden={!visible}
      aria-modal={visible}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'yes' : 'no-hide-descendants'}
    >
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'bottom']}
        accessibilityViewIsModal={visible}
      >
        <View style={styles.headerBar}>
          <View style={styles.brandRow}>
            <View style={styles.brandIconWrapper}>
              <Ionicons
                name="shield-checkmark"
                size={18}
                color={colors.onAccent}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText
                variant="sectionTitle"
                color="ink"
                style={styles.brandTitle}
              >
                Fiscaliza aí
              </AppText>
            </View>
          </View>
          <TouchableOpacity
            disabled={!visible}
            onPress={() => onClose()}
            accessibilityRole="button"
            accessibilityLabel="Fechar menu"
            style={styles.closeCircleButton}
          >
            <Ionicons name="close" size={22} color={colors.ink} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <TouchableOpacity
            disabled={!visible}
            activeOpacity={0.8}
            onPress={handleOpenProfile}
            accessibilityRole="button"
            accessibilityLabel={`Perfil de ${user?.name || 'usuário'}. Abrir meu perfil.`}
            style={styles.profileCard}
          >
            <View style={styles.avatarContainer}>
              <UserAvatar size={64} />
            </View>

            <View style={styles.profileInfo}>
              <AppText
                variant="label"
                color="ink"
                numberOfLines={1}
                style={styles.userName}
              >
                {user?.name || 'Cidadão Participativo'}
              </AppText>

              {user?.municipality && (
                <View style={styles.municipalityRow}>
                  <Ionicons
                    name="location-outline"
                    size={12}
                    color={colors.muted}
                  />
                  <AppText
                    variant="caption"
                    color="muted"
                    numberOfLines={1}
                    style={styles.municipalityText}
                  >
                    {user.municipality.name} · {user.municipality.state}
                  </AppText>
                </View>
              )}
            </View>

            <View style={styles.profileArrowCircle}>
              <Ionicons name="chevron-forward" size={18} color={colors.ink} />
            </View>
          </TouchableOpacity>

          {sections.map((section) => (
            <View key={section.title} style={styles.sectionContainer}>
              <AppText variant="caption" style={styles.sectionHeader}>
                {section.title}
              </AppText>

              <View style={styles.itemsGroup}>
                {section.items.map((item, idx) => (
                  <TouchableOpacity
                    disabled={!visible}
                    key={item.label}
                    activeOpacity={0.7}
                    onPress={() => handleNavigate(item.path)}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    style={[
                      styles.menuRow,
                      idx === section.items.length - 1 && styles.menuRowLast,
                    ]}
                  >
                    <View style={styles.iconWrapper}>
                      <Ionicons name={item.icon} size={20} color={colors.ink} />
                    </View>

                    <View style={styles.rowTextContainer}>
                      <AppText
                        variant="body"
                        color="ink"
                        numberOfLines={1}
                        style={styles.rowLabel}
                      >
                        {item.label}
                      </AppText>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.subtle}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          <View style={styles.footerSection}>
            <TouchableOpacity
              disabled={!visible}
              activeOpacity={0.8}
              onPress={handleLogout}
              accessibilityRole="button"
              accessibilityLabel="Sair da conta"
              style={styles.darkLogoutPill}
            >
              <Ionicons
                name="log-out-outline"
                size={18}
                color={colors.onAccent}
              />
              <AppText variant="label" style={styles.logoutPillText}>
                Sair da conta
              </AppText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    panel: {
      flex: 1,
      backgroundColor: colors.canvas,
      borderTopRightRadius: layout.radius.sheet,
      borderBottomRightRadius: layout.radius.sheet,
      overflow: 'hidden',
    },
    safeArea: { flex: 1 },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
    },
    brandRow: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginRight: spacing.sm,
    },
    brandIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: layout.radius.pill,
      backgroundColor: colors.ink,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandTitle: { ...typography.sectionTitle },
    closeCircleButton: {
      flexShrink: 0,
      width: layout.touchTarget.minWidth,
      height: layout.touchTarget.minHeight,
      borderRadius: layout.radius.pill,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.xl,
    },
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: layout.radius.card,
      padding: spacing.md,
      gap: spacing.sm,
    },
    avatarContainer: {},
    profileInfo: { flex: 1, gap: spacing.xxs },
    userName: { ...typography.label },
    municipalityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xxs,
    },
    municipalityText: { ...typography.meta, flexShrink: 1 },
    profileArrowCircle: {
      width: 32,
      height: 32,
      borderRadius: layout.radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionContainer: { gap: spacing.sm },
    sectionHeader: {
      ...typography.label,
      color: colors.muted,
      paddingHorizontal: spacing.xxs,
    },
    itemsGroup: {
      backgroundColor: colors.surface,
      borderRadius: layout.radius.card,
      overflow: 'hidden',
    },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 64,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
      gap: spacing.sm,
    },
    menuRowLast: { borderBottomWidth: 0 },
    iconWrapper: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowTextContainer: { flex: 1, gap: spacing.xxs },
    rowLabel: { ...typography.body },
    rowSubtitle: { ...typography.meta },
    footerSection: { gap: spacing.md },
    darkLogoutPill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 54,
      borderRadius: layout.radius.pill,
      backgroundColor: colors.ink,
      gap: spacing.xs,
    },
    logoutPillText: { ...typography.label, color: colors.onAccent },
  });
