import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, TextInput, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { BottomSheetTextInput } from '@/components/ui/AppBottomSheetModal';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/colors';
import type { ElevationTokens } from '@/theme/elevation';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { AppSelect } from '@/components/ui/AppSelect';
import { useDeviceLocation } from '@/features/places/useDeviceLocation';
import { spacing, layout } from '@/theme';
import { fontSizes } from '@/theme/typography';
import { useAuthStore } from '@/stores/authStore';
import { analyzeComplaintPhoto } from '@/services/complaintDraft';
import { sendComplaintToWhatsApp, shareComplaint } from '@/services/shareComplaint';
import { COMPLAINT_DESCRIPTION_MAX } from '@/shared/complaint-draft';
import { COMPLAINT_TOPICS, type ComplaintTopic } from './ComplaintTopicSheet';
import {
  COMPLAINT_STEPS,
  COMPLAINT_STEP_TITLES,
  formatComplaintMessage,
  type ComplaintStep,
} from './complaintMessage';

export { COMPLAINT_TOPICS, type ComplaintTopic };

export interface QuickComplaintKitProps {
  defaultLocation?: string;
  /** Dentro de um bottom sheet: usa o campo de texto do sheet (teclado não cobre o formulário). */
  inSheet?: boolean;
}

type Analysis = 'idle' | 'loading' | 'done' | 'not-urban' | 'failed';

const TOPIC_OPTIONS = COMPLAINT_TOPICS.map((topic) => ({
  value: topic.id,
  label: topic.label,
  icon: topic.icon,
}));

/** "Rua X, 123 - Bairro" a partir do geocodificador do aparelho. */
function formatPlace(
  place: Location.LocationGeocodedAddress | undefined,
  neighborhood: string | null,
) {
  const street = place?.street
    ? place.streetNumber
      ? `${place.street}, ${place.streetNumber}`
      : place.street
    : null;
  return [street, neighborhood ?? place?.district ?? null].filter(Boolean).join(' - ');
}

