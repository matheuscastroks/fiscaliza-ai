import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { goBack } from '@/utils/navigation';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
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
import { useCityQuery } from '@/features/city/useCityQuery';
import { QueryState, createCityStyles } from '@/features/city/CityUI';
import { layout, spacing } from '@/theme';
import type { Occurrence, CivicItem } from '@/shared/contracts';

function ProfileLink({
  title,
  icon,
  href,
  last = false,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
  last?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(href)}
      style={({ pressed }) => [
        styles.link,
        !last && styles.divider,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={22} color={colors.ink} />
      <AppText style={styles.flex}>{title}</AppText>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { colors } = useTheme();
  const cityStyles = useThemedStyles(createCityStyles);
  const styles = useThemedStyles(createStyles);

  const { user } = useAuthStore();
  const [picking, setPicking] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const activity = useCityQuery<{
    occurrences: Occurrence[];
    items: CivicItem[];
  }>('/activity');
  const selectPhoto = async () => {
    if (!user || picking) return;
    const userId = user.id;
    const version = useAuthStore.getState().sessionVersion;
    setPicking(true);
    setPhotoError('');
    try {
      if (
        Platform.OS !== 'web' &&
        !(await ImagePicker.requestMediaLibraryPermissionsAsync()).granted
      ) {
        setPhotoError('Permita o acesso à galeria para escolher sua foto.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: Platform.OS === 'web',
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      if (
        (asset.fileSize || 0) > 2 * 1024 * 1024 ||
        (asset.base64?.length || 0) > 2800000
      ) {
        setPhotoError('Escolha uma foto com até 2 MB.');
        return;
      }
      let uri: string;
      if (Platform.OS === 'web') {
        if (!asset.base64) throw new Error('Foto indisponível');
        uri =
          'data:' +
          (asset.mimeType || 'image/jpeg') +
          ';base64,' +
          asset.base64;
      } else {
        if (!FileSystem.documentDirectory)
          throw new Error('Armazenamento indisponível');
        const folder = FileSystem.documentDirectory + 'profile-photos/';
        await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
        uri = folder + Date.now() + '.jpg';
        await FileSystem.copyAsync({ from: asset.uri, to: uri });
      }
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
  const counts = activity.data
    ? [
        {
          value: activity.data.occurrences.filter(
            (item) => item.reportedBy === user?.id,
          ).length,
          label: 'Ocorrências',
          icon: 'location-outline' as const,
        },
        {
          value: activity.data.items.filter(
            (item) => item.createdBy === user?.id && item.kind === 'proposal',
          ).length,
          label: 'Propostas',
          icon: 'bulb-outline' as const,
        },
        {
          value: activity.data.items.filter(
            (item) =>
              item.kind === 'consultation' && item.myAnswer !== undefined,
          ).length,
          label: 'Consultas',
          icon: 'chatbubble-outline' as const,
        },
      ]
    : [];
  return (
    <AppScreen>
      <AppHeader title="Meu perfil" onBack={goBack} />
      <ScrollView
        contentContainerStyle={cityStyles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.identity}>
          <Pressable
            onPress={() => {
              void selectPhoto();
            }}
            disabled={picking}
            accessibilityRole="button"
            accessibilityLabel="Alterar foto de perfil"
            accessibilityState={{ busy: picking, disabled: picking }}
            style={styles.photoButton}
          >
            <UserAvatar size={80} />
            <View style={styles.camera}>
              <Ionicons
                name="camera-outline"
                size={20}
                color={colors.onAccent}
              />
            </View>
          </Pressable>
          <View style={styles.name}>
            <AppText variant="screenTitle">
              {user?.name || 'Meu perfil'}
            </AppText>
            <AppText color="muted" selectable>
              {user?.email}
            </AppText>
          </View>
        </View>
        {photoError !== '' && (
          <AppText color="risk" accessibilityRole="alert">
            {photoError}
          </AppText>
        )}
        <View style={styles.section}>
          <AppText variant="sectionTitle">Meu município</AppText>
          <View style={styles.municipality}>
            <View style={styles.municipalityHeading}>
              <View style={styles.locationIcon}>
                <Ionicons
                  name="location-outline"
                  size={24}
                  color={colors.ink}
                />
              </View>
              <View style={styles.flex}>
                <AppText variant="label">
                  {user?.municipality
                    ? user.municipality.name + ' · ' + user.municipality.state
                    : 'Município ainda não confirmado'}
                </AppText>
                {user?.neighborhood ? (
                  <AppText variant="meta" color="muted">
                    {user.neighborhood}
                  </AppText>
                ) : null}
                {user?.postalCode ? (
                  <AppText variant="meta" color="muted">
                    CEP {user.postalCode.replace(/^(\d{5})(\d{3})$/, '$1-$2')}
                  </AppText>
                ) : null}
              </View>
            </View>
            {user?.role === 'citizen' && (
              <AppButton
                title="Atualizar CEP e município"
                variant="secondary"
                onPress={() => router.push('/MunicipalityScreen')}
              />
            )}
          </View>
        </View>
        <View style={styles.section}>
          <AppText variant="sectionTitle">Minha participação</AppText>
          <QueryState
            loading={activity.isPending}
            error={activity.error}
            retry={activity.refetch}
          />
          {activity.data && (
            <View style={styles.stats}>
              {counts.map((item) => (
                <View key={item.label} style={styles.stat}>
                  <Ionicons name={item.icon} size={22} color={colors.muted} />
                  <AppText variant="screenTitle">{item.value}</AppText>
                  <AppText variant="meta" color="muted">
                    {item.label}
                  </AppText>
                </View>
              ))}
            </View>
          )}
          <AppButton
            title="Ver acompanhamentos"
            onPress={() => router.push('/(tabs)/FollowScreen')}
          />
        </View>
        <View style={styles.section}>
          <AppText variant="sectionTitle">Minha conta</AppText>
          <View style={styles.links}>
            <ProfileLink
              title="Histórico de atendimentos"
              icon="time-outline"
              href="/HistoryScreen"
            />
            <ProfileLink
              title="Preferências"
              icon="options-outline"
              href="/SettingsScreen"
            />
            <ProfileLink
              title="Ajuda"
              icon="help-circle-outline"
              href="/HelpScreen"
              last
            />
          </View>
        </View>
        <AppButton
          title="Sair da conta"
          variant="quiet"
          onPress={() => {
            useSignOutSheet.getState().setOpen(true);
          }}
        />
      </ScrollView>
    </AppScreen>
  );
}
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    identity: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    photoButton: { position: 'relative', padding: spacing.xxs },
    camera: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 36,
      height: 36,
      borderRadius: layout.radius.pill,
      backgroundColor: colors.ink,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: colors.canvas,
    },
    name: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xxs,
    },
    section: { gap: spacing.sm },
    municipality: {
      padding: spacing.lg,
      gap: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: layout.radius.card,
    },
    municipalityHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    locationIcon: {
      width: layout.touchTarget.minWidth,
      height: layout.touchTarget.minHeight,
      borderRadius: layout.radius.pill,
      backgroundColor: colors.canvas,
      alignItems: 'center',
      justifyContent: 'center',
    },
    flex: { flex: 1, gap: spacing.xxs },
    stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    stat: {
      flex: 1,
      minWidth: 90,
      padding: spacing.sm,
      gap: spacing.xs,
      backgroundColor: colors.surface,
      borderRadius: layout.radius.panel,
    },
    links: {
      backgroundColor: colors.surface,
      borderRadius: layout.radius.card,
      overflow: 'hidden',
    },
    link: {
      minHeight: 64,
      padding: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    divider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.divider,
    },
    pressed: { backgroundColor: colors.surfaceSubdued },
  });
