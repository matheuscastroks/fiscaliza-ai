# Dados dinâmicos: avaliação e plano objetivo

Data: 2026-11-02. Escopo: app Expo, filtros, listas, detalhes e cálculos compartilhados.
Estado: implementação em andamento; processamento local e virtualização implementados.
As correções anteriores de bairros já estão na worktree e não foram generalizadas automaticamente.

## Registro de execução

- Autorização recebida para implementar o plano integralmente, sem paradas entre etapas.
- Implementados: índice de busca local por lista aberta no AppSelect; opções estáveis de bairros;
  filtro memoizado de salvos; ordenação memoizada de ocorrências; normalização da busca fora
  do loop por ocorrência.
- Implementados: Resultados com FlatList e cursor existente; Histórico e Município/bairros
  com FlatList. Histórico também memoiza seleção/ordenação.
- Implementados: cache fresco respeitado no foco das consultas municipais; AbortSignal
  encaminhado à consulta e às páginas de requestAll.
- `npx tsc --noEmit` e `npm run lint` aprovados após cache/cancelamento.
  `npm test` aprovou 38 testes de domínio e 53 de componentes/infraestrutura.
  Isso ainda não valida as novas telas no Android nem comprova redução de latência.
- Pendente: eliminar carregamento integral nas telas de coleção, preservando busca, ordem e
  contagens; revisar detalhes extensos, medir UI no Android e validar regressões.
- Atualização: `useCityPages` implementado com páginas de 50, isolamento conta/município/filtro,
  cancelamento, deduplicação e cache. Ocorrências e Histórico migrados. API mantém retorno em
  array e adiciona search/order/evaluated; ordenação por apoios usa relações persistidas + base
  de demonstração, antes do offset. Tipos do app/backend e lint aprovados.
  Novo teste de páginas aprovado (filtros, tamanho, continuidade, sinal, conta e desabilitação).
  Integração PostgreSQL dos novos filtros ainda pendente; primeiro acesso Docker foi negado
  pelo sandbox e precisa ser repetido com a permissão adequada. Isso não prova indisponibilidade.
- Integração de busca, ordem por apoios/recentes/avaliação e offset aprovada em PostgreSQL
  isolado (`fiscaliza_dynamic_perf_20261102`), após corrigir fixtures de autenticação e engajamento.
  Coleção Postman atualizada com exemplo de paginação filtrada.
- Detalhes: `ProgressiveList` aplicado a comentários e históricos/atualizações das três telas
  de detalhes extensos. Teste comprova montagem inicial de 20 itens e acesso completo sob demanda.
- Perfil: em implementação resumo agregado no servidor (`/activity?summary=true`) para evitar
  carregar/hidratar registros completos apenas para contar. Caminho antigo preservado e filtro
  municipal/autor/participação levado à consulta antes do limite. Integração do resumo pendente.
- Android: ADB confirmou lista vazia de aparelhos nesta etapa. Validação nativa ainda pendente;
  não declarar ganhos de tempo/FPS das novas telas com base nos testes de código/banco.
- Resumo do Perfil aprovado com mais 501 registros: contagem completa, resposta sem carregar
  as coleções. Consulta de proximidade aprovada: mesmo município, exclusão do próprio registro,
  distância até 1,5 km, ordenação e até quatro registros. Detalhe não baixa mais toda a coleção.
  requestAll foi preservado apenas para o adaptador de compatibilidade services/mockApi.ts;
  nenhuma tela ativa depende desse carregamento integral.
- Revisão final independente encontrou e corrigiu: footer atribuído ao AppHeader, ordenação
  por createdAt em vez de reportedAt, vazio exibido junto com erro no Histórico, dependência
  do fallback invalidando bairros e ausência de revalidação por foco no cache infinito.
- Após revisão: tipos, lint, 38 testes de domínio + 55 testes locais e integração PostgreSQL
  focalizada aprovados. Primeiro acesso Docker e erros iniciais das fixtures foram resolvidos.
  Falta validação visual/nativa e medições dos cenários sintéticos antes de encerrar o objetivo.
