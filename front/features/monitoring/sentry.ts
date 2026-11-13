import * as Sentry from '@sentry/react-native';

/**
 * Registro de erros e travamentos em produção (Sentry). Sem DSN, nada é
 * enviado. Não envia dados pessoais: só o id da conta, sem nome, e-mail ou IP.
 */
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
const enabledInDev = process.env.EXPO_PUBLIC_SENTRY_DEV === '1';

export const monitoringEnabled = Boolean(dsn) && (!__DEV__ || enabledInDev);

export const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
});

if (monitoringEnabled) {
  Sentry.init({
    dsn,
    environment: __DEV__ ? 'development' : (process.env.EXPO_PUBLIC_APP_ENV ?? 'production'),
    sendDefaultPii: false,
    // Amostra pequena de desempenho: o plano gratuito tem cota mensal.
    tracesSampleRate: 0.1,
    integrations: [navigationIntegration],
    enableNativeFramesTracking: true,
  });
}

export function identifyUser(userId: string | null) {
  if (!monitoringEnabled) return;
  Sentry.setUser(userId ? { id: userId } : null);
}

export function reportError(error: unknown, context?: Record<string, unknown>) {
  if (!monitoringEnabled) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

export { Sentry };
