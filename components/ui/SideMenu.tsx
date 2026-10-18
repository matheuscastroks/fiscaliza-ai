import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuthStore } from '@/stores/authStore';
import { colors, layout, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
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

export function SideMenu() {
  const { open, setOpen } = useMenu();
  const { user, logout } = useAuthStore();
  const { width: screenWidth } = useWindowDimensions();

  // Ocupa praticamente 90% da tela horizontalmente (com teto em 480 para telas muito largas)
  const panelWidth =
    screenWidth >= 600
      ? Math.min(Math.round(screenWidth * 0.9), 480)
      : Math.round(screenWidth * 0.9);

  const reducedMotion = useReducedMotion();
  const slideAnim = useState(() => new Animated.Value(-panelWidth))[0];
  const fadeAnim = useState(() => new Animated.Value(0))[0];
  const isClosingRef = useRef(false);

  const handleClose = useCallback(
    (callback?: () => void) => {
      if (isClosingRef.current) return;
      isClosingRef.current = true;

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -panelWidth,
          duration: reducedMotion ? 0 : 240,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: reducedMotion ? 0 : 240,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => {
        setOpen(false);
        isClosingRef.current = false;
        if (callback) {
          callback();
        }
      });
    },
    [fadeAnim, panelWidth, setOpen, slideAnim, reducedMotion],
  );

  useEffect(() => {
    if (open) {
      isClosingRef.current = false;
      slideAnim.setValue(-panelWidth);
      fadeAnim.setValue(0);

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: reducedMotion ? 0 : 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: reducedMotion ? 0 : 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }
  }, [open, panelWidth, slideAnim, fadeAnim, reducedMotion]);

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
    handleClose(() => {
      router.push(path);
    });
  };

  const handleOpenProfile = () => {
    handleClose(() => {
      router.push('/(tabs)/ProfileScreen');
    });
  };

  const handleLogout = () => {
    handleClose(async () => {
      try {
        await logout();
      } catch {
        // Ignora falhas de rede no logout local
      }
    });
  };

  if (!open) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={open}
      animationType="none"
      onRequestClose={() => handleClose()}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdropAnimated, { opacity: fadeAnim }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityLabel="Fechar menu ao tocar fora"
            accessibilityRole="button"
            onPress={() => handleClose()}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.panel,
            {
              width: panelWidth,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <SafeAreaView
            style={styles.safeArea}
            edges={['top', 'bottom']}
            accessibilityViewIsModal
          >
            <View style={styles.headerBar}>
              <View style={styles.brandRow}>
                <View style={styles.brandIconWrapper}>
                  <Ionicons
                    name="shield-checkmark"
                    size={18}
                    color={colors.white}
                  />
                </View>
                <View>
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
                onPress={() => handleClose()}
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
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.ink}
                  />
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
                        key={item.label}
                        activeOpacity={0.7}
                        onPress={() => handleNavigate(item.path)}
                        accessibilityRole="button"
                        accessibilityLabel={item.label}
                        style={[
                          styles.menuRow,
                          idx === section.items.length - 1 &&
                            styles.menuRowLast,
                        ]}
                      >
                        <View style={styles.iconWrapper}>
                          <Ionicons
                            name={item.icon}
                            size={20}
                            color={colors.ink}
                          />
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
                  activeOpacity={0.8}
                  onPress={handleLogout}
                  accessibilityRole="button"
                  accessibilityLabel="Sair da conta"
                  style={styles.darkLogoutPill}
                >
                  <Ionicons
                    name="log-out-outline"
                    size={18}
                    color={colors.white}
                  />
                  <AppText variant="label" style={styles.logoutPillText}>
                    Sair da conta
                  </AppText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, position: 'relative' },
  backdropAnimated: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
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
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
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
  logoutPillText: { ...typography.label, color: colors.white },
});
