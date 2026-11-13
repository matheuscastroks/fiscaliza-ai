import { buildApp } from './app.js';
const app = await buildApp({ logger: true });

// Encerramento: para de aceitar conexões, espera as requisições em curso e
// fecha o pool (hook onClose). Prazo de 10 s, abaixo dos 30 s do Docker; um
// segundo sinal encerra na hora.
let closing = false;
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => {
    if (closing) process.exit(1);
    closing = true;
    app.log.info({ signal }, 'Encerrando a API.');
    const deadline = setTimeout(() => {
      app.log.error('Encerramento passou de 10 s; saindo assim mesmo.');
      process.exit(1);
    }, 10_000);
    deadline.unref();
    void app.close().then(
      () => process.exit(0),
      (error: unknown) => {
        app.log.error({ err: error }, 'Falha ao encerrar a API.');
        process.exit(1);
      },
    );
  });

await app.listen({ host: '0.0.0.0', port: Number(process.env.PORT || 3001) });