export function QuickComplaintKit({ defaultLocation = '', inSheet = false }: QuickComplaintKitProps) {
  const Input = inSheet ? BottomSheetTextInput : TextInput;
  const { colors, elevation } = useTheme();
  const styles = useThemedStyles(createStyles);
  // A folha mede a altura pelo conteúdo: o respiro final evita a barra do sistema.
  const { bottom: bottomInset } = useSafeAreaInsets();
  // Sugestão por foto exige conta com município (a API recusa sem isso).
  const canAnalyze = useAuthStore((state) => Boolean(state.user?.municipality));

  const [step, setStep] = useState<ComplaintStep>('photo');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis>('idle');
  const [suggested, setSuggested] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>('buraco');
  const [editedAddress, setAddress] = useState<string | null>(null);
  const address = editedAddress ?? defaultLocation;
  const [description, setDescription] = useState('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  // A análise de uma foto trocada no meio do caminho não sobrescreve a atual.
  const currentPhoto = useRef<string | null>(null);
  const descriptionRef = useRef('');
  useEffect(() => {
    descriptionRef.current = description;
  }, [description]);

  // Endereço: preenchido pela localização do aparelho até o morador editar.
  const addressTouched = useRef(false);
  const autoLocated = useRef(false);
  const { captureLocation, busy: locating, error: locationError } = useDeviceLocation();

  const fillAddressFromLocation = async (manual = false) => {
    if (manual) addressTouched.current = false;
    const point = await captureLocation(false);
    if (!point || addressTouched.current) return;
    let place: Location.LocationGeocodedAddress | undefined;
    try {
      [place] = await Location.reverseGeocodeAsync(point);
    } catch {
      // Sem geocodificador no aparelho: fica o bairro.
    }
    const text = formatPlace(place, point.neighborhood?.name ?? null);
    if (text && !addressTouched.current) setAddress(text);
  };

  useEffect(() => {
    if (step !== 'details' || autoLocated.current) return;
    autoLocated.current = true;
    void fillAddressFromLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const currentTopic = useMemo(
    () => COMPLAINT_TOPICS.find((t) => t.id === selectedTopic) || COMPLAINT_TOPICS[0],
    [selectedTopic],
  );

  const message = useMemo(
    () =>
      formatComplaintMessage({
        topicLabel: currentTopic.label,
        address,
        description,
        hasPhoto: Boolean(photoUri),
      }),
    [currentTopic.label, address, description, photoUri],
  );

  const stepIndex = COMPLAINT_STEPS.indexOf(step);

  const goTo = (next: ComplaintStep) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setErrorNotice(null);
    setStep(next);
  };

  const runAnalysis = async (uri: string) => {
    setAnalysis('loading');
    try {
      const draft = await analyzeComplaintPhoto(uri);
      if (currentPhoto.current !== uri) return;
      if (!draft.isUrbanIssue) {
        setAnalysis('not-urban');
        return;
      }
      setSelectedTopic(draft.topicId);
      // Não apaga o que o morador já escreveu enquanto a análise rodava.
      if (!descriptionRef.current.trim()) {
        setDescription(draft.description);
        setSuggested(true);
      }
      setAnalysis('done');
    } catch {
      if (currentPhoto.current === uri) setAnalysis('failed');
    }
  };

  const pickPhoto = async (source: 'camera' | 'library') => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setErrorNotice(null);
    try {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setErrorNotice(
          source === 'camera'
            ? 'Permita o uso da câmera para fotografar o problema.'
            : 'Permita o acesso à galeria para escolher a foto.',
        );
        return;
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6 };
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      if ((asset.fileSize || 0) > 5 * 1024 * 1024) {
        setErrorNotice('Escolha uma foto com até 5 MB.');
        return;
      }
      currentPhoto.current = asset.uri;
      setPhotoUri(asset.uri);
      setSuggested(false);
      setAnalysis('idle');
      setStep('details');
      if (canAnalyze) void runAnalysis(asset.uri);
    } catch {
      setErrorNotice('Não conseguimos abrir a câmera ou a galeria. Tente de novo.');
    }
  };

  const skipPhoto = () => {
    currentPhoto.current = null;
    setPhotoUri(null);
    setAnalysis('idle');
    goTo('details');
  };

  const handleSend = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSending(true);
    setErrorNotice(null);
    try {
      const outcome = await sendComplaintToWhatsApp(message, photoUri);
      if (outcome === 'failed')
        setErrorNotice('Não conseguimos abrir o WhatsApp. Compartilhe o pedido ou ligue para o 1746.');
    } finally {
      setSending(false);
    }
  };

  const analysisLine = (() => {
    if (!photoUri) return null;
    if (!canAnalyze) return null;
    switch (analysis) {
      case 'loading':
        return 'Analisando a foto…';
      case 'done':
        return suggested
          ? 'Texto sugerido pela foto. Confira antes de enviar.'
          : 'Assunto sugerido pela foto. Confira antes de enviar.';
      case 'not-urban':
        return 'A foto não parece mostrar um problema de rua. Descreva o que você viu.';
      case 'failed':
        return 'Não deu para analisar a foto. Descreva o problema.';
      default:
        return null;
    }
  })();

  return (
    <View
      style={[styles.container, inSheet && { paddingBottom: bottomInset + spacing.lg }]}
      accessibilityLabel="Pedido ao 1746"
    >
      <View style={styles.titleBlock}>
        <AppText variant="caption" color="muted">
          Passo {stepIndex + 1} de {COMPLAINT_STEPS.length}
        </AppText>
        <AppText variant="sectionTitle" style={styles.title} accessibilityRole="header">
          {COMPLAINT_STEP_TITLES[step]}
        </AppText>
        <View style={styles.progressTrack} accessibilityElementsHidden>
          {COMPLAINT_STEPS.map((item, index) => (
            <View
              key={item}
              style={[
                styles.progressSegment,
                { backgroundColor: index <= stepIndex ? colors.primary : colors.dividerSubtle },
              ]}
            />
          ))}
        </View>
      </View>

      {step === 'photo' && (
        <>
          {canAnalyze && (
            <AppText variant="caption" color="muted" style={styles.subtitle}>
              Com a foto, sugerimos o texto do pedido.
            </AppText>
          )}
          {photoUri && (
            <Image source={{ uri: photoUri }} style={styles.photoLarge} contentFit="cover" accessibilityLabel="Foto escolhida" />
          )}
          <View style={styles.actionsBlock}>
            <AppButton
              title="Tirar foto"
              onPress={() => void pickPhoto('camera')}
              icon={<Ionicons name="camera-outline" size={layout.iconSize.md} color={colors.onAccent} />}
            />
            <AppButton
              title="Escolher da galeria"
              variant="secondary"
              onPress={() => void pickPhoto('library')}
              icon={<Ionicons name="images-outline" size={layout.iconSize.md} color={colors.ink} />}
            />
            <AppButton title="Continuar sem foto" variant="quiet" onPress={skipPhoto} />
          </View>
        </>
      )}

      {step === 'details' && (
        <>
          {photoUri && (
            <View style={styles.photoRow}>
              <Image source={{ uri: photoUri }} style={styles.photoThumb} contentFit="cover" accessibilityLabel="Foto do problema" />
              <View style={styles.photoRowText}>
                {analysis === 'loading' && <ActivityIndicator size="small" color={colors.primary} />}
                {analysisLine && (
                  <AppText
                    variant="caption"
                    color={analysis === 'failed' ? 'risk' : 'muted'}
                    accessibilityLiveRegion="polite"
                  >
                    {analysisLine}
                  </AppText>
                )}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => goTo('photo')}
                  style={({ pressed }) => [styles.inlineAction, pressed && { opacity: 0.75 }]}
                >
                  <AppText variant="caption" style={styles.inlineActionText}>
                    Trocar foto
                  </AppText>
                </Pressable>
              </View>
            </View>
          )}

          <View style={styles.field}>
            <AppText variant="label" style={styles.fieldLabel}>
              O que precisa de reparo?
            </AppText>
            <AppSelect
              label="O que precisa de reparo?"
              options={TOPIC_OPTIONS}
              value={selectedTopic}
              onChange={(value) => value && setSelectedTopic(value)}
              clearable={false}
            />
          </View>

          <View style={styles.field}>
            <View style={styles.fieldLabelRow}>
              <AppText variant="label" style={styles.fieldLabel}>
                Onde é o problema?
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Usar minha localização no endereço"
                onPress={() => void fillAddressFromLocation(true)}
                disabled={locating}
                hitSlop={spacing.sm}
                style={({ pressed }) => [styles.inlineActionRow, pressed && { opacity: 0.75 }]}
              >
                {locating ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="locate-outline" size={layout.iconSize.sm} color={colors.primary} />
                )}
                <AppText variant="caption" style={styles.inlineActionText}>
                  Minha localização
                </AppText>
              </Pressable>
            </View>
            <AppInput
              label="Onde é o problema?"
              inputComponent={Input}
              placeholder="Rua, número aproximado ou esquina"
              value={address}
              onChangeText={(text) => {
                addressTouched.current = true;
                setAddress(text);
              }}
              multiline
              style={styles.addressInput}
              containerStyle={styles.inputContainer}
              helper={
                locating
                  ? 'Buscando seu endereço…'
                  : locationError ?? undefined
              }
            />
          </View>

          <View style={styles.field}>
            <AppText variant="label" style={styles.fieldLabel}>
              {suggested ? 'Detalhes sugeridos pela foto' : 'Detalhes'}
            </AppText>
            <AppInput
              label={suggested ? 'Detalhes sugeridos pela foto' : 'Detalhes'}
              inputComponent={Input}
              placeholder="Ex.: buraco grande perto da padaria"
              value={description}
              onChangeText={setDescription}
              maxLength={COMPLAINT_DESCRIPTION_MAX}
              multiline
              textAlignVertical="top"
              containerStyle={styles.inputContainer}
            />
          </View>

          <View style={styles.actionsBlock}>
            <AppButton title="Revisar mensagem" onPress={() => goTo('confirm')} />
            <AppButton title="Voltar" variant="quiet" onPress={() => goTo('photo')} />
          </View>
        </>
      )}

      {step === 'confirm' && (
        <>
          <View style={[styles.previewBox, elevation.recessed, { backgroundColor: colors.surfaceRecessed }]}>
            {photoUri && (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" accessibilityLabel="Foto do pedido" />
            )}
            <AppText variant="caption" color="ink" style={styles.previewText} selectable>
              {message}
            </AppText>
          </View>
          <AppText variant="caption" color="muted" style={styles.subtitle}>
            O Fiscaliza aí não registra nem acompanha este pedido.
          </AppText>

          {errorNotice && (
            <AppText variant="caption" color="risk" accessibilityRole="alert">
              {errorNotice}
            </AppText>
          )}

          <View style={styles.actionsBlock}>
            <AppButton title="Enviar pelo WhatsApp do 1746" loading={sending} onPress={() => void handleSend()} />
            <AppButton
              title="Compartilhar de outro jeito"
              variant="quiet"
              onPress={() => void shareComplaint(message, photoUri)}
            />
            <AppButton title="Voltar" variant="quiet" onPress={() => goTo('details')} />
          </View>
        </>
      )}

      {step !== 'confirm' && errorNotice && (
        <AppText variant="caption" color="risk" accessibilityRole="alert">
          {errorNotice}
        </AppText>
      )}

    </View>
  );
}

