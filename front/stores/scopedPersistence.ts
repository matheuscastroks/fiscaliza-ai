/**
 * Peças comuns das stores que gravam no aparelho por usuário e município:
 * chave com escopo, fila de escrita serial e contador de geração para descartar
 * respostas de um escopo anterior.
 */

/** `fiscaliza-ai:<nome>:<usuário|anonymous>:<município>:v1` */
export function scopedStorageKey(
  name: string,
  userId: string | null | undefined,
  municipalityId: string,
  version = 'v1',
): string {
  return `fiscaliza-ai:${name}:${userId || 'anonymous'}:${municipalityId}:${version}`;
}

/** Executa as gravações uma de cada vez, na ordem em que foram pedidas; uma falha não trava a fila. */
export function createWriteQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  return function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = tail.then(task);
    tail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };
}

/** Geração do escopo atual: troca de usuário/município invalida pedidos antigos. */
export function createScopeGeneration() {
  let generation = 0;
  return {
    current: () => generation,
    next: () => ++generation,
    isCurrent: (value: number) => value === generation,
  };
}
