# Auditoria de desempenho — Fiscaliza Aí

Data: 20/10/2026. Escopo: código atual, API e PostgreSQL locais, documentação técnica oficial. Nenhuma otimização foi implementada nesta auditoria; sem migrações, alterações de dados, commit ou push.

## Conclusão

Há desperdício comprovado na busca textual, no volume das respostas e na estratégia de carregamento. Cache pode ajudar, mas não substitui reduzir trabalho por requisição e por interação. A consulta SQL básica já é rápida; não há evidência para atribuir todos os travamentos ao banco.

A prioridade recomendada é diminuir dados transferidos, corrigir recargas/paginação e otimizar a busca. Depois, acrescentar cache versionado e simplificar os panoramas. Redis, PostGIS ou um mecanismo externo de busca não precisam ser a primeira intervenção.

## Como foi medido

PostgreSQL 17.11, 27.811 chamados, 4.271 equipamentos e 167 bairros. Foram executadas 35 leituras HTTP sequenciais: cinco por cenário, sem concorrência artificial. Tempos incluem receber e interpretar o JSON no computador via loopback. Valores abaixo são medianas de cinco amostras, não percentis de produção nem desempenho no celular. A primeira requisição de chamados/50 chegou a 265,58 ms; as demais desse grupo ficaram entre 30,05 e 52,42 ms.

