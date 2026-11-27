import { useTheme, useThemedStyles } from '@/theme/useTheme';
import { KeyboardAwareScrollView } from '@/components/ui/KeyboardAwareScrollView';
import { goBack } from '@/utils/navigation';
import { useSignOutSheet } from '@/components/ui/SignOutSheet';
import { createCityStyles } from '@/features/city/CityUI';
import React from 'react';
import { Keyboard, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { useAuthStore } from '@/stores/authStore';
import { formatPostalCode } from '@/services/postalCode';
import { usePostalCodeFlow } from '@/features/profile/usePostalCodeFlow';
import { spacing } from '@/theme/spacing';

/** First access and changes of residence share the same server-confirmed flow. */
export default function MunicipalityScreen() {
  const cityStyles = useThemedStyles(createCityStyles);
  const { colors } = useTheme();

  const user = useAuthStore((state) => state.user);
  const flow = usePostalCodeFlow(user?.postalCode || '');
  const { postalCode, digits, lookup, busy, saving, error } = flow;
  const linked = user?.municipality;
  const search = () => {
    if (digits.length !== 8 || busy || saving) return;
    Keyboard.dismiss();
    void flow.search();
  };
  const confirm = async () => {
    if (await flow.confirm()) router.replace('/(tabs)');
  };
  return (
    <AppScreen edges={['top', 'left', 'right', 'bottom']}>
      <AppHeader
        title={linked ? 'Minha cidade' : 'Sua cidade'}
        onBack={linked ? () => goBack() : undefined}
      />
      <KeyboardAwareScrollView
        contentContainerStyle={[cityStyles.content, { paddingBottom: spacing.md }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: spacing.lg }}>
          <View style={{ gap: spacing.xs }}>
            <AppText variant="screenTitle" accessibilityRole="header">
              {linked ? 'Atualizar meu CEP' : 'Onde você mora?'}
            </AppText>
            <AppText color="muted">
              Digite seu CEP para encontrarmos sua cidade.
            </AppText>
          </View>
          {linked && (
            <AppText>
              Sua cidade: {linked.name} · {linked.state}
            </AppText>
          )}
          <AppInput
            label="CEP residencial"
            showLabel
            placeholder="00000-000"
            value={postalCode}
            maxLength={9}
            keyboardType="number-pad"
            autoComplete="postal-code"
            editable={!busy && !saving && !lookup}
            onChangeText={(value) => flow.reset(formatPostalCode(value))}
            onSubmitEditing={search}
          />
          {lookup && (
            <View style={{ gap: spacing.sm }}>
              <AppText variant="sectionTitle" accessibilityRole="header">
                {lookup.municipality.name} · {lookup.municipality.state}
              </AppText>
              {Boolean(lookup.neighborhood) && (
                <AppText>{lookup.neighborhood}</AppText>
              )}
              {Boolean(lookup.street) && (
                <AppText color="muted">{lookup.street}</AppText>
              )}
              <AppText color="muted">
                Você verá os chamados desta cidade.
              </AppText>
              {linked && linked.id !== lookup.municipality.id && (
                <AppText>
                  Seu histórico em {linked.name} será preservado.
                </AppText>
              )}
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
      <KeyboardStickyView
        style={{ backgroundColor: colors.canvas, paddingHorizontal: spacing.contentPadding, paddingVertical: spacing.sm }}
      >
        <AppButton
          title={lookup ? 'Confirmar cidade' : 'Buscar minha cidade'}
          loading={busy || saving}
          disabled={digits.length !== 8}
          onPress={lookup ? () => void confirm() : search}
        />
      </KeyboardStickyView>
    </AppScreen>
  );
}
