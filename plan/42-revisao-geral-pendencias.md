# Revisão geral (13/11/2026) — o que foi feito e o que falta

Plano aprovado em `C:\Users\Matheus\.claude\plans\preciso-que-revise-todo-linear-rossum.md` (cópia das decisões abaixo). Evidências em `plan/evidence/2026-11-13-*`.

## Feito e integrado na `main` (sem push)
- **Fase 0, produção:** limpeza de fotos do agendador; revisita dos chamados salvos ou seguidos (a partição do 1746 é a data de abertura); caixa de saída de push; agendador decide pelo banco o que já rodou; `backup.sh` não esconde falha; pacote do release com `backup.sh`; API na porta 43001.
- **Fase 1, privacidade:** migração `0019` remove `records`, `relations`, `answers`, `demo_engagement` e `users.sector` (dump em `backups/legacy/`); token só para o app nativo (`X-Fiscaliza-Client: citizen-native`); sessão deslizante; bloqueio de login por (e-mail, IP); limite por usuário; apagar conta exige senha e limpa o aparelho; desregistro do push ao sair; foto `private, no-store`.
- **Fase 2, backend:** datas no horário do Rio; `merge` de salvos; migração `0020` (índices); validação de query e params; erros em português; `cf-ray` como id; encerramento com prazo; catálogo SIURB; contratos de salvos no `shared/`; CI exige banco.
- **Fase 3, app:** Sentry no app (`EXPO_PUBLIC_SENTRY_DSN`) e na API (`SENTRY_DSN`); `ErrorBoundary`; retry só de rede; `focusManager`/`onlineManager` (`expo-network`); cache persistido; abertura sem esperar `/auth/me`; splash curta depois da primeira vez; `useLastNotificationResponse`.
- **Fase 6, infra e docs:** Caddy removido; ignores; Postman; `plan/` arquivado; `docs/decisoes.md`; AGENTS/README/PRODUCT; Dependabot no CI; shellcheck.

## Integração da Fase 4 (concluída localmente)
- **Fase 4, interface no aparelho:** branch `refs/heads/fix/app-fase-4-interface` (worktree `.claude/worktrees/youthful-lumiere-e60a3f`), 3 commits, conferida no S22. **Integrada na main local em c53cc08; instalação, testes, tipos e lint passaram. O texto seguinte registra a previsão original de integração.** Conflito esperado em `front/package.json` e `front/package-lock.json` (a Fase 3 instalou `@sentry/react-native`, `expo-network` e os persisters; a Fase 4 instalou `expo-clipboard`): manter as dependências dos dois lados e rodar `npm install` em `front/`. Depois, `npm test`, `npm run typecheck` e `npm run lint`.

## Falta fazer
1. **Verificar no aparelho as Fases 1, 3 e 4 juntas.** Depois da junção, gerar um build de desenvolvimento novo (`npx expo run:android` em `front/`): o Sentry e o `expo-network` são módulos nativos e o APK instalado não os tem. Percorrer: abrir sem rede (cache e conta guardada), modo avião e volta (salvos pendentes sobem), apagar conta com senha, sair (sem avisos depois), erro forçado com a `ErrorBoundary` chegando ao Sentry (`EXPO_PUBLIC_SENTRY_DEV=1`).
2. **Aplicar em produção:** reconstruir a imagem da API (`docker compose --env-file .env.compose -f compose.yaml -f compose.public.yaml --profile public up -d --build api scheduler migrate`). Isso aplica as migrações `0019` e `0020`; o dump das tabelas legadas já está em `backups/legacy/participacao-20261113.dump`. Antes, rodar um backup (`BACKUP_ONCE=1`).
3. **Fase 5, estrutura e testes (em andamento; itens originais abaixo, evidências atuais ao final):**
   - `npx expo install --fix` (14 pacotes com patch atrasado; o `expo-doctor` só reclama disso) e depois o job `expo-doctor` no CI;
   - `jest`, `jest-expo` e `@types/jest` para devDependencies; remover o script `reset-project` e dependências sem uso (conferir peers);
   - `engines` e `.nvmrc` (22) no app; alinhar TypeScript (front 6.0, back 5.9);
   - React Compiler (`experiments.reactCompiler`), testado no aparelho;
   - rotas dinâmicas (`app/calls/[id].tsx` etc.) com redirect das antigas;
   - quebrar `OfficialCallDetailsScreen`, `OnboardingFlow`, `MapboxMapView` e `useTerritoryView`;
   - trocar os testes `.cjs` que leem o código-fonte (os piores são `unified-search-and-decluttered-filters`, `participate-screen-refinement`, `ux-refinements-batch2`, `profile-screen-refinement`) por Jest + RNTL de comportamento; corrigir a regex `borderw*Radius` em `tests/design-literals.test.cjs`;
   - ícone de notificação monocromático, `monochromeImage`, `androidStatusBar` compatível com edge-to-edge;
   - ESLint para `back/` e `shared/`; `.editorconfig`; `/api/health/deep` com a idade do último sync;
   - `expo-updates` (depende do `eas init`).
