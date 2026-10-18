import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/stores/authStore';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppInput } from '@/components/ui/AppInput';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { mutation } from '@/services/http';
import type { CivicItem } from '@/shared/contracts';
export default function ProposalScreen() {
  const user = useAuthStore((state) => state.user);
  return <ProposalForm key={user?.id + ':' + user?.municipality?.id} />;
}
function ProposalForm() {
  const user = useAuthStore((state) => state.user);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [neighborhood, setNeighborhood] = useState(user?.neighborhood || '');
  const draftKey =
    'fiscaliza:proposal-draft:' + user?.id + ':' + user?.municipality?.id;
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(draftKey)
      .then((raw) => {
        if (!active || !raw) return;
        try {
          const draft = JSON.parse(raw);
          if (
            typeof draft.title === 'string' &&
            typeof draft.body === 'string' &&
            typeof draft.neighborhood === 'string'
          ) {
            setTitle(draft.title);
            setBody(draft.body);
            setNeighborhood(draft.neighborhood);
          }
        } catch {
          /* ignore corrupt draft */
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [draftKey, user?.neighborhood]);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      void AsyncStorage.setItem(
        draftKey,
        JSON.stringify({ title, body, neighborhood }),
      ).catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [title, body, neighborhood, draftKey, ready]);
  const save = useMutation({
    mutationFn: () =>
      mutation<CivicItem>('/civic-items', 'POST', {
        kind: 'proposal',
        title,
        summary: body.slice(0, 180),
        body,
        neighborhood,
      }),
    onSuccess: async (item) => {
      await AsyncStorage.removeItem(draftKey).catch(() => {});
      router.replace({
        pathname: '/CivicDetailsScreen',
        params: { id: item.id },
      });
    },
  });
  return (
    <AppScreen>
      <AppHeader title="Propor uma melhoria" onBack={() => router.back()} />
      <AppScreen scroll keyboardAvoiding>
        <View style={{ gap: 16 }}>
          <AppText color="muted">
            Qual mudança você gostaria de ver no seu bairro?
          </AppText>
          <AppInput
            label="Título da proposta"
            value={title}
            onChangeText={setTitle}
            maxLength={120}
          />
          <AppInput
            label="Bairro"
            value={neighborhood}
            onChangeText={setNeighborhood}
            maxLength={100}
          />
          <AppInput
            label="O que mudar e por quê"
            value={body}
            onChangeText={setBody}
            multiline
            style={{ minHeight: 140 }}
            maxLength={5000}
          />
          {save.error && (
            <AppText color="risk" accessibilityLiveRegion="polite">
              {save.error.message}
            </AppText>
          )}
          <AppButton
            title="Enviar proposta"
            loading={save.isPending}
            disabled={
              !ready ||
              title.trim().length < 5 ||
              body.trim().length < 10 ||
              !neighborhood.trim()
            }
            onPress={() => save.mutate()}
          />
        </View>
      </AppScreen>
    </AppScreen>
  );
}
