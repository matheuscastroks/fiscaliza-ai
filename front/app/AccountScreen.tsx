import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { InsetGroup, ListRow } from '@/components/ui/ListRow';
import { useSignOutSheet } from '@/components/ui/SignOutSheet';
import { AppBottomSheetModal, BottomSheetView } from '@/components/ui/AppBottomSheetModal';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme/useTheme';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { goBack } from '@/utils/navigation';

/** Sair, apagar conta e entrar: decisões raras, fora do Perfil para ele ficar leve. */
export default function AccountScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, deleteAccount } = useAuthStore(
    useShallow((s) => ({ user: s.user, deleteAccount: s.deleteAccount })),
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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

  return (
    <AppScreen>
      <AppHeader title="Conta e privacidade" onBack={() => goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {user ? (
          <>
            <AppText variant="meta" color="muted">
              Conectado como {user.email}. Seus chamados salvos e lugares ficam neste aparelho.
            </AppText>
            <InsetGroup>
              <ListRow
                icon="log-out-outline"
                tone="neutral"
                title="Sair da conta"
                subtitle="Encerra a sessão neste aparelho"
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  useSignOutSheet.getState().setOpen(true);
                }}
              />
            </InsetGroup>
            <View style={styles.danger}>
              <AppText variant="meta" color="muted">
                Zona de risco
              </AppText>
              <InsetGroup>
                <ListRow
                  icon="trash-outline"
                  tone="risk"
                  title="Apagar minha conta"
                  subtitle="Remove permanentemente seus dados e preferências do servidor"
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setDeleteError('');
                    setConfirmDelete(true);
                  }}
                />
              </InsetGroup>
            </View>
          </>
        ) : (
          <>
            <AppText variant="meta" color="muted">
              Você está usando o app sem conta. Salvos e lugares ficam só neste aparelho.
            </AppText>
            <InsetGroup>
              <ListRow
                icon="person-add-outline"
                title="Entrar ou criar conta"
                subtitle="Guarde seus lugares e salvos na sua conta"
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
              Esta ação é irreversível. Seus dados de cadastro, preferências e acessos serão removidos dos nossos servidores.
            </AppText>
          </View>
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
