import { useCallback, useState } from 'react';


import { StyleSheet, View } from 'react-native';


import { router, useFocusEffect } from 'expo-router';


import { AuthScreenLayout } from '@/components/ui/AuthScreenLayout';


import { AppErrorMessage } from '@/components/ui/AppErrorMessage';


import { AppButton } from '@/components/ui/AppButton';


import { AppInput } from '@/components/ui/AppInput';


import { useAuthStore } from '@/stores/authStore';


import { spacing } from '@/theme/spacing';



import { useShallow } from 'zustand/react/shallow';



export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore(useShallow((s) => ({ login: s.login, isLoading: s.isLoading, error: s.error })));
  useFocusEffect(
    useCallback(() => {
      useAuthStore.getState().clearError();
    }, []),
  );
  const openSession = () =>
    router.replace(
      useAuthStore.getState().user?.municipality
        ? '/(tabs)'
        : '/MunicipalityScreen',
    );
  const submit = async () => {
    const result = await login(email.trim(), password);
    if (result.success) openSession();
  };

  return (
    <AuthScreenLayout
      title="Acesse sua conta"
      description="Entre para guardar seus chamados e lugares."
    >
      <View style={styles.form}>
        <AppInput
          placeholder="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!isLoading}
        />
        <AppInput
          placeholder="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          editable={!isLoading}
          onSubmitEditing={() => {
            void submit();
          }}
        />
        {error && (
          <AppErrorMessage title="Não conseguimos entrar" message={error} />
        )}
        <View style={styles.actions}>
          <AppButton
            title="Criar conta"
            variant="secondary"
            disabled={isLoading}
            style={styles.registerButton}
            onPress={() => {
              useAuthStore.getState().clearError();
              router.push('/RegisterScreen');
            }}
          />
          <AppButton
            title="Entrar"
            loading={isLoading}
            disabled={!email.trim() || !password}
            style={styles.loginButton}
            onPress={() => {
              void submit();
            }}
          />
        </View>
      </View>
      <AppButton
        title="Sobre o app"
        variant="quiet"
        onPress={() => router.push('/AboutScreen')}
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  accessOptions: { gap: spacing.xs },
  hint: { textAlign: 'center' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  line: { flex: 1, height: 1 },
  form: { gap: spacing.sm },
  actions: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.xs },
  registerButton: { flex: 1, minWidth: 112, paddingHorizontal: spacing.sm },
  loginButton: { flex: 1.5 },
});
