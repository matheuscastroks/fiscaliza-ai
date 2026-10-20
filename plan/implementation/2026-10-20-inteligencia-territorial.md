# Inteligência territorial — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Plano aprovado; execução inline, tarefa por tarefa, autorizada pelo usuário.

**Goal:** Permitir explorar equipamentos públicos e chamados do 1746 por bairro do Rio, com origem, datas e cobertura verificáveis.

**Architecture:** Adaptadores no backend importam fontes oficiais para PostgreSQL. Publicação por camada preserva o último snapshot válido; Fastify fornece contratos comuns ao mapa e à página de bairro no Expo. A fundação de sincronização antecede as novas fontes.

**Tech Stack:** Expo 57, React Native 0.86, Expo Router, TanStack Query, Zustand, Fastify 5, PostgreSQL, Drizzle, Node test runner e TypeScript. Reutilizar o mapa Leaflet/WebView atual, sem trocar o motor.

**Spec:** [Especificação aprovada](../specs/2026-10-20-inteligencia-territorial-design.md). Base deste plano: `5a3b7d2`.

## Global Constraints

- “Manter `official_calls` exclusivamente para a Central 1746.”
- “Preservar a identidade visual e a navegação existentes.”
- “Não implementar neste ciclo IPS, obras, transporte em tempo real, meteorologia, notificações de risco ou respostas por IA.”
- “O app consulta apenas a API local. Nenhuma sincronização pública implícita ao abrir a Home.”
- “Falha ou contagem inesperada preserva a versão anterior.”
- “Filtros inválidos retornam 400; vazio válido retorna 200; fonte indisponível nunca vira contagem zero de equipamentos.”
- “Sem fotos genéricas que sugiram retratar a unidade real.”
- “Não alegar validação nativa baseada em exportação.”
- npm e locks existentes; nenhuma migração já aplicada será editada. Não executar seed, cleanup ou sincronização no banco do usuário. Testes de escrita usam banco dedicado e identificado.
- Sem credenciais Google no CI; sem jobs BigQuery faturados nesta validação. Publicação de cadastros individuais exige evidência das condições de uso, não somente acesso HTTP público.

## Review Focus

1. Execução interrompida no limite ou após algumas partições: cobertura permanece parcial/desconhecida e não anuncia todo o período como completo (tarefas 2 e 8).
2. Bairro com códigos/nome diferentes ou ponto na divisa: vínculo não resolvido aparece como tal, sem atribuição aproximada silenciosa (tarefas 4 e 5).
3. Erro HTTP 200 do ArcGIS, lote vazio inesperado ou perda de conectividade: snapshot anterior permanece acessível com sua data (tarefa 5).
4. Troca rápida de bairro, conta ou filtros com respostas fora de ordem: nenhum resultado antigo é atribuído ao novo território (tarefas 7 e 8).
5. Categoria desabilitada, paginação ou erro em uma camada: mapa/lista mantêm as demais e indicam a cobertura de cada uma (tarefa 7).

## Sequência e dependências

Bloco A: tarefas 1–2, confiabilidade existente. Bloco B: tarefas 3–6, fonte → persistência → API. Bloco C: tarefas 7–9, experiência e verificação. Cada tarefa termina em commit independente; não comitar testes falhando. Dependências: 4 depende de 3; 5 depende de 2 e 4; 6 depende de 5; 7–8 dependem de 6 e se integram sequencialmente. Tarefa 3 pode terminar com achados negativos: nesse caso, não publicar a camada afetada nem inventar dados para concluir o bloco.

## Tarefa 1 — Seed de instalação preserva dados existentes

**Arquivos:** modificar `backend/src/seed.ts`; criar `backend/src/seed-base.ts`, `backend/test/seed-base.test.ts`. Não alterar `seed-data.ts`, que serve aos cenários de testes/apresentação, nesta tarefa.

**Interfaces:** produzir `seedBase(db: Database, municipality: Municipality, passwordHash: string): Promise<void>`; importar `Municipality` de `shared/contracts.ts`. O wrapper CLI resolve município/senha e fecha o pool, a função não abre conexão nem consulta serviços externos.

