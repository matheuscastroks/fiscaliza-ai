import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { useAuthStore } from '@/stores/authStore';
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore();
  const submit = async () => {
    const result = await login(email.trim(), password);
    if (result.success)
      router.replace(
        useAuthStore.getState().user?.municipality
          ? '/(tabs)'
          : '/MunicipalityScreen',
      );
  };
  return (
    <AppScreen scroll keyboardAvoiding>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          gap: 20,
          paddingVertical: 32,
        }}
      >
        <AppText variant="sectionTitle" color="accent">
          Fiscaliza-AI
        </AppText>
        <View style={{ gap: 8 }}>
          <AppText variant="screenTitle">Acesse sua conta</AppText>
          <AppText color="muted">
            Acompanhe sua cidade. Contribua com as próximas decisões.
          </AppText>
        </View>
        <View>
          <AppInput
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <AppInput
            label="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            onSubmitEditing={() => {
              void submit();
            }}
            error={error}
          />
          <AppButton
            title="Entrar"
            loading={isLoading}
            disabled={!email.trim() || !password}
            onPress={() => {
              void submit();
            }}
          />
        </View>
        <AppButton
          title="Sobre o Fiscaliza-AI"
          variant="quiet"
          onPress={() => router.push('/AboutScreen')}
        />
      </View>
    </AppScreen>
  );
}
