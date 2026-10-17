import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { layout } from '@/theme/layout';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { AppDivider } from '@/components/ui/AppDivider';
import { DemoNotice } from '@/components/demo/DemoNotice';

export default function LoginScreen() {
  const [showCredentialsForm, setShowCredentialsForm] = useState(false);
  const [email, setEmail] = useState('joao.silva@email.com');
  const [password, setPassword] = useState('123456');

  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    clearError();
  }, [email, password, clearError]);

  const handleOpenDemo = async () => {
    clearError();
    const result = await login('demo@vilaesperanca.exemplo', 'demo');
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Erro ao iniciar demonstração', result.error || 'Não foi possível carregar os dados locais.');
    }
  };

  const handleLoginWithCredentials = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Informe o e-mail e a senha de teste.');
      return;
    }

    const result = await login(email.trim(), password);
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Falha na autenticação', result.error || 'Credenciais inválidas.');
    }
  };

  return (
    <AppScreen style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Cabeçalho de Identidade e Contexto Territorial */}
          <View style={styles.header}>
            <AppText variant="protocol" color="muted">
              FISCALIZA-AI
            </AppText>
            <AppText variant="screenTitle" color="ink" style={styles.mainTitle}>
              Vila Esperança
            </AppText>
            <AppText variant="label" color="muted">
              Protótipo de participação cidadã
            </AppText>
          </View>

          <AppDivider spacingVertical="md" />

          {/* Proposição de Serviço */}
          <View style={styles.serviceSection}>
            <AppText variant="sectionTitle" color="ink" style={styles.sectionHeading}>
              Registre e acompanhe ocorrências na via pública
            </AppText>
            <AppText variant="body" color="muted" style={styles.description}>
              Consulte o mapa territorial, informe problemas de pavimentação, iluminação ou limpeza e acompanhe a tramitação com histórico documentado.
            </AppText>
          </View>

          {/* Área de Ação Principal */}
          {!showCredentialsForm ? (
            <View style={styles.actionsArea}>
              <AppButton
                title="Abrir demonstração"
                variant="primary"
                loading={isLoading}
                onPress={handleOpenDemo}
                style={styles.primaryCta}
              />

              <TouchableOpacity
                onPress={() => setShowCredentialsForm(true)}
                style={styles.secondaryOptionButton}
                accessibilityRole="button"
                accessibilityLabel="Acessar com credenciais de teste"
              >
                <AppText variant="meta" color="accent">
                  Entrar com credenciais de teste →
                </AppText>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.credentialsForm}>
              <View style={styles.formHeaderRow}>
                <AppText variant="label" color="ink">
                  Conta de teste
                </AppText>
                <TouchableOpacity
                  onPress={() => setShowCredentialsForm(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <AppText variant="caption" color="accent">
                    Voltar para acesso rápido
                  </AppText>
                </TouchableOpacity>
              </View>

              <AppInput
                label="E-mail"
                value={email}
                onChangeText={setEmail}
                placeholder="exemplo@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />

              <AppInput
                label="Senha"
                value={password}
                onChangeText={setPassword}
                placeholder="Senha"
                secureTextEntry
                editable={!isLoading}
                error={error}
              />

              <AppButton
                title="Entrar com conta de teste"
                variant="primary"
                loading={isLoading}
                onPress={handleLoginWithCredentials}
              />
            </View>
          )}

          {/* Rodapé Informativo e Notificação de Demonstração */}
          <View style={styles.footer}>
            <DemoNotice
              message="Ambiente demonstrativo com dados locais mockados. Não possui vínculo com órgãos públicos ou prefeitura real."
            />

            <AppText variant="caption" color="subtle" style={styles.legalDisclaimer}>
              Acesso gov.br: proposta de integração futura para identificação oficial.
            </AppText>
          </View>
        </ScrollView>
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: spacing.xs,
  },
  mainTitle: {
    marginTop: spacing.xxs,
    marginBottom: spacing.xxs,
  },
  serviceSection: {
    marginVertical: spacing.md,
  },
  sectionHeading: {
    marginBottom: spacing.xs,
  },
  description: {
    lineHeight: 22,
  },
  actionsArea: {
    marginVertical: spacing.xl,
  },
  primaryCta: {
    marginBottom: spacing.md,
  },
  secondaryOptionButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.touchTarget.minHeight,
  },
  credentialsForm: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: layout.radius.panel,
    borderWidth: layout.borderWidth.hairline,
    borderColor: colors.divider,
    marginVertical: spacing.md,
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  footer: {
    marginTop: spacing.xl,
    rowGap: spacing.sm,
  },
  legalDisclaimer: {
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
});