4. **Desvios registrados nas evidências, para decidir:** TypeBox, `fastify-plugin` e autorização por rota; unificar `/api` e `/api/v1`; fábrica de chaves de consulta; fonte única de "meu bairro"; avisos do Reanimated vindos de bibliotecas.
5. **Deploy, itens restantes:** backup antes de migrar no `deploy.sh`; poda de releases e imagens antigas; `restore.sh` com a invocação real do Compose e `DROP ... WITH (FORCE)`; cópia dos backups para fora do PC.

## Depende do dono do projeto
- Credencial do BigQuery e `GCP_PROJECT_ID` no `.env.compose`: o sync do 1746 está parado desde 08/11.
- Sentry: criar o projeto Node (`fiscaliza-api`) e pôr o DSN em `SENTRY_DSN`; gerar o `SENTRY_AUTH_TOKEN` como secret do EAS.
- `eas init` (push real e OTA); monitores no Healthchecks.io/UptimeRobot; chave antiga do Firebase; troca do `package` (adiada).
- Decidir sobre o serviço que ocupa a porta 3001 (a API ficou em 43001).
- Dar push da `main` (nada foi enviado ao GitHub).

## Continuação Codex — 13/11/2026
- Fase 4 integrada localmente na main no commit `c53cc08`, sem conflitos. `npm install --prefix front` concluído; manifest e lockfile permaneceram sem diferenças.
- `npm test` passou após a integração (incluindo 173 testes CJS e 5 testes Jest). Typecheck do app e da API e lint do app também passaram (exit code 0).
- Nenhum push, deploy, migração de produção ou sync BigQuery foi executado.
- Fase 5 ainda não implementada: a skill expo-overview exige carregar expo-upgrade para atualizar dependências, mas expo-upgrade/SKILL.md não foi encontrado em front/.agents, ~/.agents/skills, ~/.codex/skills nem no cache de plugins. Restaurar essa skill antes da atualização Expo.
- Build novo e validação conjunta no S22 continuam pendentes.

## Fase 5 — configuração inicial (Codex)
- Branch local `refactor/fase5-estrutura-testes`.
- Jest/jest-expo/@types/jest movidos para devDependencies; reset-project removido; engines do app e .nvmrc (raiz/app) definidos; CI app/automação lê .nvmrc, matriz API 22/24 preservada; .editorconfig adicionado; source.sortMembers removido.
- Validação: 31 testes de automação passaram; atualização package-lock-only concluída e comparação confirmou zero mudanças de versões de pacotes.
- expo-upgrade também não foi encontrado em ~/.claude (busca incluindo arquivos ignorados); nenhuma skill foi copiada. A falta limita a atualização Expo, não os demais itens.
- Restante da Fase 5, revisão final, build S22 e deploy continuam pendentes. Não considerar o objetivo concluído.

## Fase 5 — saúde das sincronizações (Codex)
- Adicionado GET /api/health/deep público, sem cache, com lastSuccessAt e ageSeconds por fonte (1746 e quatro camadas SIURB). Ausência de sucesso completo é null; idade não é apresentada como comprovação de cobertura dos dados.
- Consulta agrega somente execuções success. Falha no banco responde 503 sem detalhes internos no corpo.
- Evidência: teste falhou antes da implementação; três testes passaram (idade/ausência, falha sanitizada, rota pública no buildApp com banco indisponível). Typecheck backend passou.
- Pendente: validar a agregação contra Postgres de teste e incluir o endpoint na revisão final. Nenhum teste acessou produção.

