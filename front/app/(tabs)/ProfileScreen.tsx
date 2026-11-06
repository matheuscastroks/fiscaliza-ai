import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useSignOutSheet } from '@/components/ui/SignOutSheet';
import { useAuthStore } from '@/stores/authStore';
import { useAvatarStore } from '@/stores/avatarStore';
import { useFollowStore } from '@/stores/followStore';
import { usePlacesStore } from '@/stores/placesStore';
import { OfficialCallRow } from '@/components/official/OfficialCallRow';
import { layout, spacing } from '@/theme';

function ProfileLink({
  title,
  subtitle,
  icon,
  href,
  last = false,
}: {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
  last?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}${subtitle ? `, ${subtitle}` : ''}`}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(href);
      }}
      style={({ pressed }) => [
        styles.linkRow,
        !last && styles.linkDivider,
        pressed && styles.linkPressed,
      ]}
    >
      <View style={styles.linkIconBadge}>
        <Ionicons name={icon} size={20} color={colors.ink} />
      </View>
      <View style={styles.linkTextContainer}>
        <AppText variant="body" style={styles.linkTitle}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="muted" style={styles.linkSubtitle}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const { user } = useAuthStore();
  const savedCalls = useFollowStore((s) => s.savedCalls);
  const places = usePlacesStore((s) => s.places);

  const [picking, setPicking] = useState(false);
  const [photoError, setPhotoError] = useState('');

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
        {/* Cartão Hero: Identidade Cidadã */}
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
            <UserAvatar size={84} />
            <View style={styles.cameraBadge}>
              <Ionicons
                name="camera"
                size={16}
                color={colors.onAccent}
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
              <Ionicons name="shield-checkmark" size={13} color={colors.accent} />
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
            <AppText variant="caption" color="risk" style={{ flex: 1 }}>
              {photoError}
            </AppText>
          </View>
        )}

        {/* Métricas Cívicas: Chamados Salvos e Lugares de Interesse */}
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
            <View style={styles.metricCardHeader}>
              <View style={[styles.metricIconCircle, { backgroundColor: colors.accent }]}>
                <Ionicons name="bookmark" size={16} color={colors.onAccent} />
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.muted} />
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
            <View style={styles.metricCardHeader}>
              <View style={[styles.metricIconCircle, { backgroundColor: '#2563EB' }]}>
                <Ionicons name="navigate" size={16} color="#FFFFFF" />
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.muted} />
            </View>
            <AppText variant="screenTitle" style={styles.metricValue}>
              {places.length}
            </AppText>
            <AppText variant="caption" style={styles.metricLabel}>
              Meus lugares
            </AppText>
            <AppText variant="meta" color="muted">
              Pontos de busca
            </AppText>
          </Pressable>
        </View>

        {/* Seção: Minha Região de Referência */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={16} color={colors.accent} />
            <AppText variant="label" style={styles.sectionHeading}>
              Minha Região de Referência
            </AppText>
          </View>

          <View style={styles.regionCard}>
            <View style={styles.regionCardTop}>
              <View style={styles.regionMainInfo}>
                <AppText variant="body" style={styles.regionCityTitle}>
                  {user?.municipality
                    ? `${user.municipality.name} · ${user.municipality.state}`
                    : 'Rio de Janeiro · RJ'}
                </AppText>
                <View style={styles.regionTagsRow}>
                  {user?.neighborhood ? (
                    <View style={styles.regionTag}>
                      <Ionicons name="home-outline" size={12} color={colors.ink} />
                      <AppText variant="caption" style={styles.regionTagText}>
                        {user.neighborhood}
                      </AppText>
                    </View>
                  ) : (
                    <View style={styles.regionTag}>
                      <Ionicons name="globe-outline" size={12} color={colors.muted} />
                      <AppText variant="caption" color="muted" style={styles.regionTagText}>
                        Todo o município
                      </AppText>
                    </View>
                  )}

                  {formattedCep ? (
                    <View style={styles.regionTag}>
                      <Ionicons name="mail-outline" size={12} color={colors.muted} />
                      <AppText variant="caption" color="muted" style={styles.regionTagText}>
                        CEP {formattedCep}
                      </AppText>
                    </View>
                  ) : null}
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Alterar região de referência"
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/MunicipalityScreen');
                }}
                style={({ pressed }) => [
                  styles.regionEditButton,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Ionicons name="pencil" size={13} color={colors.ink} />
                <AppText variant="caption" style={styles.regionEditText}>
                  Alterar
                </AppText>
              </Pressable>
            </View>

            <AppText variant="meta" color="muted" style={styles.regionHelperText}>
              Usamos sua região para priorizar demandas urbanas e equipamentos públicos próximos no mapa e na lista.
            </AppText>
          </View>
        </View>

        {/* Prévia de Chamados Salvos (se houver) */}
        {savedCalls.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={16} color={colors.accent} />
              <AppText variant="label" style={styles.sectionHeading}>
                Acompanhamentos Recentes
              </AppText>
              <View style={styles.headerCountBadge}>
                <AppText variant="meta" style={styles.headerCountText}>
                  {savedCalls.length}
                </AppText>
              </View>
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
              onPress={() => router.push('/(tabs)/FollowScreen')}
            />
          </View>
        )}

        {/* Seção: Configurações e Suporte */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings-outline" size={16} color={colors.accent} />
            <AppText variant="label" style={styles.sectionHeading}>
              Configurações e Suporte
            </AppText>
          </View>

          <View style={styles.menuGroupCard}>
            <ProfileLink
              title="Meus locais de interesse"
              subtitle="Cadastre casa, trabalho e raios de monitoramento"
              icon="navigate-outline"
              href="/PlacesScreen"
            />
            <ProfileLink
              title="Aparência e preferências"
              subtitle="Tema claro, escuro ou automático do sistema"
              icon="color-palette-outline"
              href="/SettingsScreen"
            />
            <ProfileLink
              title="Central de ajuda"
              subtitle="Dúvidas frequentes e orientações de uso cívico"
              icon="help-circle-outline"
              href="/HelpScreen"
            />
            <ProfileLink
              title="Sobre o Fiscaliza.ai"
              subtitle="Transparência, dados públicos PCRJ e versão"
              icon="information-circle-outline"
              href="/AboutScreen"
              last
            />
          </View>
        </View>

        {/* Botão de Encerrar Sessão */}
        <View style={styles.signOutContainer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Encerrar sessão neste aparelho"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              useSignOutSheet.getState().setOpen(true);
            }}
            style={({ pressed }) => [
              styles.signOutButton,
              pressed && styles.signOutButtonPressed,
            ]}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.risk} />
            <AppText variant="caption" style={styles.signOutButtonText}>
              Encerrar sessão neste aparelho
            </AppText>
          </Pressable>

          <AppText variant="meta" color="muted" style={styles.versionFooter}>
            Fiscaliza.ai · Versão 1.0.0 · Dados Abertos PCRJ
          </AppText>
        </View>
      </ScrollView>
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
      ...Platform.select({
        ios: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        android: { elevation: 2 },
      }),
    },
    avatarContainer: {
      position: 'relative',
    },
    cameraBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.ink,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2.5,
      borderColor: colors.surface,
    },
    heroDetails: {
      flex: 1,
      gap: 3,
    },
    heroName: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.ink,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 4,
      paddingVertical: 3,
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
      ...Platform.select({
        ios: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        android: { elevation: 2 },
      }),
    },
    cardPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    metricCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    metricIconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    metricValue: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.ink,
    },
    metricLabel: {
      fontWeight: '700',
      color: colors.ink,
      fontSize: 13,
      marginTop: 2,
    },
    sectionContainer: {
      gap: spacing.xs,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.xxs,
      marginBottom: 2,
    },
    sectionHeading: {
      fontWeight: '800',
      fontSize: 13,
      color: colors.ink,
      letterSpacing: 0.2,
    },
    headerCountBadge: {
      paddingVertical: 1,
      paddingHorizontal: 6,
      borderRadius: layout.radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginLeft: 'auto',
    },
    headerCountText: {
      fontWeight: '700',
      fontSize: 11,
      color: colors.muted,
    },
    regionCard: {
      backgroundColor: colors.surface,
      borderRadius: layout.radius.card,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
    },
    regionCardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 8,
    },
    regionMainInfo: {
      flex: 1,
      gap: 6,
    },
    regionCityTitle: {
      fontWeight: '800',
      fontSize: 16,
      color: colors.ink,
    },
    regionTagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    regionTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: layout.radius.pill,
      backgroundColor: colors.canvas,
      borderWidth: 1,
      borderColor: colors.border,
    },
    regionTagText: {
      fontSize: 11,
      fontWeight: '600',
    },
    regionEditButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: layout.radius.pill,
      backgroundColor: colors.canvas,
      borderWidth: 1,
      borderColor: colors.border,
    },
    regionEditText: {
      fontWeight: '700',
      fontSize: 12,
      color: colors.ink,
    },
    regionHelperText: {
      fontSize: 11,
      lineHeight: 16,
    },
    callsList: {
      gap: spacing.xs,
    },
    menuGroupCard: {
      backgroundColor: colors.surface,
      borderRadius: layout.radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
    },
    linkDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    linkPressed: {
      backgroundColor: colors.surfaceSubdued,
    },
    linkIconBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.canvas,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    linkTextContainer: {
      flex: 1,
      gap: 2,
    },
    linkTitle: {
      fontWeight: '700',
      fontSize: 14,
      color: colors.ink,
    },
    linkSubtitle: {
      fontSize: 12,
    },
    signOutContainer: {
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    signOutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      width: '100%',
      paddingVertical: 14,
      borderRadius: layout.radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    signOutButtonPressed: {
      backgroundColor: colors.surfaceSubdued,
      opacity: 0.8,
    },
    signOutButtonText: {
      fontWeight: '700',
      fontSize: 14,
      color: colors.risk,
    },
    versionFooter: {
      fontSize: 11,
      marginTop: 4,
    },
  });
