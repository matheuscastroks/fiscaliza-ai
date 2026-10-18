import { goBack } from '@/utils/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useEffect, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { layout } from '@/theme/layout';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppButton } from '@/components/ui/AppButton';
import { AppDivider } from '@/components/ui/AppDivider';
import { AppText } from '@/components/ui/AppText';
import { useReportForm } from '@/features/reports/useReportForm';
import { LocationStep } from '@/features/reports/LocationStep';
import { DescriptionStep } from '@/features/reports/DescriptionStep';
import { ReviewStep } from '@/features/reports/ReviewStep';
import { ReportSuccess } from '@/features/reports/ReportSuccess';

export default function ReportScreen() {
  const user = useAuthStore((state) => state.user);
  return <ReportContent key={user?.id + ':' + user?.municipality?.id} />;
}
function ReportContent() {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollView>(null);
  const userId = user?.id || '';
  const { camera } = useLocalSearchParams<{ camera?: string }>();
  const captured = useRef<string | undefined>(undefined);

  const {
    step,
    data,
    updateField,
    updateLocation,
    duplicates,
    ready,
    nextStep,
    prevStep,
    runLocalSuggestion,
    isAnalyzing,
    analysisSuggested,
    analysisSource,
    pickImage,
    removeImage,
    submitReport,
    isSubmitting,
    createdProblem,
    resetForm,
    error,
  } = useReportForm();

  useEffect(() => {
    if (ready && camera && captured.current !== camera) {
      captured.current = camera;
      void pickImage(true);
    }
  }, [ready, camera, pickImage]);

  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
    Keyboard.dismiss();
  }, [step]);

  if (createdProblem) {
    return (
      <AppScreen edges={['top']} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ReportSuccess problem={createdProblem} onNewReport={resetForm} />
        </ScrollView>
      </AppScreen>
    );
  }

  return (
    <AppScreen edges={['top']} style={styles.screen}>
      <AppHeader
        title="Registrar ocorrência"
        context={`Etapa ${step} de 3 · ${user?.municipality?.name || 'Seu município'}`}
        onBack={step > 1 ? prevStep : goBack}
      />

      <View
        style={{
          flexDirection: 'row',
          gap: spacing.xs,
          paddingHorizontal: spacing.contentPadding,
          paddingVertical: spacing.sm,
        }}
        accessibilityRole="progressbar"
        accessibilityLabel="Etapas do registro"
        accessibilityValue={{ min: 1, max: 3, now: step }}
      >
        {['Relato', 'Local', 'Revisão'].map((label, index) => (
          <View key={label} style={{ flex: 1, gap: spacing.xs }}>
            <View
              style={{
                height: 4,
                borderRadius: layout.radius.pill,
                backgroundColor: step > index ? colors.ink : colors.divider,
              }}
            />
            <AppText
              variant="caption"
              color={step === index + 1 ? 'ink' : 'muted'}
            >
              {index + 1}. {label}
            </AppText>
          </View>
        ))}
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scroll}
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {step === 2 && (
            <LocationStep
              address={data.address}
              neighborhood={data.neighborhood}
              onNeighborhoodChange={(value) =>
                updateField('neighborhood', value)
              }
              latitude={data.latitude}
              longitude={data.longitude}
              selected={data.locationSelected}
              onLocationChange={updateLocation}
              onAddressChange={(address) => updateField('address', address)}
              error={error}
            />
          )}

          {step === 1 && (
            <DescriptionStep
              title={data.title}
              onTitleChange={(title) => updateField('title', title)}
              description={data.description}
              onDescriptionChange={(desc) => updateField('description', desc)}
              category={data.category}
              onCategoryChange={(cat) => updateField('category', cat)}
              priority={data.priority}
              onPriorityChange={(prio) => updateField('priority', prio)}
              images={data.images}
              onPickImage={() => {
                void pickImage();
              }}
              onRemoveImage={removeImage}
              onRunSuggestion={runLocalSuggestion}
              isAnalyzing={isAnalyzing}
              analysisSuggested={analysisSuggested}
              error={error}
            />
          )}

          {step === 1 && analysisSource !== '' && (
            <AppText color="muted" accessibilityLiveRegion="polite">
              {analysisSource}
            </AppText>
          )}

          {step === 3 && (
            <ReviewStep
              title={data.title}
              category={data.category}
              priority={data.priority}
              address={data.address}
              description={data.description}
              images={data.images}
            />
          )}

          {step === 3 && duplicates.length > 0 && (
            <View style={{ gap: 12, marginVertical: 16 }}>
              <AppText variant="sectionTitle">
                Já existe um relato parecido?
              </AppText>
              <AppText color="muted">
                Você pode complementar o registro existente ou continuar se for
                outro problema.
              </AppText>
              {duplicates.map((item) => (
                <AppButton
                  key={item.id}
                  title={item.title}
                  variant="secondary"
                  onPress={() =>
                    router.push({
                      pathname: '/ProblemDetailsScreen',
                      params: { id: item.id },
                    })
                  }
                />
              ))}
            </View>
          )}

          {error && step === 3 ? (
            <View style={styles.errorBox}>
              <AppText variant="caption" color="risk">
                {error}
              </AppText>
            </View>
          ) : null}
        </ScrollView>

        {/* Barra de Ações Inferior */}
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(insets.bottom, spacing.xs) },
          ]}
        >
          <AppDivider />
          <View style={styles.buttonRow}>
            {step > 1 ? (
              <AppButton
                title="Voltar"
                variant="secondary"
                onPress={prevStep}
                disabled={isSubmitting}
                style={styles.backButton}
              />
            ) : null}

            {step < 3 ? (
              <AppButton
                title={step === 1 ? 'Escolher local' : 'Revisar ocorrência'}
                disabled={!ready}
                variant="primary"
                onPress={nextStep}
                style={styles.continueButton}
              />
            ) : (
              <AppButton
                title="Confirmar e registrar"
                variant="primary"
                loading={isSubmitting}
                disabled={!data.images.length}
                onPress={() => submitReport(userId)}
                style={styles.continueButton}
              />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.contentPadding,
    paddingBottom: spacing.xxl,
  },
  bottomBar: {
    backgroundColor: colors.surface,
  },
  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.contentPadding,
    paddingVertical: spacing.md,
    columnGap: spacing.sm,
  },
  backButton: {
    flex: 1,
  },
  continueButton: {
    flex: 2,
  },
  errorBox: {
    padding: spacing.md,
    backgroundColor: colors.riskSurface,
    borderRadius: layout.radius.button,
    marginVertical: spacing.sm,
  },
});
