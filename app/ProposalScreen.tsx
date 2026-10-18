import React, { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/stores/authStore';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppInput } from '@/components/ui/AppInput';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { mutation } from '@/services/http';
import type { CivicItem } from '@/shared/contracts';
import { civicTerritory } from '@/shared/civic-territory';
import { spacing } from '@/theme/spacing';
export default function ProposalScreen() {
  const user = useAuthStore((state) => state.user);
  return <ProposalForm key={user?.id + ':' + user?.municipality?.id} />;
}
function ProposalForm() {
  const user = useAuthStore((state) => state.user);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [neighborhood, setNeighborhood] = useState(user?.neighborhood || '');
  const [scope, setScope] = useState<'municipality' | 'neighborhood'>(user?.neighborhood ? 'neighborhood' : 'municipality');
  const completed = useRef(false);
  const draftWrites = useRef(Promise.resolve());
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
            setScope(draft.scope === 'municipality' || draft.scope === 'neighborhood'
              ? draft.scope
              : civicTerritory({ neighborhood: draft.neighborhood }).scope === 'municipality' ? 'municipality' : 'neighborhood');
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
      draftWrites.current = draftWrites.current.then(async () => {
        if (!completed.current) await AsyncStorage.setItem(draftKey, JSON.stringify({ title, body, neighborhood, scope }));
      }).catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [title, body, neighborhood, scope, draftKey, ready]);
  const save = useMutation({
    mutationFn: () =>
      mutation<CivicItem>('/civic-items', 'POST', {
        kind: 'proposal',
        title,
        summary: body.slice(0, 180),
        body,
        neighborhood: scope === 'municipality' ? 'Todo o município' : neighborhood.trim(),
        territory: scope === 'municipality' ? { scope } : { scope, neighborhood: neighborhood.trim() },
      }),
    onSuccess: async (item) => {
      completed.current = true;
      await draftWrites.current;
      await AsyncStorage.removeItem(draftKey).catch(() => {});
      const current = useAuthStore.getState().user;
      if (current?.id !== user?.id || current?.municipality?.id !== user?.municipality?.id) return;
      router.replace({
        pathname: '/CivicDetailsScreen',
        params: { id: item.id },
      });
    },
  });
  return (
    <AppScreen keyboardAvoiding>
      <AppHeader title="Propor uma melhoria" onBack={() => router.back()} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingHorizontal: spacing.contentPadding, paddingVertical: spacing.md }}>
        <View style={{ gap: spacing.md }}>
          <AppText color="muted">
            Descreva uma melhoria e escolha a área que ela abrange.
          </AppText>
          <AppInput
            label="Título da proposta"
            value={title}
            onChangeText={setTitle}
            maxLength={120}
          />
          <AppText variant="label">Abrangência da proposta</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            <AppButton title="Todo o município" variant={scope === 'municipality' ? 'primary' : 'secondary'} accessibilityState={{ selected: scope === 'municipality' }} onPress={() => setScope('municipality')} />
            <AppButton title="Um bairro" variant={scope === 'neighborhood' ? 'primary' : 'secondary'} accessibilityState={{ selected: scope === 'neighborhood' }} onPress={() => setScope('neighborhood')} />
          </View>
          {scope === 'neighborhood' ? <AppInput
            label="Bairro"
            value={neighborhood}
            onChangeText={setNeighborhood}
            maxLength={100}
          /> : <AppText color="muted">A proposta será exibida nos recortes de todos os bairros do seu município.</AppText>}
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
              (scope === 'neighborhood' && !neighborhood.trim())
            }
            onPress={() => save.mutate()}
          />
        </View>
      </ScrollView>
    </AppScreen>
  );
}
