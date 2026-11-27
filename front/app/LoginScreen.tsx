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
    if (isLoading || !email.trim() || !password) return;
    const result = await login(email.trim(), password);
    if (result.success) openSession();
  };

  return (
    <AuthScreenLayout
      title="Acesse sua conta"
      description="Entre para guardar seus chamados e lugares."
      expandPhoto
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
          returnKeyType="go"
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
            title="Entrar"
            loading={isLoading}
            disabled={!email.trim() || !password}
            onPress={() => {
              void submit();
            }}
          />
          <AppButton
            title="Criar conta"
            variant="quiet"
            disabled={isLoading}
            onPress={() => {
              useAuthStore.getState().clearError();
              router.push('/RegisterScreen');
            }}
          />
          <AppButton
            title="Sobre o app"
            variant="quiet"
            onPress={() => router.push('/AboutScreen')}
          />
        </View>
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.sm },
  actions: { paddingTop: spacing.sm, gap: spacing.xxs },
});