## Fase 5 — lint backend/shared (Codex)
- ESLint e typescript-eslint instalados como devDependencies do backend; configuração raiz cobre back/src, back/test e shared. Comando raiz lint verifica app e API; job API executa lint, job app continua independente da instalação backend.
- Corrigidos parâmetros/imports sem uso e removidos any explícitos da entrada territorial; validação de CEP agora confere tipos string antes das regex.
- Evidência: lint backend/shared sem avisos, typecheck backend e teste de geometria municipal passaram. Suite completa com banco ainda pendente.
- Ferramentas alinhadas às versões já instaladas no app; npm informa ESLint 9 sem suporte e sete vulnerabilidades moderadas na árvore backend. Avaliação de atualização permanece pendente, sem audit fix forçado.

## Fase 5 — atualização Expo desbloqueada (Codex)
- Skill expo-upgrade recuperada de expo/skills, commit cd91460c0834e29ebb5fad92c34a690a3b207ed2; pasta, referências, licença e origem preservadas em front/.agents/skills/expo-upgrade.
- expo install --fix atualizou os 14 pacotes dentro do SDK 58. O comando encerrou com erro ao tentar editar app.config.js; plugins expo-status-bar/expo-web-browser foram adicionados manualmente conforme a mensagem. expo install --check depois confirmou dependências atualizadas.
- React Compiler habilitado. CI agora executa Expo Doctor e lint backend no job correto (correção de aplicação anterior que não havia alterado o YAML por CRLF).
- Expo Doctor: 20/20 checks, com aviso de prebuild Android ausente para Sentry. Build, testes completos após atualização e validação S22 ainda pendentes; não atribuir a este estado os testes da integração anterior.
- PostgreSQL 17 disponível em imagem local; usar contêiner separado para os próximos testes, sem tocar no serviço de produção existente.

## Fase 5 — validação após atualização (Codex, em andamento)
- npm test do app, npm run typecheck (app/API) e npm run lint (app/API/shared) concluídos com exit 0 após 2edea99; logs .validation/fase5-{app-tests,types,lint}.log.
- PostgreSQL exclusivo de teste criado: contêiner fiscaliza-fase5-test, porta 127.0.0.1:55432, banco fiscaliza_test, credenciais descartáveis validation-local-only. Não usa volume ou banco de produção.
- Suite API com banco em execução, sessão 15874; bundle Android com Compiler em execução, sessão 40084. Consultar esses handles e logs antes de reiniciar. Logs .validation/fase5-api-tests.log e fase5-bundle.log.
- Novo teste real ScreenState ainda NÃO validado: primeira execução excedeu 5s; diagnóstico com --testTimeout=30000 em execução na sessão 68344, log fase5-screen-state-diagnostic.log. Arquivo não commitado em front/tests/components/screen-state.test.tsx; investigar antes de considerar migrado.
- Bundle emitiu aviso de export interno router-store inexistente em expo-router; investigar o resultado final antes de qualquer alteração em dependências.

## Fase 5 — encerramento das validações e renderizador real
- Processos antes pendentes concluídos: API 86/86 sem skips, bundle Android exportado com Compiler; teste ScreenState passou com timeout padrão em reexecução. Não houve alteração permanente de timeout.
- Cobertura RNTL ampliada para 11 testes (3 suites): erro/retry/carregamento/conteúdo, vazio/ação, cabeçalho, toque desabilitado, alvo de toque, linhas opcionais e resumo de chamado. Todos passaram.
- Removidos ui-components.test.cjs e helpers/render.cjs, substituídos pela cobertura RNTL. Outros testes que leem fontes continuam pendentes de migração.
- Adicionado teste PostgreSQL da saúde detalhada: escolhe o sucesso mais recente e ignora falhas posteriores; 4/4 testes de saúde passaram no banco isolado. Lint completo e typecheck backend após as alterações passaram.
- Sessões 15874, 40084 e 68344 encerradas. Contêiner fiscaliza-fase5-test permanece disponível para validações seguintes.

## Deploy — backup antes de migrar (Codex)
- deploy.sh inicia apenas postgres com --no-recreate, executa backup único com BACKUP_ONCE=1 e só então sobe o conjunto de serviços (API aplica migrações na inicialização).
- Falha do backup interrompe antes de iniciar a API/migrações e não grava current-release. Primeiro deploy também passa pelo backup do banco inicializado.
- Testes comportamentais com Docker/curl/flock simulados falharam antes da correção e passaram depois; automação completa 33/33 e bash -n passaram. Nenhum comando real de deploy/backup foi executado.
- Limitação: banco e uploads são copiados em sequência, com aplicação antiga ativa; isso não constitui snapshot atômico entre banco e arquivos. Validação real do deploy continua pendente.

