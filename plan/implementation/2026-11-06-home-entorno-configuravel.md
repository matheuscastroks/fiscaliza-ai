# Home territorial e entorno configurável — plano de implementação

Implementação autorizada em 06/11/2026. Código e validações estão registrados nas [evidências de execução](../evidence/2026-11-06-home-entorno-configuravel.md); este roteiro conserva os passos originais e os commits sugeridos, sem implicar que houve commit ou publicação.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Delegação somente se autorizada pelo usuário ou pelas instruções aplicáveis.

**Goal:** Permitir descobrir chamados 1746 a uma distância configurável da localização atual ou de lugares salvos, mantendo o mesmo recorte entre Home, mapa e lista.

**Architecture:** A API filtra por distância antes da paginação e resolve bairro por polígono. Um modelo único representa o recorte no app; localização transitória e lugares persistidos têm responsabilidades separadas. A Home compõe seletores, lista curta, salvos e atendimento oficial.

**Tech Stack:** Expo 57, React Native, Expo Router, expo-location já instalado, Mapbox existente, Zustand, AsyncStorage, TanStack Query, Fastify, Drizzle e PostgreSQL sem exigência de PostGIS. npm e lockfiles independentes em front/ e back/.

**Spec:** [Home e entorno configurável](../specs/2026-11-06-home-entorno-configuravel.md). Implementação autorizada pelo usuário; resultados e limites de validação estão nas evidências de execução.

## Global Constraints

- Raios propostos: 500 m, 1 km, 2 km e 5 km; padrão de 1 km para um novo lugar/localização.
- O raio pode atravessar bairros; o nome do bairro do centro é informativo e não vira filtro adicional.
- Distância é geográfica em linha reta, aproximada, não distância de caminhada.
- Não ampliar raio, trocar bairro ou relaxar filtros automaticamente quando não houver resultado.
- Dados ficam no aparelho, sem sincronização. Usar chave por usuário anônimo/autenticado e município IBGE, sem misturar escopos.
- Salvar só confirma após AsyncStorage concluir. Falha conserva formulário e informa nova tentativa.
- Pedir localização apenas em primeiro plano e por ação explícita. Não criar rastreamento contínuo.
- Não há provedor de geocodificação contratado no fluxo atual. Autocomplete e conversão automática de endereço/CEP em ponto ficam fora desta entrega, não são simulados.
- Preservar PRODUCT.md, front/DESIGN.md, contratos de leitura pública e identidade visual. Não instalar dependências nem mudar SDK para executar este plano sem necessidade demonstrada.
- Evidência de código, web e dispositivo nativo são separadas. Testes de banco ignorados sem DATABASE_URL não contam como validação de integração.

## Review Focus

- Posição aproximada ou captura antiga: precisão/horário explícitos, nova captura após reinício, sem permissão automática (tarefa 4).
- Usuário troca lugar durante uma resposta ou gravação: resposta antiga não altera seleção nem dados do novo escopo (tarefas 3 e 5).
- Bairro ausente, ambíguo ou raio cruzando fronteira: não restringir indevidamente os resultados (tarefas 1 e 2).
- Lista e mapa divergentes ou centro alterado ao arrastar: preservar consulta e seleção, trocar para bbox somente por ação explícita (tarefa 6).
- Mapa indisponível, fonte ampliada ou leitor de tela: continuar por bairro e permitir confirmação de ponto por coordenadas (tarefas 5 e 7).

## Contexto verificado e mapa de arquivos

A Home atual (`front/app/(tabs)/index.tsx`) consulta até 30 chamados não encerrados e os agrupa em carrosséis por tema. `TerritoryScreen.tsx` possui localização que somente recentraliza a câmera, filtros locais e bbox. `territoryStore.ts` conserva bairro preferido, mas não lugares. `OfficialCallsQueryParams` não tem raio; `back/src/official-calls.ts` aplica bbox e pagina por abertura/protocolo. `callCursorScope` já inclui automaticamente novos parâmetros de filtro. Polígonos municipais e de bairros são JSON, com utilitários existentes; não foi encontrada dependência de PostGIS.

Arquivos novos ficam organizados em `front/features/places/` (modelo, controles, seleção e localização), `front/features/home/` (composição da Home), `front/stores/placesStore.ts` (persistência), `back/src/official-call-radius.ts` (SQL/distância) e `back/src/territory-location.ts` (resolução). Não transformar TerritoryScreen em repositório de regras de localização.