- [x] Escrever teste `base seed is idempotent and preserves edited accounts and civic records`: criar conta `citizen-ana` com nome/e-mail/município alterados e registro; executar `seedBase` duas vezes; comparar todos os campos anteriores, senha, contagens de registros e chamados; verificar criação das contas ausentes uma única vez.
- [x] Executar `npm run build --prefix backend` e, com diretório de trabalho `backend`, `node --test dist/backend/test/seed-base.test.js`; antes da implementação esperar falha por função ausente. Usar `DATABASE_URL` de banco de teste, nunca ambiente local herdado sem identificação. Os testes focais seguintes também rodam com cwd `backend`, pois migrações usam caminhos relativos.
- [x] Extrair criação não destrutiva para `seed-base.ts`, remover o UPDATE incondicional do CLI e manter a exigência de senha explícita em produção. Testar também conflito de e-mail sem sobrescrever seu proprietário.
- [x] Reexecutar teste e `npm run typecheck --prefix backend`; esperar aprovação sem perda de dados. Comitar `fix(seed): preservar contas e registros existentes` apenas com arquivos da tarefa.

## Tarefa 2 — Sincronização 1746 delimitada e auditável

**Arquivos:** modificar `backend/src/integrations/rio1746/{sync,importer,client}.ts`, `backend/src/{official-calls,sync-cli,schema,app}.ts`, `services/officialCalls.ts`, `shared/contracts.ts`, `.github/workflows/validate.yml`, templates de ambiente existentes e README da integração. Criar `backend/src/integrations/{sync-lock,sync-budget}.ts`, `backend/migrations/0007_sync_runs.sql`, `backend/test/sync-safety.test.ts`.

**Interfaces:** `withSourceLock<T>(pool: pg.Pool, sourceId: string, run: () => Promise<T>): Promise<T>` usa conexão dedicada e advisory lock por fonte, libera em finally e retorna conflito 409 quando ocupado. API e CLI chamam o mesmo coordenador; passar o pool existente explicitamente. Criar `SyncCoverage = 'complete' | 'partial' | 'unknown'` e `SyncRunSummary` com id, sourceId, status (`running|success|partial|failed`), requestedStart/End, startedAt/finishedAt, counters e coverage. Tabela `source_sync_runs` persiste tentativas; `sync_checkpoints` mantém compatibilidade e o último sucesso real.

`SyncBudget` mantém `remainingBytes: bigint`; teto padrão por execução 500000000 bytes e por query no máximo 500000000 bytes, configurável no servidor por `RIO1746_MAX_RUN_BYTES`, inteiro positivo. Compartilhar o mesmo orçamento entre todas as páginas/partições, sem reset a cada dia. Adaptador BigQuery devolve linhas e bytes faturados por job; verificar tipos instalados do SDK antes de implementá-lo.

- [x] Escrever testes `sync rejects anonymous citizen and staff before upstream access`, `API and CLI contend for the same source lock`, `lock releases after failure`, `record cap cannot publish complete coverage`, `range budget is shared across pages and dates` e `failed later partition preserves earlier publication coverage`. Asserções: 401/403 sem chamada upstream; segunda execução 409; limite e falha jamais produzem cobertura completa.
- [x] Rodar build e teste focal como na tarefa 1; esperar falhas comportamentais nas garantias novas. Reutilizar os testes existentes de `rio1746.test.ts`.
- [x] Criar journal de execuções e coordenador comum; manter assinaturas públicas atuais ou atualizar API/CLI juntas. Validar corpo da sync (data única OU intervalo completo), sem cair silenciosamente na data padrão. Não expor mensagens internas no GET público de status; harmonizar seus campos hoje divergentes de `SyncStatusResult`.
- [x] No adaptador, realizar dry run da consulta parametrizada antes do job pago; se estimativa exceder saldo, encerrar como parcial. Fixar `maximumBytesBilled` no saldo, deduzir faturamento real e, se ele não puder ser confirmado, reservar todo o teto atribuído ao job. Execução sequencial não pode gastar além do orçamento. Testes substituem o adaptador, sem Google real.
- [x] Registrar término por partição; cap exato sem prova de esgotamento permanece parcial. Contadores de upsert não provam completude. Remover avanço indevido do checkpoint; persistir data solicitada, cobertura importada e último sucesso separadamente.
- [x] Rodar migrações e testes no PostgreSQL dedicado. No CI, exigir banco nos testes de integração, acrescentar `npm run typecheck --prefix backend` explicitamente e manter o encadeamento de release já existente. Comitar `fix(sync): delimitar execucoes e registrar cobertura real`.

## Tarefa 3 — Evidências e contrato das quatro camadas