Também executei quatro `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` em transações somente leitura, com timeout de oito segundos. Não executei sincronizações BigQuery, testes de carga ou alterações de índice. Planos e amostras estão em `.validation/filter-performance/backend-audit.json`; reprodução em `backend-audit.cjs`. [Método EXPLAIN do PostgreSQL](https://www.postgresql.org/docs/17/using-explain.html).

| Leitura da API | Mediana local | JSON decodificado |
| --- | ---: | ---: |
| 50 chamados | 36,55 ms | 41.038 bytes |
| 300 chamados | 47,31 ms | 247.558 bytes |
| 1.000 chamados | 107,13 ms | 830.098 bytes |
| Busca “ilumina”, 50 chamados | 168,28 ms | 41.428 bytes |
| Opções de filtros | 53,10 ms | 46.296 bytes |
| Panorama do Centro, janeiro–outubro | 116,28 ms | 3.890 bytes |
| 100 escolas | 40,35 ms | 117.637 bytes |

## 1. Busca: a contagem é um gargalo comprovado

`backend/src/official-calls.ts` usa `ILIKE '%texto%'` em seis campos unidos por OR. Antes de devolver os resultados, executa `COUNT(*)` com os mesmos filtros. Os índices instalados nessa tabela são B-tree; não há GIN/GiST para essa busca.

No plano da contagem de “ilumina”, o PostgreSQL varreu a tabela inteira: encontrou 2.034 linhas e descartou 25.777. Execução: **289,288 ms**. O SELECT da primeira página com busca levou **8,107 ms**. São execuções SQL isoladas; seus tempos não devem ser somados à mediana HTTP, medida em outra rodada e com caches aquecidos.

Recomendação:

- Separar protocolo exato de busca textual e aproveitar a unicidade de `external_id`.
- Avaliar `pg_trgm` com GIN para o predicado completo de busca. Indexar apenas um dos seis campos pode continuar deixando a expressão OR cara.
- Comparar índices por campo com um documento de busca normalizado. Um documento combinado muda possibilidades de correspondência entre campos e precisa de contrato/testes próprios.
- Definir comportamento para termos muito curtos, espaços, `%`, `_`, acentos e busca sem resultados. A busca de chamados não escapa curingas como a de equipamentos faz.
- Não exigir contagem exata a cada página: considerar `limit + 1` para `hasMore`, contagem separada ou contagem em cache, com mudança explícita dos contratos da UI.

Trigramas suportam LIKE/ILIKE, mas eficiência depende do padrão; índices têm custo de armazenamento e atualização. A melhoria deve ser comprovada em cópia isolada antes de aplicar migrações. [pg_trgm no PostgreSQL 17](https://www.postgresql.org/docs/17/pgtrgm.html).

## 2. Carregamento: baixar tudo de novo pesa no aparelho

Explorar começa com 300 chamados. “Carregar mais” aumenta o limite para 600, 900 e 1.000 e consulta novamente desde o começo. Para chegar a 900 itens, isso permite transferir 1.800 registros em três respostas, embora apenas 900 sejam distintos. Limitar componentes montados não elimina a transferência, parsing e transformação desses objetos.

Recomendação: páginas de 30–50 itens na lista, acumuladas com `useInfiniteQuery`, sem baixar páginas anteriores novamente. No mapa, usar uma resposta própria de marcadores, com ID, posição, categoria e situação; carregar o detalhe completo apenas quando solicitado. Não reduzir a cobertura silenciosamente: mostrar o recorte e oferecer carregamento/agrupamento adequado.

Em equipamentos, a procedência completa se repete em cada item. Uma simulação em memória, preservando as fontes completas em catálogo separado, reduziu 100 escolas de **117.637 para 50.140 bytes**. Isso comprova uma oportunidade no contrato, não um ganho já entregue. A procedência deve continuar acessível pelo `sourceId`.

As respostas diretas medidas não anunciaram `Content-Encoding`, `ETag` ou `Cache-Control`. Avaliar compressão no Fastify ou proxy, evitando compressão duplicada. Compressão reduz bytes na rede, mas o app ainda interpreta o JSON descomprimido. [Plugin oficial fastify-compress](https://github.com/fastify/fastify-compress).

## 3. Paginação e índices compostos

A primeira página sem busca usou `idx_official_calls_opened_at` e levou **0,458 ms** no SQL. Já `OFFSET 25000 LIMIT 50` percorreu aproximadamente 25 mil linhas e levou **37,934 ms**. Esse segundo cenário demonstra custo de paginação profunda; não descreve o comportamento atual do botão “Carregar mais”, que aumenta o limite da primeira página.

Recomendação: cursor baseado na ordenação estável `(opened_at, external_id)`, associado aos filtros e à versão dos dados. Avaliar índices compostos para município + ordenação e município + bairro + ordenação. Já existe `(municipality_id, neighborhood_id, opened_at)`; não criar índices duplicados ou combinações para todos os filtros sem medir seletividade e escrita. Há inclusive um índice simples de `external_id` além do índice UNIQUE, candidato a revisão posterior.

O PostgreSQL ainda calcula linhas descartadas pelo OFFSET, e índices compostos dependem das colunas iniciais e dos filtros usados. [Paginação](https://www.postgresql.org/docs/17/queries-limit.html), [índices compostos](https://www.postgresql.org/docs/17/indexes-multicolumn.html).

## 4. Cache: onde faz sentido

O cliente já usa TanStack Query. `staleTime` é 30 segundos para chamados, um minuto para equipamentos e cinco minutos para alguns cadastros/filtros. Porém `useOfficialCalls` e `useOfficialOverview` chamam `refetch()` explicitamente ao ganhar foco, mesmo se o cache ainda estiver fresco. Isso reduz o benefício da configuração. Não significa necessariamente duas requisições em toda montagem, pois existe deduplicação de consultas em andamento.

Primeiro corrigir essa política: exibir o cache imediatamente e revalidar quando necessário; pull-to-refresh continua explícito. Preservar structural sharing e o isolamento dos recortes. [Padrões do TanStack Query](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults), [otimizações de referências](https://tanstack.com/query/latest/docs/framework/react/guides/render-optimizations).

No servidor, começar com cache LRU limitado em memória e coalescência de requisições idênticas em andamento. TTLs iniciais sugeridos para experimento:

| Informação | TTL proposto | Invalidação |
| --- | --- | --- |
| Bairros, filtros e fontes | 5–15 minutos | Mudança de publicação/estado da fonte |
| Agregados do bairro | 1–5 minutos | Mudança dos dados consultados |
| Busca e páginas de chamados | 15–60 segundos | Importação visível correspondente |
| Detalhe de chamado | Curto, com revalidação | Atualização do registro |

Chaves precisam conter município, fonte, revisão dos dados e filtros normalizados; incluir busca, período, área, ordenação e página/cursor. Não usar apenas o caminho da rota. Para SIURB, aproveitar `publishedRunId`; para 1746, definir uma revisão que avance em cada publicação visível, inclusive em importação parcial. Não promover dados antigos a atuais nem transformar desconhecido em zero.

Cachear somente respostas públicas autorizadas e bem-sucedidas; não aplicar cache compartilhado indiscriminadamente a login, anexos, administração ou mutações. ETag e Cache-Control são uma camada adicional; confirmar o comportamento de revalidação do cliente Expo e do navegador. Redis passa a ser justificável quando múltiplas instâncias precisarem compartilhar cache ou quando houver pressão de memória/hit rate mensurada. [Regras de cache HTTP — RFC 9111](https://www.rfc-editor.org/rfc/rfc9111.html).

## 5. Agregados fazem trabalho que a tela não utiliza

`getNeighborhoodOverview` executa `queryOfficialOverview` duas vezes. Cada execução inclui cinco consultas agregadas e uma leitura de checkpoint. A resposta de bairro usa apenas parte desses resultados, além de repetir consultas de fonte/status.

Recomendação: obter a extensão temporal com MIN/MAX, calcular somente contagem e principais serviços do período solicitado e reutilizar metadados dentro da mesma leitura consistente. Depois avaliar resumos por bairro/dia ou materialized views atualizadas na importação. Datas arbitrárias, limites de cobertura e publicação parcial precisam continuar corretos. [Materialized views no PostgreSQL](https://www.postgresql.org/docs/17/rules-materializedviews.html).

## 6. Mapa, concorrência e renderização continuam importantes

Índices não impedem uma thread JavaScript de ficar ocupada montando componentes ou transferindo milhares de marcadores para a WebView. O mapa já tem atualizações incrementais e lotes; a lista recebeu memoização local. Ainda falta perfilar o Android durante a interação real.

Não aplicar `getItemLayout` com uma altura inventada: os cards têm conteúdo variável e fonte ampliável. Medir antes de trocar FlatList por outra biblioteca. Testar também build de desenvolvimento/release, pois Expo Go com ferramentas de desenvolvimento não representa sozinho o custo em produção. [Desempenho React Native](https://reactnative.dev/docs/performance), [configuração de listas](https://reactnative.dev/docs/optimizing-flatlist-configuration).

O pool principal tem máximo de dez conexões; existe outro pool de até vinte para locks. Não medi saturação. Instrumentar espera por conexão, consultas em andamento, event loop, uso de memória e latência por rota antes de aumentar pools.

O cancelamento HTTP do cliente não está conectado ao cancelamento das consultas SQL dessas rotas. Requisições abandonadas podem continuar consumindo banco. Avaliar limites de duração, verificações de abandono entre etapas e suporte real de cancelamento do driver; não presumir que passar AbortSignal ao fetch cancela PostgreSQL.

PostGIS/GiST e agrupamento espacial no servidor são opções para evolução do mapa, especialmente com polígonos e bases maiores. O filtro atual usa intervalos de latitude/longitude com B-tree. Com o volume medido, ainda não há evidência para priorizar uma migração espacial completa. [Uso de índice espacial no PostGIS](https://postgis.net/docs/ST_Intersects.html).

## Ordem proposta

1. **P0 — medir no aparelho e reduzir tráfego:** marcar interação → requisição → resposta → transformação → frame; remover recargas desnecessárias; páginas pequenas; DTO de lista/mapa. Registrar aparelho, modo do build, rede e filtros.
2. **P0 — atacar busca/contagem:** benchmark isolado de trigramas e protocolo exato, revisar contagem por página e comparar planos antes/depois.
3. **P1 — cache e agregados:** LRU limitado, invalidação por revisão, coalescência, metadados HTTP, simplificação do panorama e compressão medida.
4. **P1 — paginação por cursor e índices compostos:** validar continuidade, ausência de duplicatas, publicação nova e alteração dos filtros.
5. **P2 — escalar apenas com evidência:** Redis, materialized views, PostGIS, tiles/clusters de servidor ou mecanismo externo de busca.

Aceite: mesma correção de dados, menos bytes/consultas por interação e menor latência/disputa de CPU medidos no mesmo cenário. Não definir um ganho percentual ou garantir fim dos travamentos antes desse comparativo. Cinco leituras locais não estimam P95, carga simultânea, rede Wi-Fi/USB ou FPS no Android.
