import { buildApp } from './app.js';
const app = await buildApp({ logger: true });
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => {
    void app.close().then(() => process.exit(0));
  });
await app.listen({ host: '0.0.0.0', port: Number(process.env.PORT || 3001) });