**Arquivos:** criar `backend/src/integrations/siurb/{catalog,probe}.ts`, `backend/test/siurb-catalog.test.ts`, `plan/evidence/20-siurb-fontes.md`; adicionar comando `probe:siurb` ao `backend/package.json`. Não alterar o lock se não houver dependências novas.

**Interfaces:** `SiurbLayerId = 1 | 2 | 16 | 18`; `SiurbLayerSpec` declara URL fixa, campos permitidos, OID, categoria, geometria e condição de publicação. `probeSiurbLayer(layerId: SiurbLayerId, fetcher: typeof fetch): Promise<LayerProbe>` faz somente leituras delimitadas de metadados, count, IDs e amostra.

- [x] Testar `catalog rejects arbitrary upstream URLs`, `health reads declared objectid_1`, `plazas retain polygon geometry` e `missing update date remains unknown`. URLs e layer IDs aceitos vêm exclusivamente do catálogo; referência espacial esperada na saída é 4326.
- [x] Implementar probe com timeout 15 s, no máximo uma amostra de 5 features por camada, sem importar ao banco. Validar ArcGIS error em HTTP 200. Executar testes sem upstream e registrar resultado esperado PASS.
- [x] Executar o probe contra a fonte oficial, se acessível, registrar data, URLs, contagens observadas, OIDs, campos/domínios, flags de paginação, IDs estáveis disponíveis, datas declaradas e evidência de uso/atribuição. Amostra pública não comprova extração integral. Se bloqueado, registrar bloqueio; não afirmar validação operacional.
- [x] Escolher identificador externo estável a partir da evidência: GlobalID quando presente e único, senão OID com estabilidade desconhecida registrada. Anotar a correspondência comprovada entre códigos de bairro ArcGIS e BigQuery; divergências ficam não resolvidas. Comitar `docs(siurb): registrar contratos e evidencias das camadas` com probe e testes.

## Tarefa 4 — Modelo territorial e contratos compartilhados

**Arquivos:** criar `backend/migrations/0009_territorial_sources.sql`, `shared/public-data.ts`, `backend/src/territorial-schema.ts`, `backend/test/territorial-schema.test.ts`; modificar `backend/src/schema.ts` (reexport), `shared/contracts.ts` (reexport). Consumir `source_sync_runs` da tarefa 2, sem criar outro journal.

**Interfaces públicas em `shared/public-data.ts`:**

```ts
type FacilityCategory = 'school' | 'health' | 'square';
type PublicationState = 'available' | 'stale' | 'unavailable' | 'restricted';
interface SourceCoverage {
  sourceId: string; state: PublicationState; coverage: SyncCoverage;
  referenceDate: string | null; publishedAt: string | null;
}
interface PublicSource extends SourceCoverage {
  name: string; provider: string; officialUrl: string; attribution: string | null;
  usage: 'individual' | 'aggregate' | 'unknown'; sourceUpdatedAt: string | null;
}
interface NeighborhoodSummary { id: string; municipalityId: string; name: string }
interface PublicFacility {
  id: string; externalId: string; sourceId: string; category: FacilityCategory;
  name: string; address: string | null; phone: string | null;
  openingHours: string | null; activity: string | null;
  neighborhoodId: string | null; neighborhoodName: string | null;
  location: { latitude: number; longitude: number } | null;
  geometry: TerritorialGeometry | null; provenance: PublicSource;
}
```

Definir `TerritorialGeometry` como GeoJSON Point/Polygon/MultiPolygon com coordenadas numéricas, sem biblioteca nova só de tipos. `NeighborhoodBoundary extends NeighborhoodSummary` acrescenta geometria poligonal e proveniência. `SyncCoverage` vem da tarefa 2, sem redefinição.

- [x] Testar `migration preserves existing calls and users`, `facility source and external ID are unique`, `unresolved neighborhood stays null` e `source usage defaults to unknown`. Aplicar migrações duas vezes no banco dedicado; esperar idempotência via journal, sem modificar SQL antigo.
- [x] Implementar tabelas `data_sources`, `public_facilities`, `territorial_boundaries` e `territorial_boundary_aliases` (origem/código externo único → bairro canônico); IDs canônicos do tipo `rio-neighborhood:<codigo-validado>`, sem equivalência numérica implícita. Fontes usam IDs `siurb-schools`, `siurb-health`, `siurb-squares`, `siurb-neighborhoods` e `rio1746`.
- [x] Geometria JSONB; índices por fonte/ID externo, categoria/bairro, coordenadas do ponto exibido e status de publicação. Sem PostGIS. Registros brutos de staging não são contratos públicos.
- [x] Rodar testes focais e tipos app/backend. Esperar PASS e nenhuma modificação em `official_calls`. Comitar `feat(data): modelar fontes e equipamentos territoriais`.

