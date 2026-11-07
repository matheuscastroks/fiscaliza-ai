import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useSignOutSheet } from '@/components/ui/SignOutSheet';
import {
  AppBottomSheetModal,
  BottomSheetView,
} from '@/components/ui/AppBottomSheetModal';
import { useAuthStore } from '@/stores/authStore';
import { useAvatarStore } from '@/stores/avatarStore';
import { useFollowStore } from '@/stores/followStore';
import { usePlacesStore } from '@/stores/placesStore';
import { OfficialCallRow } from '@/components/official/OfficialCallRow';
import { layout, spacing } from '@/theme';

type MenuItem = {
  label: string;
  path: Href;
  icon: keyof typeof Ionicons.glyphMap;
};

const navigationSections: {
  title: string;
  items: MenuItem[];
}[] = [
  {
    title: 'Configurações',
    items: [
      {
        label: 'Meus lugares',
        path: '/PlacesScreen',
        icon: 'navigate-outline',
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
      {
        label: 'Ajuda',
        path: '/HelpScreen',
        icon: 'help-circle-outline',
      },
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

export default function ProfileScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();

  const { user, deleteAccount } = useAuthStore();
  const savedCalls = useFollowStore((s) => s.savedCalls);
  const places = usePlacesStore((s) => s.places);

  const [picking, setPicking] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const selectPhoto = async () => {
    if (!user || picking) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userId = user.id;
    const version = useAuthStore.getState().sessionVersion;
    setPicking(true);
    setPhotoError('');
    try {
      if (!(await ImagePicker.requestMediaLibraryPermissionsAsync()).granted) {
        setPhotoError('Permita o acesso à galeria para escolher sua foto de perfil.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      if ((asset.fileSize || 0) > 2 * 1024 * 1024) {
        setPhotoError('Escolha uma foto com tamanho de até 2 MB.');
        return;
      }
      if (!FileSystem.documentDirectory) {
        throw new Error('Armazenamento local indisponível');
      }
      const folder = FileSystem.documentDirectory + 'profile-photos/';
      await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
      const uri = folder + Date.now() + '.jpg';
      await FileSystem.copyAsync({ from: asset.uri, to: uri });
      const current = useAuthStore.getState();
      if (current.user?.id !== userId || current.sessionVersion !== version)
        return;
      await useAvatarStore.getState().save(userId, uri);
    } catch {
      setPhotoError('Não foi possível salvar a foto. Tente novamente.');
    } finally {
      setPicking(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await deleteAccount();
      if (!res.success) {
        setDeleteError(res.error || 'Não foi possível apagar a conta. Tente novamente.');
        setDeleting(false);
        return;
      }
      setConfirmDelete(false);
      router.replace('/LoginScreen');
    } catch {
      setDeleteError('Erro ao apagar conta. Tente novamente.');
      setDeleting(false);
    }
  };

  const formattedCep = user?.postalCode
    ? user.postalCode.replace(/^(\d{5})(\d{3})$/, '$1-$2')
    : null;

  return (
    <AppScreen>
      <AppHeader
        title="Meu perfil"
        context="Identidade cidadã e configurações"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Identidade Cidadã (Flat, suave e sem sombras) */}
        <View style={styles.heroCard}>
          <Pressable
            onPress={() => {
              void selectPhoto();
            }}
            disabled={picking}
            accessibilityRole="button"
            accessibilityLabel="Alterar foto de perfil"
            accessibilityState={{ busy: picking, disabled: picking }}
            style={({ pressed }) => [
              styles.avatarContainer,
              pressed && { opacity: 0.8 },
            ]}
          >
            <UserAvatar size={76} />
            <View style={styles.cameraBadge}>
              <Ionicons
                name="camera"
                size={14}
                color={colors.onAccentBrand}
              />
            </View>
          </Pressable>

          <View style={styles.heroDetails}>
            <AppText variant="screenTitle" numberOfLines={1} style={styles.heroName}>
              {user?.name || 'Cidadão'}
            </AppText>
            <AppText variant="body" color="muted" numberOfLines={1} selectable>
              {user?.email || 'Acesso local'}
            </AppText>
            <View style={styles.statusPill}>
              <Ionicons name="shield-checkmark" size={13} color={colors.onSurfaceBrand} />
              <AppText variant="meta" style={styles.statusPillText}>
                Cidadão Conectado
              </AppText>
            </View>
          </View>
        </View>

        {/* Alerta de erro de foto */}
        {photoError !== '' && (
          <View style={styles.errorAlert} accessibilityRole="alert">
            <Ionicons name="alert-circle" size={18} color={colors.risk} />
            <AppText variant="caption" color="risk" style={styles.flex}>
              {photoError}
            </AppText>
          </View>
        )}

        {/* Métricas Cívicas (Cards suaves sem sombras) */}
        <View style={styles.metricsRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Chamados salvos: ${savedCalls.length}`}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/FollowScreen');
            }}
            style={({ pressed }) => [
              styles.metricCard,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.metricHeader}>
              <Ionicons name="bookmark-outline" size={20} color={colors.onSurfaceBrand} />
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </View>
            <AppText variant="screenTitle" style={styles.metricValue}>
              {savedCalls.length}
            </AppText>
            <AppText variant="caption" style={styles.metricLabel}>
              Chamados salvos
            </AppText>
            <AppText variant="meta" color="muted">
              Central 1746
            </AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Locais salvos: ${places.length}`}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/PlacesScreen');
            }}
            style={({ pressed }) => [
              styles.metricCard,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.metricHeader}>
              <Ionicons name="navigate-outline" size={20} color={colors.onSurfaceBrand} />
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </View>
            <AppText variant="screenTitle" style={styles.metricValue}>
              {places.length}
            </AppText>
            <AppText variant="caption" style={styles.metricLabel}>
              Meus lugares
            </AppText>
            <AppText variant="meta" color="muted">
              Pontos e raios
            </AppText>
          </Pressable>
        </View>

        {/* Seção: Minha Região de Referência (Flat, sem sombras) */}
        <View style={styles.regionCard}>
          <View style={styles.regionHeader}>
            <Ionicons name="location-outline" size={22} color={colors.ink} />
            <View style={styles.flex}>
              <AppText variant="label">
                {user?.municipality
                  ? `${user.municipality.name} · ${user.municipality.state}`
                  : 'Rio de Janeiro · RJ'}
              </AppText>
              {user?.neighborhood ? (
                <AppText variant="meta" color="muted">
                  {user.neighborhood}
                </AppText>
              ) : null}
              {formattedCep ? (
                <AppText variant="meta" color="muted">
                  CEP {formattedCep}
                </AppText>
              ) : null}
            </View>
          </View>
          <AppButton
            title="Atualizar CEP e município"
            variant="secondary"
            onPress={() => router.push('/MunicipalityScreen')}
          />
        </View>

        {/* Prévia de Chamados Salvos (se houver) */}
        {savedCalls.length > 0 && (
          <View style={styles.savedCallsSection}>
            <AppText variant="sectionTitle">Chamados salvos neste aparelho</AppText>
            <View style={styles.callsList}>
              {savedCalls.slice(0, 2).map((call) => (
                <OfficialCallRow
                  key={call.id}
                  call={call}
                  onPress={() =>
                    router.push({
                      pathname: '/OfficialCallDetailsScreen',
                      params: { id: call.id },
                    })
                  }
                />
              ))}
            </View>
            <AppButton
              title={`Ver todos os ${savedCalls.length} acompanhamentos`}
              onPress={() => router.push('/(tabs)/FollowScreen')}
            />
          </View>
        )}

        {/* Opções de Configuração e Informações (Idêntico ao layout do SideMenu) */}
        {navigationSections.map((section) => (
          <View key={section.title} style={styles.menuSection}>
            <AppText
              variant="label"
              color="muted"
              accessibilityRole="header"
              style={styles.menuSectionTitle}
            >
              {section.title}
            </AppText>
            {section.items.map((item) => (
              <Pressable
                key={item.label}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(item.path);
                }}
                style={({ pressed }) => [
                  styles.destination,
                  pressed && styles.destinationPressed,
                ]}
              >
                <Ionicons name={item.icon} size={21} color={colors.ink} />
                <AppText style={styles.flex}>{item.label}</AppText>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        ))}

        {/* Ações de Conta: Sair e Apagar Conta */}
        <View style={styles.accountActionsContainer}>
          <AppButton
            title="Sair da conta"
            variant="quiet"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              useSignOutSheet.getState().setOpen(true);
            }}
          />

          <AppButton
            title="Apagar minha conta"
            variant="destructive"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setDeleteError('');
              setConfirmDelete(true);
            }}
          />

          <AppText variant="meta" color="muted" style={styles.versionFooter}>
            Fiscaliza aí · Versão 1.0.0 · Dados Abertos PCRJ
          </AppText>
        </View>
      </ScrollView>

      {/* Modal de Confirmação para Apagar Conta */}
      <AppBottomSheetModal
        visible={confirmDelete}
        onClose={() => {
          if (!deleting) setConfirmDelete(false);
        }}
        enableDynamicSizing
        enablePanDownToClose={!deleting}
        showHeader={false}
      >
        <BottomSheetView
          style={[
            styles.deleteModalContent,
            { paddingBottom: Math.max(insets.bottom + spacing.md, spacing.xxl) },
          ]}
        >
          <View style={{ gap: spacing.xs }}>
            <AppText variant="sectionTitle">Apagar conta permanentemente?</AppText>
            <AppText color="muted">
              Esta ação é irreversível. Todos os seus dados de cadastro, preferências e acessos serão removidos dos nossos servidores.
            </AppText>
          </View>

          {deleteError !== '' && (
            <View style={styles.errorAlert} accessibilityRole="alert">
              <Ionicons name="alert-circle" size={16} color={colors.risk} />
              <AppText variant="caption" color="risk" style={styles.flex}>
                {deleteError}
              </AppText>
            </View>
          )}

          <View style={styles.deleteModalActions}>
            <AppButton
              title="Sim, apagar minha conta"
              variant="destructive"
              loading={deleting}
              onPress={handleDeleteAccount}
            />
            <AppButton
              title="Cancelar"
              variant="secondary"
              disabled={deleting}
              onPress={() => setConfirmDelete(false)}
            />
          </View>
        </BottomSheetView>
      </AppBottomSheetModal>
    </AppScreen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scrollContent: {
      paddingHorizontal: spacing.contentPadding,
      paddingTop: spacing.xs,
      paddingBottom: 120,
      gap: spacing.lg,
    },
    heroCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: layout.radius.card,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.md,
    },
    avatarContainer: {
      position: 'relative',
    },
    cameraBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.ink,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.surface,
    },
    heroDetails: {
      flex: 1,
      gap: 3,
    },
    heroName: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.ink,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 4,
      paddingVertical: 2,
      paddingHorizontal: 8,
      borderRadius: layout.radius.pill,
      backgroundColor: colors.canvas,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 4,
    },
    statusPillText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.ink,
    },
    errorAlert: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: spacing.sm,
      borderRadius: layout.radius.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.risk,
    },
    metricsRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    metricCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: layout.radius.panel,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 2,
    },
    cardPressed: {
      opacity: 0.75,
    },
    metricHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    metricValue: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.ink,
    },
    metricLabel: {
      fontWeight: '700',
      color: colors.ink,
      fontSize: 13,
      marginTop: 2,
    },
    regionCard: {
      padding: spacing.lg,
      gap: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: layout.radius.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    regionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    savedCallsSection: {
      gap: spacing.sm,
    },
    callsList: {
      gap: spacing.xs,
    },
    menuSection: {
      gap: spacing.xxs,
    },
    menuSectionTitle: {
      paddingHorizontal: spacing.sm,
      marginBottom: spacing.xs,
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
    destinationPressed: {
      backgroundColor: colors.surfaceSubdued,
      opacity: 0.75,
    },
    flex: {
      flex: 1,
      minWidth: 0,
    },
    accountActionsContainer: {
      gap: spacing.sm,
      paddingTop: spacing.xs,
    },
    versionFooter: {
      textAlign: 'center',
      fontSize: 11,
      marginTop: spacing.xs,
    },
    deleteModalContent: {
      paddingHorizontal: spacing.contentPadding,
      paddingTop: spacing.md,
      gap: spacing.md,
    },
    deleteModalActions: {
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
  });