- Teste adicional de foco infinito aprovado: reutiliza páginas frescas, atualiza páginas vencidas
  ou invalidadas e preserva páginas acumuladas. ADB sem aparelho físico e sem serviços mDNS.
  AVD local `Medium_Phone` encontrado; emulador iniciado sem janela (PID inicial 34808),
  dispositivo `emulator-5554` ainda offline durante o boot. Metro 8081 respondeu status running.
  Próximo passo: aguardar boot, instalar APK debug já disponível e validar telas no emulador.
  Medições desse AVD não devem ser comparadas diretamente com o baseline do telefone físico.
- AVD concluiu boot e APK foi instalado, mas o APK ARM64 encerra antes do JS no emulador
  x86_64: `SoLoaderDSONotFoundError: libreactnative.so`. Build local x86_64 iniciado com
  Gradle/cache existente e `--offline` (sessão de execução 27716), ainda em andamento.
  Nenhuma alteração de dependências ou de arquitetura do produto foi feita para esse build.
- Ambiente nativo isolado preparado: API atualizada na porta 3002, banco de teste com 2000
  chamados sintéticos, health aprovado; sessão API 49672. Metro diagnóstico na porta 8081,
  sessão 18277, aponta para `http://localhost:3002/api`. Portas 8081 e 3002 revertidas ao AVD.
  Após finalizar QA, restaurar o Metro ao ambiente habitual antes de devolver o uso normal.
- Build x86_64 concluído com sucesso (15m31s); APK inspecionado contém libreactnative.so
  para x86_64 e foi reinstalado no AVD. O crash ARM64 foi resolvido.
  AVD Android 15 apresentou DeadSystemException em processos do sistema, UiAutomator
  indisponível e ANR de startup; dumpsys meminfo também expirou. Reinício do AVD executado
  preservando userdata para recuperar serviços. Não atribuir esses erros sistêmicos às mudanças JS.
  Detalhe sintético `dynamic-detail-fixture` preparado no banco isolado com 500 comentários
  e 500 eventos para verificar montagem progressiva após o Android recuperar.
- Ruling: manter requestAll para consumidores antigos até migrar cada consulta corretamente.
  O contrato atual de ocorrências aceita status/categoria/autor e offset, mas não oferece
  busca textual nem ordenação por apoios; paginar antes de resolver isso filtraria só a página
  carregada e produziria resultados incompletos.

## Evidência e prioridade

A lentidão anterior do mapa foi medida no Android e corrigida nos cálculos de bairros;
ver `map-performance.md`. Os demais itens abaixo são riscos identificados no código,
não gargalos com duração ou FPS já comprovados. O inventário de busca local está em
`.validation/dynamic-data-inventory.txt` (ignorado pelo Git).