const createStyles = (colors: ThemeColors, elevation?: ElevationTokens) =>
  StyleSheet.create({
    container: {
      gap: spacing.md,
    },
    titleBlock: {
      gap: 3,
      paddingHorizontal: spacing.xs,
    },
    title: {
      fontSize: fontSizes.sectionTitle,
      lineHeight: 22,
      fontWeight: '600',
    },
    progressTrack: {
      flexDirection: 'row',
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    progressSegment: {
      flex: 1,
      height: 3,
      borderRadius: layout.radius.xs,
    },
    subtitle: {
      fontSize: fontSizes.meta,
      lineHeight: 18,
      paddingHorizontal: spacing.xs,
    },
    photoLarge: {
      width: '100%',
      aspectRatio: 4 / 3,
      borderRadius: layout.radius.panel,
      backgroundColor: colors.surfaceRecessed,
    },
    photoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingHorizontal: spacing.xs,
    },
    photoThumb: {
      width: 88,
      height: 88,
      borderRadius: layout.radius.sm,
      backgroundColor: colors.surfaceRecessed,
    },
    photoRowText: {
      flex: 1,
      gap: spacing.xs,
      alignItems: 'flex-start',
    },
    photoPreview: {
      width: '100%',
      aspectRatio: 4 / 3,
      borderRadius: layout.radius.sm,
    },
    inlineAction: {
      minHeight: layout.touchTarget.minHeight,
      justifyContent: 'center',
    },
    field: {
      gap: spacing.xs,
    },
    fieldLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    fieldLabel: {
      paddingHorizontal: spacing.xs,
    },
    inputContainer: {
      marginBottom: 0,
    },
    addressInput: {
      minHeight: layout.touchTarget.minHeight,
    },
    inlineActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    inlineActionText: {
      color: colors.primary,
      fontWeight: '600',
    },
    previewBox: {
      borderRadius: layout.radius.sm,
      padding: spacing.sm,
      gap: spacing.sm,
    },
    previewText: {
      fontSize: fontSizes.caption,
      lineHeight: 17,
    },
    actionsBlock: {
      gap: spacing.xs,
      marginTop: 2,
    },
  });
