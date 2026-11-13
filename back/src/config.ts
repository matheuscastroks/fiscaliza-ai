// Configuração lida uma vez, na inicialização. Em produção, a ausência de um
// valor essencial impede a API de subir, em vez de cair num padrão de
// desenvolvimento (senha de exemplo, CORS aberto, etc.).
export const DEV_DATABASE_URL =
  'postgres://fiscaliza:fiscaliza@localhost:5432/fiscaliza';
const DEV_ORIGINS = 'http://localhost:5173,http://localhost:8081';
const WEAK_PASSWORDS = ['fiscaliza', 'fiscaliza-local'];

export type AppConfig = {
  production: boolean;
  databaseUrl: string;
  webOrigins: string[];
  trustProxy: string[] | false;
  uploadDir: string;
};

function list(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function passwordOf(url: string): string | null {
  try {
    return decodeURIComponent(new URL(url).password);
  } catch {
    return null;
  }
}

export function loadConfig(
  env: NodeJS.ProcessEnv = process.env,
  overrides: { databaseUrl?: string } = {},
): AppConfig {
  const production = env.NODE_ENV === 'production';
  const databaseUrl = overrides.databaseUrl ?? env.DATABASE_URL;
  const webOrigins = list(env.WEB_ORIGINS);
  const trustProxy = list(env.TRUST_PROXY);

  if (production) {
    const missing = [
      !databaseUrl && 'DATABASE_URL',
      webOrigins.length === 0 && 'WEB_ORIGINS',
      trustProxy.length === 0 && 'TRUST_PROXY',
    ].filter(Boolean);
    if (missing.length > 0)
      throw new Error(
        `Configuração incompleta para produção: defina ${missing.join(', ')}.`,
      );
    const password = passwordOf(databaseUrl!);
    if (password !== null && WEAK_PASSWORDS.includes(password))
      throw new Error(
        'DATABASE_URL usa a senha de exemplo. Defina uma senha própria para produção.',
      );
    if (webOrigins.some((origin) => origin === '*' || origin === 'null'))
      throw new Error('WEB_ORIGINS não pode conter "*" nem "null".');
  }

  return {
    production,
    databaseUrl: databaseUrl ?? DEV_DATABASE_URL,
    webOrigins: webOrigins.length ? webOrigins : list(DEV_ORIGINS),
    trustProxy: trustProxy.length ? trustProxy : false,
    uploadDir: uploadDirFrom(env),
  };
}

/**
 * Pasta de uploads para processos que não servem HTTP (agendador, CLIs). Não
 * exige WEB_ORIGINS nem TRUST_PROXY, que só fazem sentido para a API.
 */
export function uploadDirFrom(env: NodeJS.ProcessEnv = process.env): string {
  return env.UPLOAD_DIR || 'uploads';
}