Antes da execução, ler novamente AGENTS.md aplicáveis; front/AGENTS.md; expo-overview; expo-ui e expo-native-ui para controles, expo-data-fetching para integração. Conferir estado do checkout e preservar alterações existentes. Seguir os comandos de teste reais abaixo; novos testes CJS usam o harness de transpile/mocks dos testes existentes quando necessário, sem adicionar uma suíte de framework inteira.

### Tarefa 1 — Contrato e consulta circular na API

**Arquivos:** modificar `shared/contracts.ts`, `back/src/official-calls.ts`; criar `back/src/official-call-radius.ts`, `back/test/official-call-radius.test.ts`; ampliar `back/test/official-call-pagination.test.ts`.

**Interfaces:** acrescentar `centerLatitude?: number`, `centerLongitude?: number`, `radiusMeters?: number` a OfficialCallsQueryParams. Produzir `parseRadiusFilter(query: Record<string, string | undefined>): RadiusFilter | undefined`, com RadiusFilter contendo os três campos obrigatórios, e `officialRadiusCondition(filter: RadiusFilter): SQL`.

- [ ] Escrever testes para trio ausente, completo, parcial, string vazia, NaN, Infinity, texto com sufixo, limites lat/lng e raios 500/1000/2000/5000. Rejeitar outros raios e combinação com bairro/bbox com 400.
- [ ] Executar `npm test --prefix back`; confirmar falhas nas novas expectativas antes da implementação. Usar banco local de teste descrito no README para casos SQL; nunca base de produção.
- [ ] Implementar parser estrito, bbox prévia e Haversine SQL limitado a [0,1], raio terrestre 6371000 e comparação inclusiva. Aplicar a mesma condição ao COUNT e SELECT, preservando a ordenação e cursor atuais. Validar centro pelo polígono municipal: 422 fora, 503 indisponível. Consulta sem raio conserva comportamento atual.
- [ ] Criar fixtures com centro no Rio, ponto interno, externo, canto de bbox fora do círculo, fronteira do raio e coordenada ausente; inserir mais elegíveis que o limite de página. Verificar total, páginas sem perda/duplicação, exclusão do canto e dos nulos, inclusão de pontos em bairros vizinhos e rejeição de cursor com centro/raio diferente. Testar SQL contra distância de referência com tolerância de 1 m, sem usar arredondamento na seleção.
- [ ] Executar `npm test --prefix back` e `npm run typecheck --prefix back`; registrar número de testes de banco executados e ignorados. Capturar EXPLAIN ANALYZE para os quatro raios em base de teste representativa, sem registrar ponto residencial. Se a consulta exigir índice, incluir migração usando a próxima numeração livre e atualizar schema no mesmo commit; decidir pelo plano SQL medido, sem pressupor aceleração por índice composto.
- [ ] Commit sugerido: `feat(api): consultar chamados por raio`.

### Tarefa 2 — Resolver município e bairro pelo ponto

**Arquivos:** criar `back/src/territory-location.ts`, `back/test/territory-location.test.ts`; modificar `back/src/public-data.ts`, `back/src/public-data-schemas.ts`, `back/src/public-data-repository.ts`, `shared/public-data.ts`.

**Interfaces:** contrato `TerritoryLocationResolution = { municipalityId: string; insideMunicipality: boolean; neighborhood: { id: string; name: string } | null }`. Produzir GET `/api/territory/resolve` com latitude e longitude obrigatórias e retorno ApiResult<TerritoryLocationResolution>. Função `resolveTerritoryLocation(db: Database, point: { latitude: number; longitude: number }): Promise<TerritoryLocationResolution>`.

- [ ] Escrever testes de entrada inválida/ausente (400), ponto fora (200/insideMunicipality=false), bairro único, vazio, fronteira ambígua, buraco de polígono e fonte municipal ausente (503). Usar fixtures territoriais, sem requisições externas.
- [ ] Executar `npm test --prefix back` e confirmar falhas esperadas.
- [ ] Implementar resolução no município fixado pela API, reutilizando `containsPoint` de `back/src/municipality.ts` e limites publicados. Filtrar bairros por bbox antes de ler/testar geometrias quando possível; múltiplas correspondências retornam null. Não selecionar bairro por texto e não atribuir bairro se ponto externo.
- [ ] Registrar rota pública e schema OpenAPI em `public-data.ts`/`public-data-schemas.ts`. Reutilizar os padrões de envelope e leitura consistente existentes. Não criar endpoint de gravação de endereços.
- [ ] Executar `npm test --prefix back` e `npm run typecheck --prefix back`; conferir que regressões de `public-data.test.ts` permanecem verdes.
- [ ] Commit sugerido: `feat(api): identificar bairro pela localização`.

