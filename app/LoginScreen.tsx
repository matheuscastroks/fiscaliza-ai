import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { setStatusBarStyle } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBrandGlyph } from '@/components/ui/AppBrandGlyph';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { AppText } from '@/components/ui/AppText';
import { GovBrButton } from '@/components/ui/GovBrButton';
import { KeyboardAwareScrollView } from '@/components/ui/KeyboardAwareScrollView';
import { layout } from '@/theme/layout';
import { spacing } from '@/theme/spacing';
import { useTheme } from '@/theme/useTheme';
import { useAuthStore } from '@/stores/authStore';

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore();

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle(isDark ? 'light' : 'dark');
    }, [isDark]),
  );

  const submit = async () => {
    const result = await login(email.trim(), password);
    if (result.success) {
      router.replace(
        useAuthStore.getState().user?.municipality
          ? '/(tabs)'
          : '/MunicipalityScreen',
      );
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  // Altura do banner herói inspirada na proporção de resting do DetailSheet
  const heroHeight = Math.min(320, Math.max(200, Math.round(height * 0.34)));

  return (
    <View style={[styles.root, { backgroundColor: colors.canvas }]}>
      {/* 1. Backdrop com fotografia urbana cívica */}
      <View style={[styles.heroContainer, { height: heroHeight }]}>
        <Image
          source={require('@/assets/images/auth-backdrop.jpg')}
          contentFit="cover"
          style={StyleSheet.absoluteFill}
          priority="high"
          accessibilityLabel="Fotografia urbana de cidadãos caminhando na cidade"
        />

        <LinearGradient
          colors={['rgba(15, 23, 42, 0.65)', 'rgba(15, 23, 42, 0.25)', 'rgba(15, 23, 42, 0.85)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Barra superior com botão voltar e badge da marca */}
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) + spacing.xs }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.brandPill}>
            <AppBrandGlyph size={18} color="#FFFFFF" active />
            <AppText style={styles.brandTitle}>Fiscaliza aí</AppText>
          </View>
        </View>

        {/* Título de acolhimento sobre a imagem */}
        <View style={styles.heroFooter}>
          <AppText style={styles.heroSubtitle}>
            Participação cidadã e prestação de contas na gestão urbana
          </AppText>
        </View>
      </View>

      {/* 2. Cartão de superfície estático (sem drawer arrastável) */}
      <View
        style={[
          styles.sheetContainer,
          {
            backgroundColor: colors.surface,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop && styles.desktopContent,
            { paddingBottom: Math.max(insets.bottom, spacing.xl) + spacing.md },
          ]}
        >
          {/* Cabeçalho da área de acesso */}
          <View style={styles.headerSection}>
            <AppText variant="screenTitle" color="ink">
              Acesse sua conta
            </AppText>
            <AppText color="muted" style={styles.headerSubtitle}>
              Acompanhe sua cidade e contribua com as decisões do seu território.
            </AppText>
          </View>

          {/* Destaque principal: Login oficial Gov.br */}
          <View style={styles.govSection}>
            <GovBrButton />
            <AppText variant="caption" color="subtle" style={styles.govHint}>
              Acesso unificado com gov.br para garantir a autoria e legitimidade de cada registro.
            </AppText>
          </View>

          {/* Divisor editorial */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <AppText variant="caption" color="subtle" style={styles.dividerText}>
              ou acesse com e-mail e senha
            </AppText>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Formulário secundário com e-mail e senha */}
          <View style={styles.formSection}>
            <AppInput
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <AppInput
              label="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
              onSubmitEditing={() => {
                void submit();
              }}
              error={error}
            />

            <AppButton
              title="Entrar"
              variant="primary"
              loading={isLoading}
              disabled={!email.trim() || !password}
              onPress={() => {
                void submit();
              }}
              style={styles.submitButton}
            />
          </View>

          {/* Rodapé informativo */}
          <View style={styles.footerSection}>
            <AppButton
              title="Sobre o Fiscaliza aí"
              variant="quiet"
              onPress={() => router.push('/AboutScreen')}
            />
          </View>
        </KeyboardAwareScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  heroContainer: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    zIndex: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: layout.radius.pill,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: -0.2,
  },
  heroFooter: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg + layout.radius.sheet,
  },
  heroSubtitle: {
    color: '#F1F5F9',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  sheetContainer: {
    flex: 1,
    marginTop: -layout.radius.sheet,
    borderTopLeftRadius: layout.radius.sheet,
    borderTopRightRadius: layout.radius.sheet,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  desktopContent: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  headerSection: {
    gap: 6,
  },
  headerSubtitle: {
    lineHeight: 22,
  },
  govSection: {
    gap: spacing.xs,
  },
  govHint: {
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: layout.borderWidth.hairline,
  },
  dividerText: {
    paddingHorizontal: spacing.sm,
    textTransform: 'lowercase',
  },
  formSection: {
    gap: spacing.xs,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  footerSection: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
});