| Superfície / arquivos | Estado atual e risco | Ação proposta | Prioridade |
|---|---|---|---|
| `components/ui/AppSelect.tsx` | FlatList e modal sob demanda já existem. A cada tecla normaliza novamente o texto de todas as opções. | Preparar rótulos normalizados uma vez por lista enquanto aberto; pesquisar sobre esse índice local. Medir antes de acrescentar debounce. | P1 |
| `features/city/NeighborhoodPicker.tsx`, `stores/territoryStore.ts`, `features/territory/selectors.ts` | Collator reutilizado, lista estável, resolução memoizada e retorno imediato sem bairro já corrigidos. | Consolidar as alterações existentes; verificar dependências em todos os consumidores. Preservar nomes ambíguos sem ID. | P1 |
| `app/NeighborhoodScreen.tsx`, `features/reports/DescriptionStep.tsx` | Constroem opções no render. Bairros podem ter centenas de itens; categoria e prioridade são conjuntos pequenos. | Estabilizar opções derivadas de bairros; constantes para conjuntos fixos apenas quando evitarem trabalho no seletor. | P1 / baixo para conjuntos pequenos |
| `app/ResultsScreen.tsx` | ScrollView monta todos os cards; carregar mais aumenta `limit` de 50 até 500 e busca novamente o prefixo. | FlatList com resumo no cabeçalho e paginação por `useInfiniteOfficialCalls` já existente. Reiniciar páginas ao mudar bairro; preservar total e estados vazios/erro. | P1 |
| `app/(tabs)/ProblemsListScreen.tsx`, `features/map/useOccurrenceFilters.ts` | FlatList já existe. Ordenação fora de memoização; busca filtra em cada tecla. A origem busca todas as ocorrências. | Memoizar ordenação por dados/ordem, evitar normalizar consulta por item, estabilizar linha/callback se perfil justificar. Resolver carregamento integral na etapa 3. | P1 |
| `app/(tabs)/FollowScreen.tsx`, `stores/followStore.ts` | Lista virtualizada; filtro recria array por render e cada card consulta salvos com `some`. Custo pode crescer com muitos salvos. | Memoizar filtro; medir seletores dos cards com muitos salvos. Só introduzir índice de IDs se a varredura for relevante. Preservar confirmação persistida de salvar/remover. | P2 |
| `app/(tabs)/index.tsx`, `features/city/CityCarousel.tsx` | Home consulta 30 chamados; cada carrossel limita montagem a 8. Não é lista ilimitada. | Preservar limites. Medir renderização da Home ao perder foco, especialmente seção de salvos. Virtualizar Home somente se o perfil ainda indicar necessidade. | P2 |
| `components/official/OfficialCallRow.tsx`, `components/territory/TerritoryPreviewCard.tsx`, `features/city/CommunityComment.tsx`, `features/city/CivicCard.tsx` | Datas localizadas são formatadas durante renderizações. Formatação repetida pode pesar em listas. | Medir; reutilizar poucos formatadores Intl por formato/localidade quando relevante, preservando fuso, datas inválidas e textos atuais. | P2 |
| `app/CityScreen.tsx` | Bairros do resumo montados integralmente com ScrollView/map. | FlatList com cabeçalho e rodapé; identidade estável por bairro. Não fixar altura de linhas com textos variáveis. | P2 |
| `app/HistoryScreen.tsx` | Busca todas as ocorrências municipais, filtra pelo autor e ordena em render; ScrollView monta tudo. | Memoizar transformação e virtualizar; na etapa 3, obter somente dados necessários por páginas. | P1 |
| `features/city/useCityQuery.ts`, `services/http.ts` | `requestAll` percorre páginas de 100 até offset 100000 para ocorrências/civic-items; refetch explícito em todo foco. Consulta genérica não encaminha AbortSignal. | Auditar consumidores e necessidade de atualização. Paginar as telas de coleção; reutilizar cache fresco e encaminhar cancelamento. Não truncar dados usados por contadores. | P1, etapa 3 |
| `app/(tabs)/ProfileScreen.tsx` | Conta atividade a partir de arrays; salvos visíveis limitados a 2. | Memoizar contagens por dados; revisar origem integral de atividade. Não converter a página em lista por causa de dois cards. | P2 |
| `app/ProblemDetailsScreen.tsx`, `app/CivicDetailsScreen.tsx`, `app/HistoricalDetailsScreen.tsx` | Comentários e históricos retornados no detalhe são montados com map; podem crescer sem limite de UI. | Medir detalhes extensos; montar seções progressivamente em uma lista vertical, preservando ordem e composição. Paginar respostas só após conferir contratos. | P2 |
| `app/OfficialCallDetailsScreen.tsx`, `components/territory/FacilityDetails.tsx` | Principalmente campos de um registro e poucas datas. | Conferir no perfil; evitar otimização estrutural sem evidência. | P3 |
| `app/(tabs)/TerritoryScreen.tsx`, `components/territory/TerritoryListView.tsx`, `components/ui/MapboxMapView.tsx` | Lista virtualizada, cursor de chamados, GeoJSON memoizado e câmera em ref já existem. Páginas acumuladas ainda aumentam transformações e memória. | Manter estrutura; medir com 50/500/2000 itens, troca de filtro e retorno de detalhe. Investigar acumulação somente se houver degradação. | P2 |
| `components/territory/TerritoryClusterCarousel.tsx` | FlatList horizontal já existe. | Verificar seleção, chaves e retorno ao mesmo cluster com muitos itens; sem substituir carrossel antecipadamente. | P3 |
| `app/NeighborhoodScreen.tsx`, `features/territory/NeighborhoodOverview.tsx`, `app/ResultsScreen.tsx` | Resumos e agregados, além dos seletores/listas citados. | Preservar agregados do servidor; confirmar limites de topServices antes de tratar como lista longa. | P3 |
| `features/city/useSavedRefresh.ts` | Atualização de salvos já tem workers limitados e cancelamento. | Manter controle de concorrência; medir só se atualização de muitos salvos bloquear UI. | P3 |
| ReportScreen, ProposalScreen, PhotoAttachments, DescriptionStep, onboarding, sidebar, SlidingTabs | Fotos, duplicatas, slides, passos e navegação usam map/ScrollView. Muitos conjuntos são pequenos ou estáticos. | Conferir limites reais de fotos/duplicatas no formulário. Virtualizar apenas conjunto que possa crescer; preservar teclado e gestos. | P3 |
| Login, criar conta, apresentação, ajuda, configurações, município e telas institucionais | Formulários/conteúdo predominantemente fixo. RelatedScreen redireciona um registro. | Nenhuma migração de lista justificada no inventário atual. | Sem mudança proposta |