## Tarefa 5 — Importação recuperável do SIURB

**Arquivos:** criar `backend/src/integrations/siurb/{client,mapper,geometry,repository,sync}.ts`, `backend/src/siurb-cli.ts`, `backend/test/siurb-sync.test.ts`, `backend/test/fixtures/siurb/` (JSON mínimos); modificar `backend/package.json` para `sync:siurb`. Reutilizar catálogo e lock das tarefas 2–3.

**Interfaces:** `readLayerSnapshot(layer: SiurbLayerSpec, fetcher: typeof fetch): Promise<LayerSnapshot>` retorna metadados, IDs esperados e features; `mapSiurbFeature(layer: SiurbLayerSpec, feature: unknown): MappingResult` devolve `valid` ou `rejected` com razão; `syncSiurbLayer(pool: pg.Pool, db: Database, layerId: SiurbLayerId, fetcher: typeof fetch): Promise<SyncRunSummary>`. `LayerSnapshot`/`MappingResult` são internos ao adaptador e definidos em `catalog.ts`/`mapper.ts`.

- [x] Com servidor HTTP local controlado, escrever testes de HTTP 200 com error, timeout, IDs duplicados/ausentes, erro no último lote, contagem zero inesperada, exclusão após snapshot completo, reexecução idempotente, geometria com buraco, ponto na divisa, coordenada inválida e códigos de bairros conflitantes. Esperar: falha preserva publicação anterior; categorias válidas não dependem de campos inventados; rejeições são contadas.
- [x] Implementar leitura com `outSR=4326`, allowlist de campos e IDs em lotes de até 500; teto de 50.000 features/100 lotes por camada, timeout 15 s por request e 5 min por execução. Abortar em teto excedido; não publicar parcial como snapshot completo. Conferir parâmetros suportados no probe antes de usar.
- [x] Importar limites antes dos equipamentos. Resolver bairro por alias comprovado; fallback espacial apenas com geometria validada e resultado único. Divisa ambígua fica não resolvida. Praças preservam Polygon/MultiPolygon e usam ponto interno validado para marcador; se não houver ponto válido, manter cadastro sem marcador.
- [x] Acumular staging isolado pelo run, reconciliar IDs e rejeições e publicar em transação apenas snapshot completo, sem erros estruturais ou queda inesperada a zero. Falha guarda erro sanitizado e contagens; não substitui dados. Cadastro com uso desconhecido pode ficar privado no staging, nunca público.
- [x] Rodar testes e tipos backend, sem escrita no banco do usuário. Comitar `feat(siurb): importar camadas com publicacao recuperavel`.

## Tarefa 6 — API pública com cobertura explícita

**Arquivos:** criar `backend/src/{public-data,neighborhood-overview}.ts`, `backend/test/public-data.test.ts`; modificar `backend/src/{app,official-calls}.ts`, `shared/public-data.ts`, `backend/openapi.json`. `openapi.ts` existente gera o artefato; schemas das rotas precisam estar registrados, não apenas tipos TS.

**Interfaces:** `registerPublicDataRoutes(app: FastifyInstance, db: Database): void`; `FacilitiesQuery` com categories, neighborhoodId, search, page, limit e bbox; `FacilitiesPage = { items: PublicFacility[]; total: number | null; page: number; limit: number; hasMore: boolean; sources: SourceCoverage[] }`. Limite padrão 100, máximo 500, página inteira >=1; search máximo 120 caracteres; bbox completa, finita e ordenada nos intervalos geográficos, senão 400.

