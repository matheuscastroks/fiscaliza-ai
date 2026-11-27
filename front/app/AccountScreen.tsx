import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { InsetGroup, ListRow } from '@/components/ui/ListRow';
import { useSignOutSheet } from '@/components/ui/SignOutSheet';
import { AppBottomSheetModal, BottomSheetTextInput, BottomSheetView } from '@/components/ui/AppBottomSheetModal';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme/useTheme';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { goBack } from '@/utils/navigation';

/** Sair, apagar conta e entrar: decisões raras, fora do Perfil para ele ficar leve. */
export default function AccountScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, deleteAccount, logoutAll } = useAuthStore(
    useShallow((s) => ({ user: s.user, deleteAccount: s.deleteAccount, logoutAll: s.logoutAll })),
  );
  const confirmLogoutAll = () => {
    Alert.alert(
      'Sair em todos os celulares?',
      'Seus salvos continuam na conta.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair em todos',
          style: 'destructive',
          onPress: () => {
            void logoutAll()
              .catch(() => undefined)
              .then(() => router.replace('/LoginScreen'));
          },
        },
      ],
    );
  };
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [password, setPassword] = useState('');

  const handleDeleteAccount = async () => {
    if (!password) {
      setDeleteError('Digite sua senha para confirmar.');
      return;
    }
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await deleteAccount(password);
      if (!res.success) {
        setDeleteError(res.error || 'Não conseguimos apagar a conta. Tente de novo.');
        setDeleting(false);
        return;
      }
      setConfirmDelete(false);
      router.replace('/LoginScreen');
    } catch {
      setDeleteError('Não conseguimos apagar a conta. Tente de novo.');
      setDeleting(false);
    }
  };

  return (
    <AppScreen>
      <AppHeader title="Conta e privacidade" onBack={() => goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {user ? (
          <>
            <AppText variant="meta" color="muted">
              Conectado como {user.email}. Lugares ficam só neste celular.
            </AppText>
            <InsetGroup>
              <ListRow
                icon="log-out-outline"
                tone="neutral"
                title="Sair da conta"
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  useSignOutSheet.getState().setOpen(true);
                }}
              />
              <ListRow
                icon="phone-portrait-outline"
                tone="neutral"
                title="Sair em todos os celulares"
                onPress={confirmLogoutAll}
              />
            </InsetGroup>
            <View style={styles.danger}>
              <AppText variant="meta" color="muted">
                Cuidado: não dá para desfazer
              </AppText>
              <InsetGroup>
                <ListRow
                  icon="trash-outline"
                  tone="risk"
                  title="Apagar minha conta"
                  subtitle="Apaga seus dados e preferências"
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setDeleteError('');
                    setPassword('');
                    setConfirmDelete(true);
                  }}
                />
              </InsetGroup>
            </View>
          </>
        ) : (
          <>
            <AppText variant="meta" color="muted">
              Sem conta, salvos e lugares ficam só neste celular.
            </AppText>
            <InsetGroup>
              <ListRow
                icon="person-add-outline"
                title="Entrar ou criar conta"
                subtitle="Seus salvos em qualquer aparelho"
                onPress={() => router.push('/LoginScreen')}
              />
            </InsetGroup>
          </>
        )}
      </ScrollView>

      <AppBottomSheetModal
        visible={confirmDelete}
        onClose={() => {
          if (!deleting) setConfirmDelete(false);
        }}
        enableDynamicSizing
        enablePanDownToClose={!deleting}
        showHeader={false}
        keyboardBlurBehavior="restore"
      >
        <BottomSheetView
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom + spacing.md, spacing.xxl) },
          ]}
        >
          <View style={{ gap: spacing.xs }}>
            <AppText variant="sectionTitle">Apagar conta permanentemente?</AppText>
            <AppText color="muted">
              Sua conta, seus salvos e suas preferências serão apagados, também deste celular. Não dá para desfazer.
            </AppText>
          </View>
          <AppInput
            inputComponent={BottomSheetTextInput}
            label="Sua senha"
            showLabel
            placeholder="Digite sua senha para confirmar"
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            value={password}
            onChangeText={setPassword}
            editable={!deleting}
            onSubmitEditing={handleDeleteAccount}
          />
          {deleteError !== '' && (
            <View style={styles.error} accessibilityRole="alert">
              <Ionicons name="alert-circle" size={layout.iconSize.sm} color={colors.risk} />
              <AppText variant="caption" color="risk" style={styles.grow}>
                {deleteError}
              </AppText>
            </View>
          )}
          <View style={{ gap: spacing.xs }}>
            <AppButton title="Sim, apagar minha conta" variant="destructive" loading={deleting} onPress={handleDeleteAccount} />
            <AppButton title="Cancelar" variant="secondary" disabled={deleting} onPress={() => setConfirmDelete(false)} />
          </View>
        </BottomSheetView>
      </AppBottomSheetModal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.contentPadding, paddingBottom: spacing.xxxl, gap: spacing.lg },
  danger: { gap: spacing.xs },
  sheet: { paddingHorizontal: spacing.contentPadding, paddingTop: spacing.md, gap: spacing.md },
  error: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  grow: { flex: 1 },
});