### Tarefa 3 — Modelo único de recorte e persistência de lugares

**Arquivos:** criar `front/features/places/types.ts`, `front/features/places/selection.ts`, `front/stores/placesStore.ts`, `front/tests/places-selection.test.ts`, `front/tests/places-store.test.cjs`; integrar `front/stores/territoryStore.ts`.

**Interfaces:** `RadiusMeters = 500 | 1000 | 2000 | 5000`; `SavedPlace = { id: string; name: string; addressLabel: string; latitude: number; longitude: number; radiusMeters: RadiusMeters; neighborhood: { id: string; name: string } | null }`. `TerritorySelection` é união `municipality`, `neighborhood` (id/name) e `radius` (origem current/place, centro, raio e bairro informativo). Produzir `toOfficialCallsParams(selection: TerritorySelection): OfficialCallsQueryParams`, `placesStorageKey(userId: string | null, municipalityId: string): string` e store com initialize/setScope/createPlace/updatePlace/deletePlace/selectPlace/selectNeighborhood/setRadius.

- [ ] Escrever testes puros que comprovam que raio não envia bairro/bbox e bairro não envia centro/raio. Testar validade do raio e limites dos campos. Usar a união como fonte única; os seletores legados de bairro passam a ser adaptadores, sem dois estados independentes.
- [ ] Escrever testes de store com AsyncStorage controlável: isolamento anônimo/usuário/município, reinício, dados corrompidos/versionados, falha de escrita, exclusão ativa com fallback e mudança de escopo durante leitura/gravação. Uma gravação antiga pode concluir na chave antiga, mas nunca atualizar o estado do novo escopo.
- [ ] Executar `npm test --prefix front`, confirmar falha, implementar e reexecutar até passar. Serializar gravações por escopo, capturar chave/versão do escopo antes de operações assíncronas e publicar sucesso só após persistência.
- [ ] Persistir lugares, seleção de lugar/bairro e preferência de raio da localização atual em chave nova `fiscaliza-ai:places:<user-or-anonymous>:<IBGE>:v1`. Importar bairro preferido legado sem apagá-lo. Não copiar a chave anônima histórica do Rio para outro município e não persistir coordenadas/horário da captura atual.
- [ ] Executar `npm run typecheck --prefix front`. Commit sugerido: `feat(app): salvar lugares e abrangência territorial`.

### Tarefa 4 — Captura de localização e resolução territorial no app

**Arquivos:** criar `front/features/places/useDeviceLocation.ts`, `front/features/places/LocationEntryPrompt.tsx`, `front/tests/device-location.test.cjs`; modificar `front/services/publicData.ts`, `front/app/(tabs)/TerritoryScreen.tsx` e revisar `front/app.json`.

**Interfaces:** `captureLocation(): Promise<{ latitude: number; longitude: number; accuracyMeters: number | null; capturedAt: number } | null>` via hook com estados idle/requesting/ready/denied/unavailable/error; `fetchTerritoryLocation(point, signal?): Promise<TerritoryLocationResolution>` no serviço. Hook limita espera a 15 s, ignora conclusão tardia após cancelamento/troca de escopo e impede solicitações simultâneas.

