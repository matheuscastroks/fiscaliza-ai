import { useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import { KeyboardAwareScrollView } from '@/components/ui/KeyboardAwareScrollView';
import { LocationStep } from '@/features/reports/LocationStep';
import { SlidingTabs } from '@/components/ui/SlidingTabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '@/theme';
import { goBack } from '@/utils/navigation';
import React, { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/stores/authStore';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppInput } from '@/components/ui/AppInput';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { mutation, uploadImage } from '@/services/http';
import { PhotoAttachments } from '@/components/ui/PhotoAttachments';
import type { CivicItem } from '@/shared/contracts';
import { civicTerritory } from '@/shared/civic-territory';
import { spacing } from '@/theme/spacing';
export default function ProposalScreen() {
  const user = useAuthStore((state) => state.user);
  return <ProposalForm key={user?.id + ':' + user?.municipality?.id} />;
}
function ProposalForm() {
  const styles = useThemedStyles(createStyles);

  const { camera } = useLocalSearchParams<{ camera?: string }>();
  const user = useAuthStore((state) => state.user);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [preparingPhotos, setPreparingPhotos] = useState(false);
  const uploadedImages = useRef(new Map<string, string>());
  const [neighborhood, setNeighborhood] = useState(user?.neighborhood || '');
  const [scope, setScope] = useState<
    'municipality' | 'neighborhood' | 'location'
  >(user?.neighborhood ? 'neighborhood' : 'municipality');
  const insets = useSafeAreaInsets();
  const [point, setPoint] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [address, setAddress] = useState('');
  const completed = useRef(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
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
            setImages(
              Array.isArray(draft.images)
                ? draft.images
                    .filter((uri: unknown) => typeof uri === 'string')
                    .slice(0, 3)
                : [],
            );
            setNeighborhood(draft.neighborhood);
            if (
              Number.isFinite(draft.point?.latitude) &&
              Number.isFinite(draft.point?.longitude)
            )
              setPoint(draft.point);
            if (typeof draft.address === 'string') setAddress(draft.address);
            setScope(
              draft.scope === 'municipality' ||
                draft.scope === 'neighborhood' ||
                draft.scope === 'location'
                ? draft.scope
                : civicTerritory({ neighborhood: draft.neighborhood }).scope ===
                    'municipality'
                  ? 'municipality'
                  : 'neighborhood',
            );
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
      draftWrites.current = draftWrites.current
        .then(async () => {
          if (!completed.current)
            await AsyncStorage.setItem(
              draftKey,
              JSON.stringify({
                title,
                body,
                neighborhood,
                scope,
                images,
                point,
                address,
              }),
            );
        })
        .catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [
    title,
    body,
    neighborhood,
    scope,
    images,
    point,
    address,
    draftKey,
    ready,
  ]);
  const save = useMutation({
    mutationFn: async () => {
      const assertSession = () => {
        if (!active.current)
          throw new Error('Envio interrompido ao sair da proposta.');
        const current = useAuthStore.getState().user;
        if (
          current?.id !== user?.id ||
          current?.municipality?.id !== user?.municipality?.id
        )
          throw new Error(
            'Sua sessão mudou. Reabra a proposta antes de enviar.',
          );
      };
      assertSession();
      const urls: string[] = [];
      for (const uri of images) {
        assertSession();
        const url = uploadedImages.current.get(uri) || (await uploadImage(uri));
        uploadedImages.current.set(uri, url);
        urls.push(url);
      }
      assertSession();
      return mutation<CivicItem>('/civic-items', 'POST', {
        kind: 'proposal',
        images: urls,
        title: title.trim(),
        summary: body.trim().slice(0, 180),
        body: body.trim(),
        neighborhood:
          scope === 'municipality' ? 'Todo o município' : neighborhood.trim(),
        territory:
          scope === 'municipality'
            ? { scope }
            : scope === 'location'
              ? {
                  scope,
                  neighborhood: neighborhood.trim(),
                  location: { ...point, address: address.trim() },
                }
              : { scope, neighborhood: neighborhood.trim() },
      });
    },
    onSuccess: async (item) => {
      completed.current = true;
      await draftWrites.current;
      await AsyncStorage.removeItem(draftKey).catch(() => {});
      const current = useAuthStore.getState().user;
      if (
        !active.current ||
        current?.id !== user?.id ||
        current?.municipality?.id !== user?.municipality?.id
      )
        return;
      router.replace({
        pathname: '/CivicDetailsScreen',
        params: { id: item.id },
      });
    },
  });
  const hint = !ready
    ? 'Carregando seu rascunho…'
    : title.trim().length < 5
      ? 'Dê um título à sua proposta (mínimo de 5 caracteres).'
      : body.trim().length < 10
        ? 'Descreva a melhoria com pelo menos 10 caracteres.'
        : scope !== 'municipality' && !neighborhood.trim()
          ? 'Informe o bairro da melhoria.'
          : scope === 'location' && (!point || !address.trim())
            ? 'Marque o ponto e informe o endereço.'
            : '';
  return (
    <AppScreen keyboardAvoiding style={{ maxWidth: 760 }}>
      <AppHeader title="Propor uma melhoria" onBack={goBack} />
      <KeyboardAwareScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <View style={styles.section}>
          <AppText variant="sectionTitle">Sua ideia para a cidade</AppText>
          <AppInput
            placeholder="Título da proposta (ex.: Mais sombra e bancos na praça)"
            value={title}
            onChangeText={setTitle}
            maxLength={120}
            editable={!save.isPending}
          />
          <AppInput
            placeholder="O que mudar e por quê? Conte como a melhoria ajudaria quem usa esse espaço."
            value={body}
            onChangeText={setBody}
            multiline
            style={{ minHeight: 140 }}
            maxLength={5000}
            editable={!save.isPending}
          />
          <PhotoAttachments
            images={images}
            cameraRequest={ready ? camera : undefined}
            onChange={setImages}
            disabled={save.isPending}
            onPreparingChange={setPreparingPhotos}
          />
        </View>
        <View
          style={styles.section}
          pointerEvents={save.isPending ? 'none' : 'auto'}
        >
          <AppText variant="sectionTitle">Onde faz diferença?</AppText>
          <SlidingTabs
            edgeToEdge={false}
            label="Abrangência da melhoria"
            options={[
              { value: 'municipality', label: 'Todo o município' },
              { value: 'neighborhood', label: 'Um bairro' },
              { value: 'location', label: 'Um local' },
            ]}
            value={scope}
            onChange={(value) => {
              if (!save.isPending) setScope(value as typeof scope);
            }}
          />
          {scope === 'neighborhood' && (
            <AppInput
              placeholder="Nome do bairro"
              value={neighborhood}
              onChangeText={setNeighborhood}
              maxLength={100}
              editable={!save.isPending}
            />
          )}
          {scope === 'municipality' && (
            <AppText variant="meta" color="muted">
              {user?.municipality?.name} · disponível em todos os bairros
            </AppText>
          )}
          {scope === 'location' && (
            <LocationStep
              heading="Marque o local da melhoria"
              address={address}
              neighborhood={neighborhood}
              onNeighborhoodChange={setNeighborhood}
              latitude={
                point?.latitude ?? user?.municipality?.center.latitude ?? 0
              }
              longitude={
                point?.longitude ?? user?.municipality?.center.longitude ?? 0
              }
              selected={Boolean(point)}
              onAddressChange={setAddress}
              onLocationChange={setPoint}
            />
          )}
        </View>
      </KeyboardAwareScrollView>
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, spacing.sm) },
        ]}
      >
        {save.error && (
          <AppText color="risk" accessibilityRole="alert">
            {save.error.message}
          </AppText>
        )}
        {hint !== '' && (
          <AppText variant="caption" color="muted">
            {hint}
          </AppText>
        )}
        <AppButton
          title="Enviar proposta"
          loading={save.isPending}
          disabled={Boolean(hint) || preparingPhotos}
          onPress={() => save.mutate()}
        />
      </View>
    </AppScreen>
  );
}
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    content: {
      padding: spacing.contentPadding,
      paddingBottom: spacing.xxl,
      gap: spacing.xxl,
    },
    section: { gap: spacing.md },
    footer: {
      gap: spacing.xs,
      paddingTop: spacing.sm,
      paddingHorizontal: spacing.contentPadding,
      backgroundColor: colors.canvas,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      borderTopLeftRadius: layout.radius.panel,
      borderTopRightRadius: layout.radius.panel,
    },
  });
