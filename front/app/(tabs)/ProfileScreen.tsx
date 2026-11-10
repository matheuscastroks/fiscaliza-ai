import { useTheme, useThemedStyles } from '@/theme/useTheme';
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
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
import { AppBottomSheetModal, BottomSheetView } from '@/components/ui/AppBottomSheetModal';
import { useAuthStore } from '@/stores/authStore';
import { useAvatarStore } from '@/stores/avatarStore';
import { useFollowStore } from '@/stores/followStore';
import { usePlacesStore } from '@/stores/placesStore';
import { OfficialCallRow } from '@/components/official/OfficialCallRow';
import { PostalCodeSheet } from '@/components/profile/PostalCodeSheet';
import { layout, spacing } from '@/theme';
import { IconTile } from '@/components/ui/IconTile';
import { useShallow } from 'zustand/react/shallow';
import { createStyles } from '@/features/profile/profileScreenStyles';

type MenuItem = {
  label: string;
  path: Href;
  icon: keyof typeof Ionicons.glyphMap;
};

const navigationSections: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: MenuItem[];
}[] = [
  {
    title: 'Configurações',
    icon: 'settings-outline',
    items: [
      {
        label: 'Meus lugares',
        path: '/PlacesScreen',
        icon: 'navigate-outline',
      },
      {
        label: 'Preferências do aplicativo',
        path: '/SettingsScreen',
        icon: 'options-outline',
      },
    ],
  },
  {
    title: 'INFORMAÇÕES E TRANSPARÊNCIA',
    icon: 'information-circle-outline',
    items: [
      {
        label: 'Como funciona o Fiscaliza aí',
        path: '/OnboardingScreen',
        icon: 'book-outline',
      },
      {
        label: 'Central de ajuda e dúvidas',
        path: '/HelpScreen',
        icon: 'help-circle-outline',
      },
      {
        label: 'Sobre e fontes oficiais (1746 / Data.Rio)',
        path: '/AboutScreen',
        icon: 'information-circle-outline',
      },
      {
        label: 'Estatísticas e dados da cidade',
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

  const { user, deleteAccount } = useAuthStore(useShallow((s) => ({ user: s.user, deleteAccount: s.deleteAccount })));
  const savedCalls = useFollowStore((s) => s.savedCalls);
  const places = usePlacesStore((s) => s.places);

  const [picking, setPicking] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [cepSheetOpen, setCepSheetOpen] = useState(false);

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
        hideUserAvatar
        rightElement={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Preferências do aplicativo"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/SettingsScreen');
            }}
            style={({ pressed }) => [
              styles.headerActionBtn,
              { backgroundColor: colors.surface, borderColor: colors.divider },
              pressed && { opacity: 0.75 },
            ]}
          >
            <Ionicons name="options-outline" size={layout.iconSize.md} color={colors.ink} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Identidade Cidadã (Apple Inset Card) */}
        <View
          style={[
            styles.heroCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Pressable
            onPress={() => {
              if (user) void selectPhoto();
              else router.push('/LoginScreen');
            }}
            disabled={picking}
            accessibilityRole="button"
            accessibilityLabel={
              user ? 'Alterar foto de perfil' : 'Entrar na minha conta'
            }
            accessibilityState={{ busy: picking, disabled: picking }}
            style={({ pressed }) => [
              styles.avatarContainer,
              pressed && { opacity: 0.8 },
            ]}
          >
            <UserAvatar size={74} />
            {user && (
              <View
                style={[
                  styles.cameraBadge,
                  { backgroundColor: colors.ink, borderColor: colors.surface },
                ]}
              >
                <Ionicons
                  name="camera"
                  size={layout.iconSize.sm}
                  color={colors.onAccentBrand}
                />
              </View>
            )}
          </Pressable>

          <View style={styles.heroDetails}>
            <AppText variant="screenTitle" numberOfLines={1} style={styles.heroName}>
              {user?.name || 'Acesso sem conta'}
            </AppText>
            <AppText variant="caption" color="muted" numberOfLines={1} selectable>
              {user?.email || 'Seus salvos e lugares ficam guardados neste aparelho.'}
            </AppText>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: user ? colors.primaryContainer : colors.canvas,
                  borderColor: user ? colors.primaryContainer : colors.border,
                },
              ]}
            >
              <Ionicons
                name={user ? 'shield-checkmark' : 'phone-portrait-outline'}
                size={layout.iconSize.sm}
                color={user ? colors.primary : colors.muted}
              />
              <AppText
                variant="meta"
                style={[
                  styles.statusPillText,
                  { color: user ? colors.primary : colors.muted },
                ]}
              >
                {user ? 'Cidadão Conectado' : 'Consulta Pública Local'}
              </AppText>
            </View>
          </View>
        </View>

        {!user && (
          <View style={styles.authPromptRow}>
            <View style={styles.flex}>
              <AppButton
                title="Entrar na conta"
                onPress={() => router.push('/LoginScreen')}
              />
            </View>
            <View style={styles.flex}>
              <AppButton
                title="Criar conta"
                variant="secondary"
                onPress={() => router.push('/RegisterScreen')}
              />
            </View>
          </View>
        )}

        {/* Alerta de erro de foto */}
        {photoError !== '' && (
          <View style={styles.errorAlert} accessibilityRole="alert">
            <Ionicons name="alert-circle" size={layout.iconSize.md} color={colors.risk} />
            <AppText variant="caption" color="risk" style={styles.flex}>
              {photoError}
            </AppText>
          </View>
        )}

        {/* Métricas Cívicas (KPIs Cívicos com Squircles e Haptics) */}
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
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.8 },
            ]}
          >
            <View style={styles.metricHeader}>
              <View
                style={[
                  styles.metricIconSquircle,
                  { backgroundColor: colors.primaryContainer },
                ]}
              >
                <Ionicons name="bookmark" size={layout.iconSize.sm} color={colors.primary} />
              </View>
              <Ionicons name="chevron-forward" size={layout.iconSize.sm} color={colors.subtle} />
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
            accessibilityLabel={`Meus lugares salvos: ${places.length}`}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/PlacesScreen');
            }}
            style={({ pressed }) => [
              styles.metricCard,
              { backgroundColor: colors.surface, borderColor: colors.divider },
              pressed && { opacity: 0.8 },
            ]}
          >
            <View style={styles.metricHeader}>
              <View
                style={[
                  styles.metricIconSquircle,
                  { backgroundColor: colors.primaryContainer },
                ]}
              >
                <Ionicons name="navigate" size={layout.iconSize.sm} color={colors.primary} />
              </View>
              <Ionicons name="chevron-forward" size={layout.iconSize.sm} color={colors.subtle} />
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

        {/* Seção: Domicílio Cívico (Cadastro único de CEP Carioca) */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="location-outline" size={layout.iconSize.sm} color={colors.muted} />
            <AppText variant="caption" style={styles.sectionHeaderText}>
              Domicílio
            </AppText>
          </View>

          <View
            style={[
              styles.insetTable,
              { backgroundColor: colors.surface, borderColor: colors.divider },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`CEP Residencial no Rio: ${
                formattedCep || 'Cadastrar CEP'
              }`}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCepSheetOpen(true);
              }}
              style={({ pressed }) => [
                styles.tableRow,
                pressed && { backgroundColor: colors.surfaceSubdued },
              ]}
            >
              <IconTile icon="location" />
              <View style={styles.tableRowContent}>
                <AppText variant="label">
                  {formattedCep ? `CEP ${formattedCep}` : 'Cadastrar meu CEP'}
                </AppText>
                <AppText variant="caption" color="muted">
                  {formattedCep
                    ? `${user?.neighborhood ? `${user.neighborhood} · ` : ''}Rio de Janeiro, RJ`
                    : 'Defina seu endereço residencial na cidade do Rio'}
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={layout.iconSize.sm} color={colors.subtle} />
            </Pressable>
          </View>
        </View>

        {/* Prévia de Chamados Salvos (se houver) */}
        {savedCalls.length > 0 && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="bookmark-outline" size={layout.iconSize.sm} color={colors.muted} />
              <AppText variant="caption" style={styles.sectionHeaderText}>
                Últimos chamados salvos
              </AppText>
            </View>
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
              variant="secondary"
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/FollowScreen');
              }}
            />
          </View>
        )}

        {/* Opções de Configuração e Informações (Apple Inset-Grouped Tables) */}
        {navigationSections.map((section) => (
          <View key={section.title} style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name={section.icon} size={layout.iconSize.sm} color={colors.muted} />
              <AppText variant="caption" style={styles.sectionHeaderText}>
                {section.title}
              </AppText>
            </View>

            <View
              style={[
                styles.insetTable,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {section.items.map((item, idx) => (
                <React.Fragment key={item.label}>
                  {idx > 0 && (
                    <View style={[styles.tableDivider, { backgroundColor: colors.divider }]} />
                  )}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(item.path);
                    }}
                    style={({ pressed }) => [
                      styles.tableRow,
                      pressed && { backgroundColor: colors.surfaceSubdued },
                    ]}
                  >
                    <IconTile icon={item.icon} />
                    <View style={styles.tableRowContent}>
                      <AppText variant="label">{item.label}</AppText>
                    </View>
                    <Ionicons name="chevron-forward" size={layout.iconSize.sm} color={colors.subtle} />
                  </Pressable>
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        {/* Seção: Privacidade e Conta (Apple Inset-Grouped Table) */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="shield-outline" size={layout.iconSize.sm} color={colors.muted} />
            <AppText variant="caption" style={styles.sectionHeaderText}>
              Privacidade e conta
            </AppText>
          </View>

          <View
            style={[
              styles.insetTable,
              { backgroundColor: colors.surface, borderColor: colors.divider },
            ]}
          >
            {user ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Sair da conta"
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    useSignOutSheet.getState().setOpen(true);
                  }}
                  style={({ pressed }) => [
                    styles.tableRow,
                    pressed && { backgroundColor: colors.surfaceSubdued },
                  ]}
                >
                  <IconTile icon="log-out-outline" tone="neutral" />
                  <View style={styles.tableRowContent}>
                    <AppText variant="label">Sair da conta</AppText>
                    <AppText variant="caption" color="muted">
                      Encerrar sessão ativa neste dispositivo
                    </AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={layout.iconSize.sm} color={colors.subtle} />
                </Pressable>

                <View style={[styles.tableDivider, { backgroundColor: colors.divider }]} />

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Apagar minha conta"
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setDeleteError('');
                    setConfirmDelete(true);
                  }}
                  style={({ pressed }) => [
                    styles.tableRow,
                    pressed && { backgroundColor: colors.riskSurface },
                  ]}
                >
                  <IconTile icon="trash-outline" tone="risk" />
                  <View style={styles.tableRowContent}>
                    <AppText variant="label" style={{ color: colors.risk }}>
                      Apagar minha conta
                    </AppText>
                    <AppText variant="caption" color="muted">
                      Remoção permanente de dados e preferências
                    </AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={layout.iconSize.sm} color={colors.risk} />
                </Pressable>
              </>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Entrar ou criar conta"
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/LoginScreen');
                }}
                style={({ pressed }) => [
                  styles.tableRow,
                  pressed && { backgroundColor: colors.surfaceSubdued },
                ]}
              >
                <IconTile icon="person-add-outline" />
                <View style={styles.tableRowContent}>
                  <AppText variant="label">Entrar ou criar conta</AppText>
                  <AppText variant="caption" color="muted">
                    Sincronize seus lugares e acompanhamentos oficiais
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={layout.iconSize.sm} color={colors.subtle} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Rodapé de Versão e Dados Abertos */}
        <AppText variant="meta" color="muted" style={styles.versionFooter}>
          Fiscaliza aí · Versão 1.0.0 · Dados Abertos PCRJ
        </AppText>
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
              <Ionicons name="alert-circle" size={layout.iconSize.sm} color={colors.risk} />
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

      {/* Modal Bottom Sheet de Gestão de CEP Residencial */}
      <PostalCodeSheet
        visible={cepSheetOpen}
        onClose={() => setCepSheetOpen(false)}
        currentPostalCode={user?.postalCode}
        currentNeighborhood={user?.neighborhood}
      />

    </AppScreen>
  );
}