## Fase 5 — detalhe do chamado (primeira divisão)
- Extraídos estilos para features/city/call-details/styles.ts e seção de datas para OfficialCallDates.tsx. Tela principal preserva navegação, estado, ações e seções restantes; divisão do controlador ainda pendente.
- Teste RNTL escrito antes da extração e verificado falhando por módulo ausente; passou após extração, cobrindo ausência de diagnóstico/encerramento/SLA sem inventar conteúdo.
- Typecheck app, lint app e 15 verificações existentes relacionadas passaram. Não equivale à validação visual no S22.

## Fase 5 — rotas dinâmicas
- Criadas calls/[id], facilities/[id], neighborhoods/[id] e neighborhoods/index. Telas movidas para features; entradas antigas redirecionam preservando id/neighborhoodId e a seleção de bairro sem ID.
- Links de Salvos, resultados e território usam rotas novas; classificação pública inclui os novos caminhos. Parâmetros vazios, múltiplos, com separadores/espaços ou maiores que 200 caracteres são rejeitados antes de montar a tela.
- Tipos regenerados pelo Metro temporário (encerrado); typecheck e lint app passaram. Cinco testes RNTL dos redirects, teste de parâmetros e 17 regressões passaram.
- Regra do plano preserva redirects legados apesar da recomendação genérica da skill de remover rotas antigas. Guarda de autenticação exclusivamente Stack.Protected, navegação nativa e App Links ainda pendentes.

## Fase 5 — guardas declarativas
- RootLayout não redireciona mais por efeito de autenticação; CitizenStack declara MunicipalityScreen protegido por sessão e Login/Register disponíveis apenas sem sessão. Exploração e demais telas públicas continuam acessíveis.
- Login e cadastro mantêm seus encaminhamentos explícitos após sucesso, incluindo confirmação de município.
- Cinco testes com renderRouter real passaram: link direto anônimo/autenticado, login para visitante, login indisponível para sessão ativa e remoção da tela protegida ao sair. Typecheck e lint app passaram.
- Falha intermediária do teste de logout era import dinâmico incompatível com o modo Jest; corrigida com import estático, sem alterar configuração de runtime.
- Validação de login/cadastro/logout no aparelho continua necessária.

## Fase 5 — onboarding dividido e teste migrado
- OnboardingFlow ficou com 254 linhas, responsável pelo controle de etapas e conclusão. Conteúdo tipado em slides.ts, apresentação em OnboardingSlideView.tsx e estilos em onboardingStyles.ts.
- Testes de interação passaram antes e depois da extração: avançar, voltar, pular e concluir replay. Expectativas validam os títulos e conteúdo visíveis em cada etapa.
- Removida inspeção de código de onboarding-flow-refinement; preservada verificação de assets presentes e não vazios. Tamanho de arquivo não é tratado como prova de qualidade de imagem.
- Typecheck app, lint app, dois testes RNTL e dez regressões relacionadas passaram. Layout e leitura com fonte ampliada ainda precisam do aparelho.

## Fase 5 — Mapbox dividido
- MapboxMapView ficou com 382 linhas. Conversão GeoJSON, normalização de contorno e cálculo de zoom em features/territory/mapboxGeometry.ts; apresentação de clusters/marcadores/seleção em MapMarkerLayers.tsx.
- Exportações anteriores mantidas por compatibilidade. Testes de geometria importam o módulo puro diretamente, eliminando o carregador que simulava React e módulos nativos.
- Typecheck app, lint sem avisos e 17 testes relacionados (marcadores, contorno, câmera, cluster e gesto) passaram.
- Native loader, eventos e câmera seguem no componente principal. Verificação visual no S22 continua pendente; useTerritoryView ainda precisa ser dividido.

