import { useTheme, useThemedStyles } from '@/theme/useTheme';


import React, { useState } from 'react';


import { Pressable, ScrollView, View } from 'react-native';


import * as Haptics from 'expo-haptics';


import { Ionicons } from '@expo/vector-icons';


import { router } from 'expo-router';

import * as ImagePicker from 'expo-image-picker';


import { Directory, File, Paths } from 'expo-file-system';



import { AppScreen } from '@/components/ui/AppScreen';
import { useTabBarInset } from '@/hooks/useTabBarInset';


import { AppHeader } from '@/components/ui/AppHeader';


import { AppText } from '@/components/ui/AppText';


import { AppButton } from '@/components/ui/AppButton';


import { UserAvatar } from '@/components/ui/UserAvatar';


import { useAuthStore } from '@/stores/authStore';


import { useAvatarStore } from '@/stores/avatarStore';


import { useFollowStore } from '@/stores/followStore';


import { usePlacesStore } from '@/stores/placesStore';


import { PostalCodeSheet } from '@/components/profile/PostalCodeSheet';


import { layout } from '@/theme';

import { IconTile } from '@/components/ui/IconTile';


import { InsetGroup, ListRow } from '@/components/ui/ListRow';



import { createStyles } from '@/features/profile/profileScreenStyles';



export default function ProfileScreen() {
  const { contentInset } = useTabBarInset();
  const { colors, elevation } = useTheme();
  const styles = useThemedStyles(createStyles);

  const user = useAuthStore((s) => s.user);
  const savedCalls = useFollowStore((s) => s.savedCalls);
  const places = usePlacesStore((s) => s.places);

  const [picking, setPicking] = useState(false);
  const [photoError, setPhotoError] = useState('');

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
      const folder = new Directory(Paths.document, 'profile-photos');
      folder.create({ intermediates: true, idempotent: true });
      const localPhoto = new File(folder, Date.now() + '.jpg');
      new File(asset.uri).copy(localPhoto);
      const uri = localPhoto.uri;
      const current = useAuthStore.getState();
      if (current.user?.id !== userId || current.sessionVersion !== version)
        return;
      await useAvatarStore.getState().save(userId, uri);
    } catch {
      setPhotoError('Não conseguimos salvar a foto. Tente de novo.');
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
        context="Sua conta e preferências"
        hideUserAvatar
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: contentInset }]}
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
            <AppText variant="screenTitle" style={styles.heroName}>
              {user?.name || 'Acesso sem conta'}
            </AppText>
            <AppText variant="caption" color="muted" selectable>
              {user?.email || 'Seus salvos e lugares ficam guardados neste celular.'}
            </AppText>
            <View
              style={[
                styles.statusPill,
                elevation.subtle,
                {
                  backgroundColor: user ? colors.primaryContainer : colors.surfaceRaised,
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
                {user ? 'Conta ativa' : 'Sem conta'}
              </AppText>
            </View>
          </View>
        </View>

        {!user && (
          <View style={styles.authActions}>
            <AppButton
              title="Entrar na conta"
              onPress={() => router.push('/LoginScreen')}
            />
            <AppButton
              title="Criar conta"
              variant="secondary"
              onPress={() => router.push('/RegisterScreen')}
            />
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

        <InsetGroup>
          <ListRow
            title="Chamados salvos"
            subtitle={`${savedCalls.length} no acompanhamento`}
            onPress={() => router.navigate('/(tabs)/FollowScreen')}
          />
          <ListRow
            title="Meus lugares"
            subtitle={`${places.length} ${places.length === 1 ? 'lugar salvo' : 'lugares salvos'}`}
            onPress={() => router.push('/PlacesScreen')}
          />
        </InsetGroup>

        {/* Seção: Domicílio Cívico (Cadastro único de CEP Carioca) */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="location-outline" size={layout.iconSize.sm} color={colors.muted} />
            <AppText variant="caption" style={styles.sectionHeaderText}>
              Onde você mora
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
              accessibilityLabel={`Meu CEP: ${
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
                  {formattedCep ? `CEP ${formattedCep}` : 'Informar meu CEP'}
                </AppText>
                <AppText variant="caption" color="muted">
                  {formattedCep
                    ? `${user?.neighborhood ? `${user.neighborhood} · ` : ''}Rio de Janeiro, RJ`
                    : 'Guarde seu CEP no perfil'}
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={layout.iconSize.sm} color={colors.subtle} />
            </Pressable>
          </View>
        </View>

        {/* Prévia dos salvos fica na aba Salvos; aqui só o essencial e atalhos */}
        <View style={styles.sectionBlock}>
          <InsetGroup>
            <ListRow
              title="Preferências do aplicativo"
              subtitle="Bairro de referência e avisos"
              onPress={() => router.push('/SettingsScreen')}
            />
            <ListRow
              title="Dados do bairro"
              subtitle="Chamados e prazos"
              onPress={() => router.push('/ResultsScreen')}
            />
            <ListRow
              title="Ajuda"
              subtitle="Como usar o app"
              onPress={() => router.push('/HelpScreen')}
            />
            <ListRow
              title="Sobre o app"
              subtitle="De onde vêm as informações"
              onPress={() => router.push('/AboutScreen')}
            />
            <ListRow
              title="Conta e privacidade"
              subtitle={user ? 'Sair ou apagar minha conta' : 'Entrar ou criar conta'}
              onPress={() => router.push('/AccountScreen')}
            />
          </InsetGroup>
        </View>

        <AppText variant="meta" color="muted" style={styles.versionFooter}>
          Fiscaliza aí · versão 1.0.0
        </AppText>
      </ScrollView>

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
