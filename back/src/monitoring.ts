import * as Sentry from '@sentry/node';

/**
 * Registro de erros da API e do agendador (Sentry). Sem SENTRY_DSN, nada é
 * enviado. Nunca envia corpo de requisição, cookies, cabeçalhos ou IP.
 */
const dsn = process.env.SENTRY_DSN;
export const monitoringEnabled = Boolean(dsn);

if (monitoringEnabled) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend(event) {
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
        delete event.request.headers;
      }
      if (event.user) event.user = { id: event.user.id };
      return event;
    },
  });
}

export function reportError(error: unknown, context?: Record<string, unknown>) {
  if (!monitoringEnabled) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

/** Envia o que estiver na fila antes de o processo sair. */
export async function flushMonitoring(timeoutMs = 2000) {
  if (monitoringEnabled) await Sentry.flush(timeoutMs);
}
