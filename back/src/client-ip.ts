import { isIP } from 'node:net';
import type { FastifyRequest } from 'fastify';

function ipv4ToInt(ip: string): number | null {
  const mapped = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  const parts = mapped.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255))
    return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

export function ipInTrustedList(ip: string, trusted: string[]): boolean {
  const value = ipv4ToInt(ip);
  if (value === null) return trusted.includes(ip);
  return trusted.some((entry) => {
    const [base, bits = '32'] = entry.split('/');
    const network = ipv4ToInt(base);
    const length = Number(bits);
    if (network === null || !Number.isInteger(length) || length < 0 || length > 32)
      return false;
    const mask = length === 0 ? 0 : (0xffffffff << (32 - length)) >>> 0;
    return (value & mask) === (network & mask);
  });
}

// Chave do limite de requisições: o IP real que a Cloudflare informa, mas só
// quando a conexão chega de um proxy confiável (o túnel). Fora disso, qualquer
// um poderia forjar o cabeçalho e escapar do limite.
export function rateLimitKey(trusted: string[] | false) {
  return (req: FastifyRequest): string => {
    const forwarded = req.headers['cf-connecting-ip'];
    const remote = req.socket.remoteAddress;
    if (
      trusted &&
      typeof forwarded === 'string' &&
      isIP(forwarded) !== 0 &&
      remote &&
      ipInTrustedList(remote, trusted)
    )
      return forwarded;
    return req.ip;
  };
}