- [ ] Escrever testes com expo-location e relógio simulados: montagem não pede permissão; toque pede; negativa não insiste; timeout/serviço indisponível preserva seleção; resposta após desmontagem/troca de escopo é ignorada; reinício não consulta por ponto antigo.
- [ ] Executar `npm test --prefix front` para confirmar falhas e implementar serviço/hook. Reutilizar pacote instalado e permissão foreground; não adicionar background permission. Precisão maior que raio produz aviso; accuracy ausente não é apresentada como posição exata.
- [ ] Implementar prompt inicial, persistindo apenas que foi apresentado por escopo. “Agora não” mantém recorte vigente ou município; “Escolher bairro” abre seletor existente. Resolução sem bairro permite raio; ponto externo mantém seleção anterior e oferece escolha manual.
- [ ] Substituir lógica duplicada de localização de TerritoryScreen pelo hook. O botão adota o ponto somente após captura/resolução válida; atualizar posição invalida páginas do recorte anterior.
- [ ] Executar `npm test --prefix front`, `npm run typecheck --prefix front` e `npm run config:prebuild --prefix front`. Revisar texto da permissão sem gerar/commitar android/ios. Commit sugerido: `feat(app): escolher entorno pela localização do dispositivo`.

### Tarefa 5 — Seletor, raio e cadastro de lugares

**Arquivos:** criar `front/features/places/PlaceSelector.tsx`, `front/features/places/RadiusControl.tsx`, `front/features/places/PlaceEditor.tsx`, `front/app/PlacesScreen.tsx`, `front/tests/place-editor.test.cjs`; modificar `front/app/SettingsScreen.tsx` e `front/app/_layout.tsx` se o registro explícito for necessário.

**Interfaces:** controles recebem seleção/ações do store da tarefa 3. `PlaceEditor` recebe `initialPlace?: SavedPlace` e chama createPlace/updatePlace somente após validação do formulário e resolução do ponto. Raio oferece os quatro valores e modo bairro apenas quando disponível.

- [ ] Escrever testes comportamentais de nome vazio/comprimento, endereço longo, ponto ausente/inválido/externo, confirmação por mapa e por coordenadas, nome Casa sem preenchimento implícito, cancelamento sem gravação e falha de armazenamento preservando campos. Testar resposta de validação para ponto A chegando depois de B.
- [ ] Executar `npm test --prefix front` e confirmar as falhas esperadas.
- [ ] Implementar formulário com endereço/referência textual e instrução “Confirme o local no mapa”; reutilizar `MapboxMapView.onMapClick`, marcador e tema existentes. Não inventar autocomplete. Alternativa por latitude/longitude aceita números com validação e confirma o ponto pelo mesmo endpoint.
- [ ] Implementar selecionar/editar/excluir com confirmação, preferência de raio por lugar e acesso por Preferências. Seleção de lugar usa raio salvo; “Bairro inteiro” muda para o modo bairro sem apagar o raio do lugar. Cancelar editor preserva seleção anterior.
- [ ] Executar `npm test --prefix front`, `npm run typecheck --prefix front`, `npm run lint --prefix front`. Inspecionar teclado, foco/retorno, fonte ampliada, tema escuro e mapa indisponível; não esconder erros sob teclado. Commit sugerido: `feat(app): gerenciar lugares e raio de consulta`.

### Tarefa 6 — Home, filtros e continuidade no Território

**Arquivos:** modificar `front/app/(tabs)/index.tsx`, `front/app/(tabs)/TerritoryScreen.tsx`, `front/services/officialCalls.ts`, `front/features/city/useOfficialCalls.ts`, `front/components/territory/TerritoryFilterBar.tsx`; criar `front/features/home/NearbyCalls.tsx`, `front/features/places/useTerritoryFilters.ts`, `front/tests/home-nearby.test.cjs`, `front/tests/territory-radius.test.cjs`; ampliar `front/tests/official-calls-cache.test.cjs`.

**Interfaces:** `useTerritoryFilters()` centraliza seleção + busca/tipo/situação/período transitórios e expõe params derivados com toOfficialCallsParams. Padrões: tipo all, situação Não Encerrado, período all, busca vazia. Home usa limit=5; Território limit=50/paginação. Serviço serializa os três parâmetros radiais. Chaves de consulta incluem usuário/município/params e mantêm cancelamento por signal.

