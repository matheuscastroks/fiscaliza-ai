import { goBack } from '@/utils/navigation';
import { cityStyles } from '@/features/city/CityUI';
import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';

import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { mutation } from '@/services/http';
import { useAuthStore } from '@/stores/authStore';
export default function PresentationScreen() {
  const user = useAuthStore((s) => s.user);
  const [scenario, setScenario] = useState('registered');
  const [confirm, setConfirm] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const reset = async () => {
    setBusy(true);
    try {
      await mutation('/presentation/reset', 'POST', { scenario });
      setMessage('Cenário restaurado. Atualize as telas dos clientes.');
      setConfirm(false);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Falha ao restaurar.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <AppScreen>
      <AppHeader
        title="Controles de apresentação"
        onBack={() => goBack()}
      />
      <ScrollView
        contentContainerStyle={cityStyles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: 16 }}>
          {user?.role !== 'admin' ? (
            <AppText>Acesso restrito ao administrador.</AppText>
          ) : (
            <>
              <AppText>
                Restaurar substitui as contribuições e anexos da sessão no
                servidor. Essa ação afeta o aplicativo e o painel municipal.
              </AppText>
              {(
                [
                  ['registered', 'Recebimento'],
                  ['in_progress', 'Em atendimento'],
                  ['resolved', 'Concluído'],
                ] as const
              ).map(([value, label]) => (
                <AppButton
                  key={value}
                  title={label}
                  variant={scenario === value ? 'primary' : 'secondary'}
                  onPress={() => {
                    setScenario(value);
                    setConfirm(false);
                  }}
                />
              ))}
              {!confirm ? (
                <AppButton
                  title="Restaurar cenário"
                  variant="destructive"
                  onPress={() => setConfirm(true)}
                />
              ) : (
                <>
                  <AppText color="risk">
                    Confirme a substituição dos dados desta apresentação.
                  </AppText>
                  <AppButton
                    title="Confirmar restauração"
                    variant="destructive"
                    loading={busy}
                    onPress={() => {
                      void reset();
                    }}
                  />
                  <AppButton
                    title="Cancelar"
                    variant="quiet"
                    onPress={() => setConfirm(false)}
                  />
                </>
              )}
            </>
          )}
          {message !== '' && (
            <AppText accessibilityLiveRegion="polite">{message}</AppText>
          )}
        </View>
      </ScrollView>
    </AppScreen>
  );
}