## Fase 5 — controlador territorial dividido
- Extraído useTerritoryEntries: lista, marcadores, detalhe selecionado, cluster selecionado, paginação por camada e disponibilidade derivam do mesmo recorte. useTerritoryView concentra callbacks, filtros e câmera (366 linhas após remoção de linhas vazias acumuladas).
- Dois testes RNTL do hook passaram: área visível exclui chamados sem ponto e inclui foco externo nos marcadores; bairro conserva registros sem coordenadas. Teste verificado falhando por módulo ausente antes da extração.
- Typecheck app, lint sem avisos e 11 regressões de mapa/gesto passaram. Proteção de geração de requisições continua no código de consultas; esta extração não altera a garantia de respostas assíncronas.
- Mais testes das consultas e de troca de recorte, além de validação no aparelho, continuam pendentes no plano completo.

## Fase 5 — TypeScript e FileSystem
- TypeScript backend alinhado em ~6.0.3 ao app, evitando versões distintas ao compilar shared.
- Upload de avatar usa File.createUploadTask/UploadType da API atual de expo-file-system; preserva multipart, cabeçalho nativo, sessão, limite de 15 segundos e mensagem do servidor. Tarefa nativa liberada no finally, inclusive em falha HTTP.
- Cópia local do perfil usa Directory/File/Paths; nenhuma importação expo-file-system/legacy permanece.
- Três testes de upload falharam antes da migração; 11 testes de transporte passaram depois. Typecheck app/API, lint app e duas regressões do perfil passaram. Validar cópia/upload/cancelamento no S22 com novo build.
- expo-linking é peer obrigatório do expo-router e foi preservado. Remoção de expo-web-browser/expo-asset ainda depende da avaliação dos usos indiretos e Expo Doctor. Permissão de galeria também permanece pendente.

## Prioridade adicionada pelo usuário — cobertura espacial do mapa
- Relato: Rio inteiro mostra total ~12,7k, mas os grupos somam apenas 27. Código confirma lista com limit 50 e marcadores derivados só das páginas carregadas; número 27 não foi reproduzido no aparelho.
- Decisão: camada espacial independente da paginação, agregada no servidor por viewport, com mesmos filtros da lista. Não aumentar limite nem baixar todos os chamados completos.
- Primeira implementação: queryOfficialMap, consulta SQL única com snapshot de contagens e grade limitada a 33x33 células; contrato shared/official-map.ts distingue total, locatedTotal, unlocatedTotal e visibleTotal. Células agregadas não expõem lista de IDs; singleton tem ID do chamado.
- Evidência: teste PostgreSQL com 610 registros sintéticos passou (600 pontos representados, 10 sem ponto, soma das células igual à cobertura, viewport externo vazio preservando total). Lint backend passou; typecheck final acompanhar antes de concluir.
- AINDA NÃO CORRIGIDO NO APP: falta rota HTTP com validação e reaproveitamento dos filtros, serviço/hook do app por viewport, render de agregados sem reclustering com pesos errados, interação de zoom/detalhe, rótulos de cobertura e testes de integração/end-to-end. Não afirmar resolução visual antes disso.
- Correção da regex de estilos e demais itens originais do plano permanecem pendentes.

## Pedido em andamento — Expo Start e S22
- Metro da branch atual iniciado com expo start --dev-client --localhost --port 8082; sessão 13523 deve permanecer ativa. Porta 8081 pertence à outra worktree e foi preservada.
- S22 reconectado e autorizado: <serial-s22> (SM_S901E). adb reverse tcp:8082 tcp:8082 aplicado; Bundle Location no menu RN ajustado e conferido como localhost:8082.
- Bundle JS compilado e solicitado pelo aparelho. APK antigo falhou com Cannot find native module ExpoNetwork; avisos de default export/ErrorBoundary são consequência do import nativo quebrado.
- expo prebuild --platform android --no-install concluído. Compilação/instalação em andamento na sessão 80977, comando RCT_METRO_PORT=8082 npx expo run:android --device <serial-s22> --no-bundler. Log .validation/fase5-s22-build.log; conferir sessão antes de reiniciar.
- Ainda não afirmar app atualizado/funcionando no aparelho. Ao concluir APK, verificar conexão à 8082, tela inicial, erros nativos e continuar os testes UI autorizados pelo usuário.
- Trabalho da rota espacial foi interrompido para este pedido; backend agregador está commitado, endpoint e app seguem pendentes.

## Fase 5 — guarda de estilos corrigida
- Regex borderw*Radius corrigida para border\w*Radius; teste reproduziu cantos específicos ignorados e passou após correção.
- Guarda agora inclui rgba() e todos os pesos numéricos/literais de fonte. Inventário inicial das novas métricas: 9 rgba e 90 pesos; limites anteriores preservados (incluindo zero raios literais).
- Dois testes da guarda passaram. Estes limites registram dívida existente e impedem aumento; não indicam que os 99 literais foram removidos.