## Sequência de execução

1. **Medir e corrigir processamento compartilhado.** AppSelect, bairros, ocorrências e salvos.
   Registrar baseline antes de cada alteração. Estabilizar entradas e remover cálculo repetido.
   Entrega: mudanças pequenas por componente; nenhuma biblioteca nova.
2. **Virtualizar coleções montadas integralmente.** Resultados, Histórico e Município/bairros.
   Usar FlatList existente com cabeçalho/rodapé. Resultados reutiliza o cursor de chamados.
   Entrega: carregar mais adiciona páginas sem remontar todos os cards anteriores.
3. **Limitar o trabalho de carregamento.** Inventariar cada consumidor de requestAll, incluindo
   Perfil. Conferir suporte real de filtros/paginação no backend antes de mudar contratos.
   Substituir coleção integral por páginas onde a tela suporta. Contadores precisam de agregados
   corretos; nunca calcular totais municipais somente com a primeira página. Revisar cache/foco
   e cancelamento por hook. Se faltar suporte de servidor, registrar a dependência explicitamente.
4. **Detalhes e acabamento medidos.** Comentários/históricos extensos, datas, renderização de
   cards e transformações do mapa. Só aplicar mudanças cujo custo aparecer nas medições.

## Critérios de validação

- Mesmo Android, mesma versão e mesmo cenário antes/depois. Separar cache frio/aquecido e
  desenvolvimento/release; não interpretar ganho de SQL ou tempo de rede como ganho de FPS.
- Seletores: 167, 1000 e 5000 opções; abrir, digitar, limpar, selecionar e fechar. Medir tempo
  de cálculo e commit; meta inicial p95 de resposta visual até 100 ms em busca local aquecida.
- Listas: 50, 500 e 2000 registros; montagem, rolagem, carregar mais e retorno de detalhe.
  Observar frames e memória em repouso após repetir navegação; nenhum ganho publicado sem dados.
- Detalhes: cenários sintéticos com 0, 50 e 500 comentários/eventos, identificados como fixtures.
- Filtros continuam corretos para acentos, espaços, sem resultados e nomes ambíguos. Troca de
  filtro não pode anexar páginas antigas; refetch mantém conteúdo disponível e mostra falha.
- Salvos continuam isolados por conta/município; mutações só confirmam persistência real.
- Usar testes de comportamento para lógica alterada; tipos/lint e verificação no Android para UI.
  Manter o retorno aquecido do mapa dentro da meta já definida (p95 até 500 ms até frame).
- Não registrar dados pessoais, coordenadas ou conteúdo de chamados na instrumentação.

## Escolhas para manter simples

Manter FlatList, TanStack Query, Zustand e o cursor existente. Não adicionar FlashList,
cache global de todos os textos, workers, novos stores ou memoização indiscriminada.
`getItemLayout` só para dimensões conhecidas; cards com texto variável não têm altura fixa.
Não ajustar windowSize/batches às cegas nem desativar structural sharing para mascarar render.

## Pesquisa que orienta o plano

- [React Native FlatList](https://reactnative.dev/docs/flatlist): virtualização, chaves,
  dependências externas/extraData e getItemLayout apenas com dimensões conhecidas.
- [React useMemo](https://react.dev/reference/react/useMemo): medir interações antes de
  memoizar; dependências novas anulam reaproveitamento e cache não é garantia semântica.
- [React Profiler](https://react.dev/reference/react/Profiler): comparar custo das árvores
  e commits com entradas e cenários equivalentes.
- [TanStack Query v5 — render optimizations](https://tanstack.com/query/v5/docs/framework/react/guides/render-optimizations):
  preservar structural sharing, observar propriedades necessárias e usar select estável quando útil.

Essas orientações sustentam as ações propostas; não comprovam a duração dos riscos encontrados.