- [ ] Testar leituras sem login, filtro inválido 400, item restrito 404, categoria sem publicação `unavailable` com total desconhecido (não zero), total conhecido zero em fonte válida, paginação estável e separação de erros internos. Nunca retornar mensagem upstream, tokens ou e-mail não previsto no contrato público.
- [ ] Implementar GET `/api/data-sources`, `/api/public-facilities`, `/api/public-facilities/:id`, `/api/territorial-boundaries` (lista sem geometria), `/api/territorial-boundaries/:id` (detalhe), `/api/neighborhoods/:id/overview`. Declarar `FacilitiesPage.total` como `number | null` para ausência de publicação; `items` sempre lista. Público só lê fontes com uso individual comprovado; uso agregado só permite resumos autorizados.
- [ ] Extrair a consulta de agregação 1746 de sua rota para serviço reutilizável em `neighborhood-overview.ts`; manter respostas atuais compatíveis. Novo `NeighborhoodOverview` contém bairro, `facilityCounts` por categoria (`number|null`), fontes e `calls: { total: number|null; topServices: {type:string;count:number}[]; requestedStart:string; requestedEnd:string; availableStart:string|null; availableEnd:string|null; coverage:SyncCoverage }`. Datas explícitas startDate/endDate na nova rota, sem “últimos 30 dias” ancorado silenciosamente na data máxima importada.
- [ ] Contar pela identidade canônica/aliases; vínculos ambíguos não entram no bairro. Testar que lista e resumo usam o mesmo escopo e que cap de importação aparece como parcial. Expor intervalo conhecido sem inventar lacunas completas a partir de MIN/MAX.
- [ ] Rodar testes com PostgreSQL dedicado, `npm run openapi --prefix backend` e tipos. Conferir que OpenAPI contém as seis rotas e schemas. Comitar `feat(api): expor equipamentos e panorama por bairro`.

## Tarefa 7 — Mapa e lista com múltiplas camadas

**Arquivos:** criar `services/publicData.ts`, `features/territory/{usePublicData,selectors}.ts`, `components/territory/{LayerPicker,FacilityRow,FacilityDetails}.tsx`, `demo/territorial-selection.test.ts`; modificar `app/(tabs)/TerritoryScreen.tsx`, `components/ui/OsmMapView.tsx`, `components/territory/TerritoryPreviewCard.tsx`, `stores/territoryStore.ts`, `features/city/NeighborhoodPicker.tsx`. Usar `DetailSheet.tsx` existente nos detalhes.

**Interfaces:** serviços `fetchPublicFacilities(params: FacilitiesQuery): Promise<FacilitiesPage>`, `fetchPublicFacility(id: string): Promise<PublicFacility>`, `fetchNeighborhoods(): Promise<NeighborhoodSummary[]>`, `fetchNeighborhoodBoundary(id: string): Promise<NeighborhoodBoundary>`; hooks `usePublicFacilities(params, enabled)` e `usePublicFacility(id)`. `TerritoryLayer = 'official' | FacilityCategory`; store guarda camadas selecionadas e bairro canônico, preserva rótulo de bairro para compatibilidade dos consumidores atuais.

- [ ] Testar seletores `official filters never remove facilities`, `selected layers determine map and list entries`, `partial page exposes displayed versus known total` e `switching neighborhood clears incompatible selection`. Executar `npm test` antes/depois; não criar testes que só procuram strings em JSX.
- [ ] Integrar queries com chaves por município, bairro, camadas, busca, bbox e página; fontes públicas não dependem de login. Cancelar ou ignorar resposta obsoleta; filtros de serviço/situação/período só afetam chamados. Manter “Todo o município” inicialmente e bairro do CEP na sequência, sem inferir código de bairro pelo CEP.
- [ ] Seletor horizontal combina camadas; padrão inicial mantém chamados para continuidade. Escolas/saúde/praças usam ícones próprios e detalhe sem ações de atendimento. Ícones/seleção legíveis em claro/escuro, hit targets >=44 e rótulos acessíveis. Reutilizar componentes Expo existentes; consultar skills expo-ui/native-ui/data-fetching na execução.
- [ ] Estender `MarkerKind` e o protocolo JSON do mapa para categoria e limites GeoJSON; renderizar shapes sem interpolar texto cadastral em HTML. Testar escape de nome com markup. Marcadores exibem ponto interno de praça; polígono preservado no detalhe. Preservar clustering, raio visual, busca na área e bordas arredondadas.
- [ ] Cada camada tem loading/erro/retry e fonte/período próprios; mostrar contagem exibida e total ou desconhecido. “Carregar mais” pagina por camada sem reiniciar as demais. Detalhe abre drawer com dados reais, sem imagem fictícia. Rodar tipos/lint e inspeção web mobile/desktop; comitar `feat(territorio): explorar equipamentos em camadas`.

## Tarefa 8 — Página de bairro com evidências

