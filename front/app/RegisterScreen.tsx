import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { AuthScreenLayout } from '@/components/ui/AuthScreenLayout';
import { AppErrorMessage } from '@/components/ui/AppErrorMessage';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { useAuthStore } from '@/stores/authStore';
import { registrationError } from '@/shared/registration';
import { spacing } from '@/theme/spacing';
import { useShallow } from 'zustand/react/shallow';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { register, isLoading, error, clearError } = useAuthStore(useShallow((s) => ({ register: s.register, isLoading: s.isLoading, error: s.error, clearError: s.clearError })));
  useFocusEffect(
    useCallback(() => {
      clearError();
      setValidationError(null);
    }, [clearError]),
  );

  const submit = async () => {
    if (isLoading) return;
    clearError();
    const input = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    };
    const invalid =
      registrationError(input) ||
      (password !== confirmation ? 'As senhas não coincidem.' : null);
    setValidationError(invalid);
    if (invalid) return;
    const result = await register(input);
    if (result.success) router.replace('/MunicipalityScreen');
  };

  return (
    <AuthScreenLayout
      title="Criar conta"
      description="Crie sua conta para salvar chamados e consultar dados oficiais da sua cidade."
    >
      <View style={styles.form}>
        <AppInput
          placeholder="Nome"
          value={name}
          onChangeText={setName}
          autoComplete="name"
          maxLength={100}
          editable={!isLoading}
        />
        <AppInput
          placeholder="E-mail"
          value={email}
          onChangeText={setEmail}
          autoComplete="email"
          keyboardType="email-address"
          autoCapitalize="none"
          maxLength={254}
          editable={!isLoading}
        />
        <AppInput
          placeholder="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          autoCapitalize="none"
          maxLength={128}
          helper="Use entre 8 e 128 caracteres."
          editable={!isLoading}
        />
        <AppInput
          placeholder="Confirmar senha"
          value={confirmation}
          onChangeText={setConfirmation}
          secureTextEntry
          autoComplete="new-password"
          autoCapitalize="none"
          maxLength={128}
          editable={!isLoading}
          onSubmitEditing={() => {
            void submit();
          }}
        />
        {(validationError || error) && (
          <AppErrorMessage
            title={
              validationError
                ? 'Confira os dados'
                : 'Não foi possível criar sua conta'
            }
            message={validationError || error!}
          />
        )}
        <AppButton
          title="Criar conta"
          loading={isLoading}
          disabled={!name.trim() || !email.trim() || !password || !confirmation}
          onPress={() => {
            void submit();
          }}
        />
        <AppButton
          title="Já tenho uma conta"
          variant="quiet"
          disabled={isLoading}
          onPress={() => {
            clearError();
            router.replace('/LoginScreen');
          }}
        />
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.xs },
});
