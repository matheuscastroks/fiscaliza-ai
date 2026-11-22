# Task 1 — domínio demonstrativo persistente

## Entrega

- `demo/types.ts` preserva o formato de `Problem` e acrescenta `statusHistory` nos relatos do domínio. `User` recebeu apenas um registro fictício adicional em `data/mockData.ts` (`demo-citizen`); campos e assinaturas existentes foram mantidos.
- `demo/fixtures.ts` produz três relatos fictícios, com datas fixas. `DEMO_PRIMARY_ID` é sempre `demo-001`; `registered`, `in_progress` e `resolved` variam o estado e histórico desse mesmo relato. Cada chamada devolve uma cópia independente.
- `demo/repository.ts` restaura dados por chave, valida o payload antes de usar, serializa mutações, persiste antes de publicar o novo estado e devolve cópias. Dados corrompidos abrem o cenário inicial em memória e deixam aviso em `getWarning()`; o payload original só é substituído após uma ação explícita. Falhas de leitura/escrita são propagadas; falhas de escrita não alteram o estado em memória.
- `services/mockApi.ts` preserva os métodos legados e usa AsyncStorage com chave `fiscaliza:citizen:v1`. Respostas de erro são explicitadas por `success: false`. Estatísticas são derivadas do mesmo repositório. `services/aiService.ts` mantém os exports legados, todos direcionados à heurística local; a imagem anexada é identificada como não analisada. A dependência `@google/genai` foi removida do manifesto e lockfile.
- Corrigidos os cinco erros TypeScript prévios em `ParallaxScrollView`, `IconSymbol` e `useThemeColor`, relacionados aos tipos atuais de esquema de cor e símbolo.

## Contrato para Tasks 2 e 3

`createDemoRepository(storage: DemoStorage, key: string)` recebe adaptador assíncrono `{ getItem, setItem, removeItem }` e chave própria do produto. Para o painel, usar `fiscaliza:municipal:v1`; para o app, já existe `citizenDemoRepository` com `fiscaliza:citizen:v1`. Não há sincronização entre as chaves.

Os exports principais são `DemoStorage`, `DemoScenario`, `DemoProblem`, `ProblemFilters`, `CreateProblemInput`, `UpdateProblemInput` em `demo/types.ts`; `DEMO_PRIMARY_ID`, `DEMO_SCENARIOS` e `createScenarioFixtures` em `demo/fixtures.ts`; e `createDemoRepository`, `DemoRepository` em `demo/repository.ts`. Não há importação de React Native em `demo/`.

Métodos: `list(filters?) -> Promise<DemoProblem[]>`, `get(id) -> Promise<DemoProblem | null>`, `create(input) -> Promise<DemoProblem>`, `update(id, updates) -> Promise<DemoProblem>`, `reset(scenario) -> Promise<void>`, `getScenario() -> Promise<DemoScenario>`, `vote(id) -> Promise<number>`, `comment(id,userId,userName,text) -> Promise<DemoProblem>`, `getWarning() -> string | null` síncrono. `filters` aceita status, category, priority, userId e search combinados; valor `all` ignora filtro de enum. Ao mudar `status`, `update` exige `justification` não vazia e registra data e justificativa no histórico. `reset` apenas executa a operação; confirmação da pessoa usuária cabe à interface.

`demoApi` no serviço móvel expõe `getScenario`, `reset` e `getWarning`. `authApi`, `problemsApi` e `statsApi` mantêm os nomes e assinaturas consumidos pelas telas atuais. `demoUser` em `data/mockData.ts` é o usuário fictício a usar para entrada demonstrativa.

## TDD e verificação

- RED do repositório: nove testes falharam contra métodos ainda não implementados; após a primeira implementação, 9/9 passaram. O décimo teste, de votos/comentários, teve RED específico (`repo.vote is not a function`) antes da extensão; depois, 10/10 passaram.
- RED da heurística local: `localAnalysis.test.ts` falhou por módulo ausente antes da implementação.
- GREEN final: `npm test` passou com 12/12 testes; `npx tsc --noEmit --pretty false` encerrou com código 0; `git diff --check` encerrou com código 0.
- `npm run lint` ainda acusa nove erros `react-hooks/set-state-in-effect` nas telas existentes `app/(tabs)/index.tsx`, `app/HistoryScreen.tsx`, `app/ProblemDetailsScreen.tsx` e `app/RankingScreen.tsx`, além de um aviso `no-require-imports` em `app/(tabs)/index.tsx`. A auditoria inicial da Task 1 já registrava os mesmos nove erros; essas telas pertencem à Task 3.

Limite: testes do domínio executados em Node 24 com armazenamento em memória. A integração nativa via AsyncStorage não foi executada em dispositivo/emulador nesta tarefa.