- [ ] Escrever testes de transporte e composição: parâmetros de raio serializados; mudança de raio/centro cria chave nova e reinicia páginas; filtros combináveis preservados na navegação; resultados antigos não aparecem sob lugar novo; erro de atualização conserva dados apenas do mesmo recorte; salvos não são filtrados pelo raio.
- [ ] Executar `npm test --prefix front` e confirmar falhas antes de alterar a composição.
- [ ] Implementar Home conforme ordem da especificação, até cinco linhas com `OfficialCallRow`, distância aproximada calculada com a mesma constante/semântica da API e dados realmente disponíveis. Se distância exigir variação da linha, adicionar prop opcional sem alterar apresentação dos salvos. Remover agrupamento/carrosséis por categoria somente da Home e corrigir “Salvos neste aparelho”.
- [ ] Mostrar situação/período ativos e data de atualização via fontes/sync existentes; usar overview apenas para referência do maior openedAt exigida pelos atalhos “30/90 dias da base”, sem exibir dashboard. Se referência falhar, não inventá-la. Tratar vazio e falha sem sugerir inexistência de chamados no 1746.
- [ ] Integrar mapa/lista ao mesmo recorte; o mapa pode mover câmera, mas não substituir centro nem acumular bbox com raio. Ação “Buscar nesta área” muda explicitamente para bbox transitória; “Voltar ao entorno” restaura seleção radial. Preservar detalhe/focusId e rotas vindas do bairro: recorte explícito da rota prevalece e precisa ser refletido no estado comum, sem filtro radial oculto.
- [ ] Testar que chamados sem ponto permanecem no modo bairro/lista; filtros radiais não vazam para contratos de equipamentos. Rotular raio como recorte 1746 quando camadas de equipamentos estiverem ativas. Não declarar que arrastar mapa altera o endereço salvo.
- [ ] Executar `npm test --prefix front`, `npm run typecheck` na raiz e `npm run lint --prefix front`. Commit sugerido: `feat(app): orientar a home pelos chamados do entorno`.

### Tarefa 7 — Validar jornadas e documentar limites reais

**Arquivos:** atualizar `PRODUCT.md`, `front/DESIGN.md`, `README.md` somente nos fluxos afetados; criar `plan/evidence/2026-11-06-home-entorno-configuravel.md` na execução. Revisar `front/.impeccable/design.json` se tokens/componentes forem alterados, sem mudar tokens por obrigação.

- [ ] Executar suíte final: `npm test --prefix back`, `npm test --prefix front`, `npm run typecheck`, `npm run lint --prefix front` e `npm run config:prebuild --prefix front`. Registrar resultados e ambiente; testes SQL precisam executar com DATABASE_URL de teste. Conferir OpenAPI com `npm run openapi --prefix back` após alteração de schemas.
- [ ] No navegador, validar primeira entrada, negativa/permissão, escolha manual, mudança 500 m → 5 km, persistência após recarregar, mapa/lista/detalhe/volta, criação/edição/exclusão de Casa, estado vazio e falha da API. Conferir consulta de rede para verificar que não há bairro+raio nem geocodificação simulada.
- [ ] Em dispositivo nativo compatível, repetir localização foreground, precisão aproximada, GPS desligado, permissão bloqueada, teclado e retorno; reinício solicita nova captura por ação. Registrar plataforma/runtime/build usado. Avaliar Expo Go se o mapa/configuração atual permitir; se depender de development build, documentar o limite e usar o runtime compatível, sem afirmar teste nativo ausente.
- [ ] Validar leitor de tela, fonte ampliada, foco web, tema escuro, toque mínimo 48 e alternativa ao mapa. Conferir que endereço digitado não sugere resolução automática e que excluir lugar ativo explica o fallback.
- [ ] Registrar evidência de código, web, nativo e medição SQL em seções separadas, incluindo indisponibilidades. Atualizar produto/design para refletir a entrega efetiva e documentação de retenção local; conferir que logs não foram acrescidos de coordenadas/endereço.
- [ ] Commit sugerido: `docs: registrar validação da home e do entorno`.

## Critério de conclusão e revisão do plano

Concluir somente com raio aplicado no servidor, navegação preservada, persistência sem falso sucesso e fluxos públicos recuperáveis. Evidência nativa pendente deve ser explicitamente registrada; testes automatizados não substituem inspeção de uso.

Autorrevisão do planejamento: especificação coberta pelas tarefas 1–7; os cinco focos de revisão possuem testes/jornadas atribuídos. Contratos de raio, resolução e seleção são definidos antes dos consumidores. Nenhuma mudança de código, instalação, migração ou validação de UI foi realizada ao escrever estes documentos.

Próximo passo: revisão dos padrões propostos (raios, 1 km inicial, período inicial completo e cadastro com ponto confirmado) e autorização de execução do plano. Execução direta na sessão é a proposta inicial; delegação depende de escolha explícita.