## Continuidade — compilação com pressão de memória
- Build Android sessão 80977 segue ativo; avançou para merge de libs Sentry, compilação Expo Modules e assets/metadados do app. Ainda não foi concluído/instalado.
- Windows medido com apenas 251084 KiB livres de 16454388 KiB. Metro anterior PID 7200 (porta 8082, pertencente a esta sessão) foi encerrado e reiniciado com --max-workers 1. Novo Metro: sessão 19099. Porta 8081 da outra worktree preservada.
- Teste HTTP espacial adicionado em back/test/official-call-map.test.ts (não commitado), mas execução falhou por timeout de conexão ao banco; NÃO é evidência de falha funcional do endpoint. Endpoint ainda não implementado. Aguardar recursos e repetir antes da implementação.
- Solicitada parada somente do contêiner descartável fiscaliza-fase5-test para liberar memória; operação na sessão 66494. Conferir estado antes de reiniciar o banco de teste. Não foi parado nenhum contêiner de produção.
- Retomar primeiro atualização S22 e Expo Start; depois continuar endpoint/camada espacial e demais itens do plano.

## Continuidade — build limitado e endpoint espacial
- Primeira compilação terminou com falha confirmada: Gradle Worker Daemon não conectou em 120s sob carga extrema; 21m53s. Nenhum APK instalado nessa tentativa.
- Nova compilação ativa sessão 25582: gradlew app:assembleDebug com --max-workers=1 --no-parallel, cache, arm64-v8a e porta nativa 8082. Log .validation/fase5-s22-build-limited.log. Já passou Javac Expo Modules e compilação Kotlin do app; ainda falta resultado final/instalação.
- Metro sessão 19099 continua ativo em 8082 com um worker. Banco fiscaliza-fase5-test foi parado para reduzir consumo de memória.
- Endpoint GET /api/rio1746/map implementado localmente com viewport obrigatório, sem paginação. callConditions agora compartilha os filtros de lista/mapa. Teste sem banco reproduziu 404 antes e passou com 400 de validação depois; typecheck backend passou.
- Teste HTTP com banco ainda precisa ser repetido quando o contêiner de teste for reiniciado; tentativa anterior teve timeout de conexão sob pressão de memória, não validou o comportamento. Integração app/camada espacial ainda pendente.

## Continuidade — APK e transporte espacial
- Build limitado sessão 25582 segue em app:buildCMakeDebug[arm64-v8a]. Medidos 14 clang++ ativos mesmo com um worker Gradle; memória livre 1477228 KiB nesse momento. Não reiniciar apenas por demora: consultar o handle e resultado final.
- Transporte fetchOfficialMap preparado em front/services/officialCalls.ts com serializador de filtros compartilhado com lista; remove paginação/hasCoordinates e transmite viewport e AbortSignal. Teste official-map-transport passou.
- Alterações de transporte ainda não commitadas; typecheck/lint na sessão 82543, logs fase5-map-transport-{types,lint}.log. Consultar resultado antes de declarar validadas.
- Camada/renderização/contador espacial ainda não ligados ao app. APK ainda não instalado; Metro ativo 19099 em 8082.

## Atualização nativa S22 — APK instalado
- Build limitado terminou com sucesso: 16m32s, 432 tarefas. APK debug 112832949 bytes; SHA256 206E4CD10731D804DEADE5D351ADC270180BE4617D3D1E60C9D6853C2DED8C5A.
- adb install -r confirmou Success; lastUpdateTime do pacote 13/11/2026 15:03:02. Dados do app preservados.
- Metro anterior 19099 não respondia a /status após a compilação. Reiniciado com --clear e um worker, sessão 62626; /status confirmou packager-status:running. App reaberto; validar tela e erros após bundle antes de declarar a jornada funcionando.
- Transporte espacial: teste, typecheck e lint app concluídos com sucesso. Hook/render/contadores e teste HTTP com banco ainda pendentes.
- Falha temporária de revisão automática por limite de uso impediu um docker start; esse comando não foi executado. Aprovação voltou a responder para instalação/reabertura do APK. Banco de teste continua parado até nova verificação.