**Arquivos:** criar `app/NeighborhoodScreen.tsx`, `features/territory/{NeighborhoodOverview,Provenance}.tsx`; modificar `services/publicData.ts`, `features/territory/usePublicData.ts`, `app/_layout.tsx`, `app/(tabs)/index.tsx`, `demo/territorial-selection.test.ts`.

**Interfaces:** `fetchNeighborhoodOverview(id: string, dates: { startDate: string; endDate: string }): Promise<NeighborhoodOverview>`; `useNeighborhoodOverview(id, dates)`. Rota `/NeighborhoodScreen?neighborhoodId=...` com ID canônico validado; links para Território preservam bairro, categoria e datas.

- [ ] Testar seletores de apresentação: `unknown facility count is not zero`, `historical range is explicit`, `partial source never produces complete neighborhood claim` e `links preserve the evidence scope`. Bairro inexistente tem recuperação para seleção, sem crash ou fallback silencioso.
- [ ] Compor equipamentos por categoria, tipos de demandas e período visível; mostrar intervalo solicitado e disponível quando divergem, fonte e publicação. Dados antigos não viram “agora”; chamadas sem coordenadas continuam nas contagens com cobertura de mapa informada. Não criar score de qualidade de vida ou causalidade.
- [ ] Oferecer entrada na Home após escolher bairro e na exploração territorial. Enquanto “Todo o município” estiver ativo, oferecer escolher bairro; não escolher um bairro arbitrário. Detalhe e Home suportam pull-to-refresh como os fluxos atuais.
- [ ] Inspecionar respostas atrasadas após trocar bairro/conta, duas fontes indisponíveis e nenhuma escola no snapshot. Validar UI sem overflow em 320 px e desktop, fonte ampliada e leitor de tela; rodar testes/tipos e comitar `feat(bairro): conectar servicos e demandas com evidencias`.

## Tarefa 9 — Produto, CI e entrega verificada

**Arquivos:** modificar `PRODUCT.md`, `README.md`, `DESIGN.md` apenas nos padrões novos, `features/onboarding/OnboardingFlow.tsx`, `app/{AboutScreen,HelpScreen}.tsx` e `.github/workflows/validate.yml` quando exigido pelos checks novos. Criar `plan/evidence/21-inteligencia-territorial-validacao.md`. Preservar `AGENTS.md`.

- [ ] Atualizar posicionamento e onboarding com o escopo efetivamente entregue, creditar fontes e explicar a independência do app; sem prometer abertura de chamado 1746, integração municipal operacional ou IA ainda ausente.
- [ ] Executar `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run typecheck --prefix backend`, migrações e `npm test --prefix backend` em banco dedicado. Registrar skips separadamente; integração com banco pulada não conta como aprovação. CI não chama SIURB/Google para funcionar.
- [ ] Executar `npm run openapi --prefix backend` e `npx expo export --platform web --output-dir .validation/territorial-web --max-workers 2`; validar configuração Docker existente sem alterar deploy para fontes não publicadas. Não rodar publicação/importação real como efeito colateral do build.
- [ ] Inspecionar web 390×844 e 1440×1000 em claro/escuro: fonte ausente, fonte antiga, todas as camadas, clusters, detalhe, mapa/lista e ida/volta bairro. Validar também teclado, rolagem e atualização. Dados de teste controlados são evidência de UI, não de fonte real.
- [ ] Testar no dispositivo Android/Expo Go mapa, drawer, gesto e atualização quando houver acesso ao aparelho; se não houver, registrar pendência concreta. Registrar HTTP/probe separado de extração integral, CI remoto separado de checks locais e limites de redistribuição por camada.
- [ ] Conferir diff, segredos e arquivos gerados; comitar `docs: registrar entrega e validacao territorial`. Enviar commits autorizados sem force push; verificar CI remoto se disponível. Não declarar implantação na VPS sem evidência.

## Revisão do plano

Cobertura: tarefas 1–2 atendem fundação; 3 valida upstream/uso; 4–5 cobrem persistência e recuperação; 6 fixa contratos e equivalência de filtros; 7–8 entregam experiência; 9 registra validação e limites. As cinco condições de Review Focus têm testes ou inspeções atribuídos. Metadados conhecidos não são tratados como extração completa. Nenhuma tarefa exige substituir a aplicação ou remodelar suas abas.

Plano revisado quanto a dependências, nomes públicos, migrações aditivas e distinção entre implementação, publicação de dados e validação nativa. Todas as tarefas permanecem pendentes até a execução.
