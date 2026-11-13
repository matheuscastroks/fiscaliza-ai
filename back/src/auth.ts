import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: string,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

// Custo atual: N = 2^16, r = 8 (64 MiB por senha). O custo antigo (N = 2^14,
// formato "salt:chave") ainda é aceito e a conta é regravada no custo novo no
// próximo login. Não subimos para 2^17 para não passar de 128 MiB por conexão
// de login no container de 512 MiB.
const CURRENT_LOG_N = 16;
const LEGACY = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEY_LENGTH = 64;
const cost = (logN: number) => ({
  N: 2 ** logN,
  r: 8,
  p: 1,
  maxmem: 256 * 1024 * 1024,
});

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, KEY_LENGTH, cost(CURRENT_LOG_N));
  return `s2:${CURRENT_LOG_N}:${salt}:${key.toString('hex')}`;
}

export function needsRehash(hash: string) {
  return !hash.startsWith(`s2:${CURRENT_LOG_N}:`);
}

export async function verifyPassword(password: string, hash: string) {
  let salt: string | undefined;
  let value: string | undefined;
  let options = LEGACY;
  if (hash.startsWith('s2:')) {
    const [, logN, s, v] = hash.split(':');
    const parsed = Number(logN);
    if (!Number.isInteger(parsed) || parsed < 14 || parsed > 18) return false;
    salt = s;
    value = v;
    options = cost(parsed);
  } else {
    [salt, value] = hash.split(':');
  }
  if (!salt || !value) return false;
  const expected = Buffer.from(value, 'hex');
  const actual = await scrypt(password, salt, KEY_LENGTH, options);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// Hash de uma senha que ninguém tem: login de e-mail inexistente gasta o mesmo
// tempo de um login real, então o tempo de resposta não revela quais contas existem.
let dummyHash: Promise<string> | undefined;
export async function spendPasswordTime(password: string) {
  dummyHash ??= hashPassword('senha-que-ninguem-tem');
  await verifyPassword(password, await dummyHash);
}

export const SESSION_DAYS = 7;
export const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;
/** Renova a sessão em uso quando faltar menos que isto para vencer. */
export const SESSION_RENEW_BELOW_MS = SESSION_MS / 2;
export const sessionExpiry = (now = Date.now()) => new Date(now + SESSION_MS);

export const tokenHash = (token: string) =>
  createHash('sha256').update(token).digest('hex');
export const newToken = () => randomBytes(32).toString('base64url');

// Falhas de login por conta (além do limite por IP): 10 em 15 minutos.
export function createLoginThrottle(max = 10, windowMs = 15 * 60_000, now = () => Date.now()) {
  const failures = new Map<string, { count: number; resetAt: number }>();
  return {
    blocked(key: string) {
      const entry = failures.get(key);
      if (!entry) return false;
      if (entry.resetAt <= now()) {
        failures.delete(key);
        return false;
      }
      return entry.count >= max;
    },
    fail(key: string) {
      const entry = failures.get(key);
      if (!entry || entry.resetAt <= now())
        failures.set(key, { count: 1, resetAt: now() + windowMs });
      else entry.count += 1;
      if (failures.size > 10_000) failures.delete(failures.keys().next().value!);
    },
    reset(key: string) {
      failures.delete(key);
    },
  };
}
