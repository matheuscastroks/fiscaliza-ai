import { useThemedStyles } from '@/theme/useTheme';
import { KeyboardAwareScrollView } from '@/components/ui/KeyboardAwareScrollView';
import { goBack } from '@/utils/navigation';
import { useSignOutSheet } from '@/components/ui/SignOutSheet';
import { createCityStyles } from '@/features/city/CityUI';
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { useAuthStore } from '@/stores/authStore';
import { formatPostalCode } from '@/services/postalCode';
import { usePostalCodeFlow } from '@/features/profile/usePostalCodeFlow';

/** First access and changes of residence share the same server-confirmed flow. */
export default function MunicipalityScreen() {
  const cityStyles = useThemedStyles(createCityStyles);

  const user = useAuthStore((state) => state.user);
  const flow = usePostalCodeFlow(user?.postalCode || '');
  const { postalCode, digits, lookup, busy, saving, error } = flow;
  const linked = user?.municipality;
  const confirm = async () => {
    if (await flow.confirm()) router.replace('/(tabs)');
  };
  return (
    <AppScreen keyboardAvoiding>
      <AppHeader
        title={linked ? 'Meu município' : 'Sua cidade'}
        onBack={linked ? () => goBack() : undefined}
      />
      <KeyboardAwareScrollView
        contentContainerStyle={cityStyles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: 20 }}>
          <View style={{ gap: 8 }}>
            <AppText variant="screenTitle">
              {linked ? 'Atualizar meu CEP' : 'Onde você mora?'}
            </AppText>
            <AppText color="muted">
              Informe seu CEP para encontrar seu município.
            </AppText>
          </View>
          {linked && (
            <AppText>
              Município atual: {linked.name} · {linked.state}
            </AppText>
          )}
          <AppInput
            placeholder="Digite seu CEP (00000-000)"
            value={postalCode}
            maxLength={9}
            keyboardType="number-pad"
            autoComplete="postal-code"
            editable={!busy && !saving}
            onChangeText={(value) => flow.reset(formatPostalCode(value))}
            onSubmitEditing={() => void flow.search()}
          />
          <AppButton
            title="Buscar município"
            loading={busy}
            disabled={digits.length !== 8 || saving}
            onPress={() => void flow.search()}
          />
          {lookup && (
            <View style={{ gap: 12 }}>
              <AppText variant="sectionTitle">
                {lookup.municipality.name} · {lookup.municipality.state}
              </AppText>
              {Boolean(lookup.neighborhood) && (
                <AppText>{lookup.neighborhood}</AppText>
              )}
              {Boolean(lookup.street) && (
                <AppText color="muted">{lookup.street}</AppText>
              )}
              <AppText color="muted">
                Seus registros serão limitados a este município.
              </AppText>
              {linked && linked.id !== lookup.municipality.id && (
                <AppText>
                  Seu histórico em {linked.name} será preservado.
                </AppText>
              )}
              <AppButton
                title="Confirmar município"
                loading={saving}
                disabled={busy}
                onPress={() => void confirm()}
              />
              <AppButton
                title="Corrigir CEP"
                variant="quiet"
                disabled={saving}
                onPress={() => flow.reset()}
              />
            </View>
          )}
          {error !== '' && (
            <AppText color="risk" accessibilityLiveRegion="polite">
              {error}
            </AppText>
          )}
          {!linked && (
            <AppButton
              title="Sair da conta"
              variant="quiet"
              disabled={busy || saving}
              onPress={() => useSignOutSheet.getState().setOpen(true)}
            />
          )}
        </View>
      </KeyboardAwareScrollView>
    </AppScreen>
  );
}
