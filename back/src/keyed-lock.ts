// Fila por chave dentro do processo: serializa as escritas de um mesmo usuário
// sem segurar conexões do banco enquanto espera. Pressupõe uma única instância
// da API (hoje, um container). Quem espera mais que o limite recebe 503.
export function createKeyedLock(timeoutMs = 10_000) {
  const tails = new Map<string, Promise<void>>();

  return async function run<T>(
    key: string,
    task: () => Promise<T>,
    onTimeout: () => Error,
  ): Promise<T> {
    const previous = tails.get(key) ?? Promise.resolve();
    let release!: () => void;
    const mine = new Promise<void>((resolve) => {
      release = resolve;
    });
    const tail = previous.then(() => mine);
    tails.set(key, tail);

    let timer: NodeJS.Timeout | undefined;
    try {
      const timedOut = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(onTimeout()), timeoutMs);
      });
      await Promise.race([previous, timedOut]);
      clearTimeout(timer);
      return await task();
    } finally {
      clearTimeout(timer);
      release();
      if (tails.get(key) === tail) tails.delete(key);
    }
  };
}
