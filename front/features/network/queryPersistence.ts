import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { Query } from '@tanstack/react-query';

/**
 * Guarda no aparelho o último resultado das consultas públicas, para o app
 * abrir com conteúdo sem internet. Só dados públicos: nada de conta.
 */
const PERSISTED = new Set([
  'officialCallsFilters',
  'officialCallsPages',
  'officialCall',
  'neighborhoods',
  'neighborhoodBoundary',
  'publicSources',
]);

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'fiscaliza-ai:query-cache:v1',
  throttleTime: 2000,
});

export const persistOptions = {
  persister: queryPersister,
  maxAge: 24 * 60 * 60 * 1000,
  // Mudou o formato das respostas numa versão nova: o cache antigo é descartado.
  buster: '1',
  dehydrateOptions: {
    shouldDehydrateQuery: (query: Query) =>
      query.state.status === 'success' && PERSISTED.has(String(query.queryKey[0])),
  },
};
