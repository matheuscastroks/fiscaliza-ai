import { cityStyles } from '@/features/city/CityUI';
import React, { useRef, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { useAuthStore } from '@/stores/authStore';
import { request } from '@/services/http';
import type { PostalCodeLookup, SessionUser } from '@/shared/contracts';

/** First access and changes of residence share the same server-confirmed flow. */
export default function MunicipalityScreen() {
  const user = useAuthStore((state) => state.user);
  const acceptProfile = useAuthStore((state) => state.acceptProfile);
  const logout = useAuthStore((state) => state.logout);
  const [postalCode, setPostalCode] = useState(user?.postalCode || '');
  const [lookup, setLookup] = useState<PostalCodeLookup | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const requestVersion = useRef(0);
  const digits = postalCode.replace(/\D/g, '');
  const linked = user?.municipality;
  const editing = user?.role === 'citizen';
  const search = async () => {
    const version = ++requestVersion.current;
    setBusy(true);
    setError('');
    setLookup(null);
    try {
      const result = await request<PostalCodeLookup>(
        '/profile/postal-code/' + digits,
      );
      if (version === requestVersion.current) setLookup(result);
    } catch (caught) {
      if (version === requestVersion.current)
        setError(
          caught instanceof Error
            ? caught.message
            : 'Não foi possível consultar o CEP. Tente novamente.',
        );
    } finally {
      if (version === requestVersion.current) setBusy(false);
    }
  };
  const confirm = async () => {
    if (!lookup || saving) return;
    setSaving(true);
    setError('');
    const sessionVersion = useAuthStore.getState().sessionVersion;
    try {
      const profile = await request<SessionUser>(
        '/profile/municipality',
        'PUT',
        {
          postalCode: lookup.postalCode,
          municipalityId: lookup.municipality.id,
        },
      );
      if (await acceptProfile(profile, sessionVersion))
        router.replace('/(tabs)');
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Não foi possível confirmar. Seu município não foi alterado.',
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <AppScreen keyboardAvoiding>
      <AppHeader
        title={linked ? 'Meu município' : 'Sua cidade'}
        onBack={linked ? () => router.back() : undefined}
      />
      <ScrollView
        contentContainerStyle={cityStyles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: 20 }}>
          {!editing ? (
            <>
              <AppText variant="sectionTitle">Município da equipe</AppText>
              <AppText>
                {linked
                  ? `${linked.name} · ${linked.state}`
                  : 'Sua conta ainda não tem vínculo municipal. Solicite a configuração ao administrador.'}
              </AppText>
              <AppText color="muted">
                O acesso da gestão é definido pela conta autorizada.
              </AppText>
            </>
          ) : (
            <>
              <View style={{ gap: 8 }}>
                <AppText variant="screenTitle">
                  {linked ? 'Atualizar meu CEP' : 'Onde você mora?'}
                </AppText>
                <AppText color="muted">
                  Informe seu CEP para encontrar o município onde você vai
                  participar.
                </AppText>
              </View>
              {linked && (
                <AppText>
                  Município atual: {linked.name} · {linked.state}
                </AppText>
              )}
              <AppInput
                label="CEP"
                placeholder="00000-000"
                value={postalCode}
                maxLength={9}
                keyboardType="number-pad"
                autoComplete="postal-code"
                editable={!busy && !saving}
                onChangeText={(value) => {
                  const normalized = value.replace(/\D/g, '').slice(0, 8);
                  setPostalCode(
                    normalized.length > 5
                      ? normalized.slice(0, 5) + '-' + normalized.slice(5)
                      : normalized,
                  );
                  requestVersion.current++;
                  setLookup(null);
                  setError('');
                }}
                onSubmitEditing={() => {
                  if (digits.length === 8 && !busy && !saving) void search();
                }}
              />
              <AppButton
                title="Buscar município"
                loading={busy}
                disabled={digits.length !== 8 || saving}
                onPress={() => void search()}
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
                    onPress={() => setLookup(null)}
                  />
                </View>
              )}
              {error !== '' && (
                <AppText color="risk" accessibilityLiveRegion="polite">
                  {error}
                </AppText>
              )}
            </>
          )}
          {!linked && (
            <AppButton
              title="Sair da conta"
              variant="quiet"
              disabled={busy || saving}
              onPress={() => void logout().catch(() => {})}
            />
          )}
        </View>
      </ScrollView>
    </AppScreen>
  );
}
