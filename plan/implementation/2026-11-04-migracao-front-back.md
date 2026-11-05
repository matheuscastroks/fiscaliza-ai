# Migração front/back Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans para executar este plano sequencialmente. Steps use checkbox (`- [ ]`) syntax for tracking. Não iniciar a execução apenas pela existência deste documento.

**Goal:** Organizar o aplicativo em `front/`, a API em `back/` e manter `shared/` na raiz, preservando comportamento, instalação e operação.

**Architecture:** Dois pacotes npm independentes, com seus lockfiles atuais preservados e um pacote privado na raiz apenas para encaminhar comandos. Realizar a mudança da API e a do aplicativo em etapas sequenciais que incluam testes, Docker, CI e documentação dos respectivos caminhos.

**Tech Stack:** Expo SDK 57, Expo Router, React Native 0.86, TypeScript 6 no app, Fastify 5, TypeScript 5.9/NodeNext na API, PostgreSQL 17, Drizzle, npm, Metro, Docker Compose e GitHub Actions. Preservar as versões e imagens existentes, inclusive Node 24 no CI/web e Node 22 na imagem da API.

**Spec:** [Organização do repositório em front, back e shared](../specs/2026-11-04-organizacao-front-back.md).

**Estado:** estrutura implementada e checagens automáticas de código aprovadas em 05/11/2026. Validação em aparelho/emulador pendente por indisponibilidade do ambiente. Resultados e limitações em [registro da migração](../evidence/2026-11-04-migracao-front-back.md).

**Resumo da execução:**

- [x] Registrar linha de base e preservar alterações locais.
- [x] Migrar API para `back/`, com testes e imagem validados.
- [x] Migrar app para `front/`, preservando `shared/` e os lockfiles.
- [x] Validar instalação limpa, testes, tipos, lint, bundle Android e configuração.
- [x] Revisar alterações e remover pastas vazias, conforme pedido adicional.
- [ ] Validar APK e jornadas em aparelho/emulador quando houver ferramentas disponíveis.

O roteiro detalhado abaixo preserva os passos propostos originalmente. O registro de evidências informa o que foi executado, os ajustes de escopo, os ensaios equivalentes e os itens indisponíveis; não confundir critérios físicos pendentes com verificação já realizada.

**Ajuste de escopo durante a execução:** o usuário pediu foco no aplicativo móvel e na API. Não executar exportações ou testes de navegação web nem criar outra interface. Os passos web abaixo ficam dispensados nesta execução; preservar a infraestrutura existente e ajustar somente seus caminhos. A validação de bundling será feita para Android.

## Global Constraints

- Manter instalações npm independentes.
- O lockfile atual da raiz passa a `front/package-lock.json`; o de `backend/` passa a `back/package-lock.json`, sem alteração de conteúdo nesta migração.
- Manter um `package.json` privado na raiz, sem dependências e sem `workspaces`, apenas com comandos de instalação e encaminhamento.
- Preservar a organização interna do aplicativo.
- Preservar o conteúdo de `shared/`, inclusive seu `package.json` com `type: module`.
- Manter nomes de serviços, volumes, projeto Compose de produção, portas, URLs e caminhos persistentes em containers.
- Não alterar SQL, checksums de migrações, dados, buckets ou chaves de cache e armazenamento do aplicativo.
- Não incluir credenciais, ambientes locais ou projetos nativos gerados em commits. Preservar alterações locais preexistentes; não executar reset, limpeza ou stash automático.
- Não executar importações de fontes oficiais, publicar imagens ou implantar em produção como parte deste plano.

## Review Focus

1. Instalação limpa: o frontend não pode depender do antigo `node_modules` da raiz; verificar em cópia sem outputs ou dependências antigas na tarefa 3.
2. Código compartilhado fora do app: imports por alias e relativos devem funcionar no Metro e no TypeScript; verificar testes, exportação e execução real nas tarefas 2 e 3.
3. Diretório de execução da API: módulos compilados, fixtures, migrações e dados devem ser localizados pela API e pelos testes; verificar com PostgreSQL descartável e container na tarefa 1.
4. Artefatos aninhados: `.env`, uploads e diretórios nativos em `front/` e `back/` continuam ignorados e fora das imagens; conferir regras e contexto de build nas tarefas 1, 2 e 3.
5. Publicação web: CI deve exportar dentro de `front/` e entregar o diretório esperado ao Nginx, incluindo rotas e assets; verificar imagem e navegação nas tarefas 2 e 3.

---

## Inventário e destino dos arquivos

| Origem | Destino / responsabilidade |
|---|---|
| `backend/` rastreado pelo Git | `back/`, preservando a estrutura interna e o nome npm `fiscaliza-api` |
| `app/`, `assets/`, `components/`, `features/`, `hooks/`, `services/`, `stores/`, `theme/`, `utils/` | Mesmos diretórios sob `front/` |
| `tests/`, `scripts/` | `front/tests/`, `front/scripts/`; preservar o teste estrutural que inspeciona a API |
| `app.json`, `app.config.js`, `metro.config.js`, `eslint.config.js`, `tsconfig.json` | Mesmos arquivos sob `front/` |
| `package.json`, `package-lock.json`, `.env.example` | `front/`; criar outro `package.json` na raiz sem dependências |
| `services/AGENTS.md` | `front/services/AGENTS.md`, acompanhando o diretório |
| `shared/`, `deploy/`, `docs/`, `plan/`, `postman/`, `.github/` | Permanecem na raiz |
| `AGENTS.md`, `README.md`, `PRODUCT.md`, `DESIGN.md`, `ANTI_SLOP.md`, `LEIA_PRIMEIRO.md`, `Caddyfile`, Compose e arquivos de ferramentas | Permanecem na raiz; revisar referências operacionais |
| `.env`, `.expo/`, `expo-env.d.ts`, `android/`, `ios/`, `dist/`, dependências e uploads locais | Tratar separadamente como arquivos ignorados; não adicionar ao Git nem mover caches como se fossem código |

Não aplicar substituição global de `backend` por `back`: o termo também descreve arquitetura e aparece em evidências históricas. Corrigir caminhos executáveis e links de documentação vigente; preservar o registro histórico de comandos antigos.

### Tarefa 0: registrar a linha de base e preservar o trabalho existente

**Files:** consultar `package.json`, `backend/package.json`, lockfiles, configurações, `AGENTS.md`, `PRODUCT.md` e `DESIGN.md`. Criar durante a execução `plan/evidence/2026-11-04-migracao-front-back.md`.

**Interfaces:** consome o estado real do workspace, incluindo alterações ainda não commitadas. Produz inventário de origem/destino, hashes dos lockfiles e resultados de referência para as demais tarefas.

- [ ] Registrar `git status --short` e inspecionar `git diff --stat`. Identificar arquivos já alterados e os não rastreados; não incluí-los automaticamente em commits da migração. Separar o estado funcional de referência dos commits de movimentação antes de preparar um checkout limpo: não criar esse commit de referência com alterações do usuário sem revisão. Se usar um worktree, transportar explicitamente o estado necessário: um checkout apenas de HEAD não representa este workspace.
- [ ] Registrar `node --version`, `npm --version` e `sha256sum package-lock.json backend/package-lock.json`. Não registrar valores de variáveis de ambiente ou conteúdo de credenciais.
- [ ] Inventariar privadamente `.env`, configurações nativas locais e `backend/uploads/`, se existirem. Preservar dados locais antes de qualquer reorganização; não copiar uploads para evidências.
- [ ] Executar `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run typecheck --prefix backend` e `npm run build --prefix backend`. Registrar resultados, duração e falhas preexistentes, sem atribuí-las à migração.
- [ ] Em PostgreSQL 17 exclusivo de teste, executar `npm run migrate --prefix backend`, `npm test --prefix backend` e `npm run openapi --prefix backend`. Confirmar que `DATABASE_URL` aponta para essa base descartável antes de executar; registrar testes pulados e suas razões.
- [ ] Na raiz, executar `npx expo config --type prebuild` e `npx expo export --platform web --output-dir .validation/migration-baseline-web --max-workers 2`. Registrar versões, identidade nativa e disponibilidade das mesmas jornadas que serão repetidas ao final. Manter saídas que contenham configuração local fora do Git.
- [ ] Registrar as limitações atuais. Na análise anterior desta conversa passaram testes locais e tipos do app/API; isso não substitui esta linha de base. `reset-project` e `icons:generate` apontam para scripts que não aparecem no inventário atual de arquivos rastreados: registrar como pendência anterior, sem recriar ferramentas ou removê-las nesta migração.

**Saída:** estado inicial reproduzível ou limitações identificadas. Se uma verificação essencial já falha, identificar a causa antes de usá-la como prova de regressão; não reduzir a suíte para fazer a migração passar.

### Tarefa 1: renomear a API com compilação e operação completas

**Files:** mover arquivos rastreados de `backend/` para `back/`; modificar `back/package.json`, `back/Dockerfile`, `package.json` da raiz, `compose.yaml`, `.github/workflows/validate.yml`, `.github/workflows/release.yml`, `.gitignore`, `.dockerignore`, `metro.config.js`, `tsconfig.json`, `eslint.config.js`, `tests/legacy-removal.test.cjs`, `postman/verify-photo-analysis.mjs`, `README.md`, `AGENTS.md` e os READMEs operacionais sob `back/`. Ajustar também os links existentes em `DESIGN.md` e a estrutura em `docs/decisoes.md` para o estado intermediário.

**Interfaces:** consome os hashes e a linha de base da tarefa 0. Produz `back/package.json`, `back/dist/back/src/*.js`, `back/dist/shared/`, `back/openapi.json` e um app ainda executável na raiz. Os contratos HTTP e a profundidade dos imports da API para `shared/` permanecem iguais.

- [ ] Mover somente o conteúdo rastreado de `backend/` para `back/`, preservando as alterações locais desses arquivos. Não transportar `node_modules`, dist ou arquivos de runtime por meio de um rename indiscriminado do diretório. Instalar com `npm ci --prefix back` e conferir o hash de `back/package-lock.json`.
- [ ] Em `back/package.json`, trocar `dist/backend/` por `dist/back/` em `start`, `test`, `migrate`, `openapi`, `sync:rio1746`, `probe:siurb` e `sync:siurb`. Preservar `rootDir: ".."`, `outDir: "dist"`, NodeNext e as entradas atuais em `back/tsconfig.json`.
- [ ] Atualizar atalhos `api:start` e `api:test` da raiz para `--prefix back`. Em `tests/legacy-removal.test.cjs`, apontar a inspeção estrutural para `back/src/app.ts`.
- [ ] Ajustar os caminhos do Postman para `../back/dist/back/src/analysis.js`, `../back/package.json` e `../back/data/demo-media/lighting.jpg`. A verificação de análise de foto é legada e opcional; não adicionar esse fluxo ao produto nem executá-lo contra um provedor pago. Conferir sua sintaxe com `node --check postman/verify-photo-analysis.mjs`.
- [ ] Atualizar o Dockerfile da API: copiar `back/` e `shared/` a partir da raiz; instalar em `/app/back`; manter `WORKDIR /app/back`, `UPLOAD_DIR=/app/uploads` e os comandos `node dist/back/src/migrate.js` e `node dist/back/src/server.js`.
- [ ] No Compose local, mudar apenas o caminho do Dockerfile para `back/Dockerfile`. No CI, atualizar prefixos, cache do lockfile e artefato OpenAPI para `back/`. Na matriz de release, apontar para `back/Dockerfile`. Preservar contexto `.`, serviços, imagens, volumes, redes e portas existentes.
- [ ] Atualizar os excludes do TypeScript, ESLint e Metro do app ainda na raiz para `back/`. Atualizar regras ignoradas de outputs e uploads, incluindo padrões recursivos para ambientes locais em `.dockerignore`. Preservar dados ignorados da instalação local em caminho explicitamente inventariado; não deixá-los abandonados no diretório antigo. Enquanto outputs antigos ainda existirem, manter suas exclusões para que o rename não exponha arquivos antes ignorados ao Git ou ao contexto Docker.
- [ ] Atualizar os comandos e links de API em README, AGENTS, DESIGN, `docs/decisoes.md` e READMEs operacionais das integrações. Não reescrever evidências históricas em `plan/`.
- [ ] Verificar `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build --prefix back` e `npm run typecheck --prefix back`. Conferir a existência de `back/dist/back/src/server.js`, `back/dist/back/src/migrate.js` e `back/dist/shared/contracts.js` em saída gerada a partir de uma instalação sem dist antigo.
- [ ] Com o PostgreSQL descartável da tarefa 0, executar `npm run migrate --prefix back`, `npm test --prefix back` e `npm run openapi --prefix back`. A suíte deve encontrar `data/` e fixtures pelo diretório de `back/`, sem novos skips de testes por falta de banco. Comparar caminhos e schemas OpenAPI com a linha de base.
- [ ] Construir a imagem com `docker build -f back/Dockerfile -t fiscaliza-migration-api:local .`. Em ambiente de teste isolado, iniciar a imagem com a base descartável e confirmar `/api/health`, consultas públicas, ausência de erros de módulos e leitura das migrações/dados. Não apontar o container para o banco habitual ou o de produção.
- [ ] Conferir o diff e registrar evidências. Ao integrar esta etapa, usar commit seletivo como `feat(repo): organiza API em back`, sem arquivos locais de outras tarefas ou credenciais.

**Saída:** API e app na raiz funcionam com a nova localização do servidor; Docker e CI já conhecem `back/`. Não iniciar a tarefa 2 com falhas novas desta etapa.

### Tarefa 2: mover o aplicativo e atualizar comandos, bundling e publicação web

**Files:** mover os arquivos do aplicativo conforme o inventário; criar `package.json` da raiz; modificar `front/package.json`, `front/tsconfig.json`, `front/metro.config.js`, `front/eslint.config.js`, `front/features/territory/selectors.ts`, `front/features/city/municipalContext.ts`, `front/tests/profileSession.test.ts`, `front/tests/territory.test.ts`, `front/tests/citizen-navigation.test.cjs`, `front/tests/legacy-removal.test.cjs`, `.gitignore`, `.dockerignore`, `.github/workflows/validate.yml`, `deploy/citizen.Dockerfile`, `README.md`, `AGENTS.md`, `DESIGN.md`, `docs/decisoes.md` e `deploy/README.md`.

**Interfaces:** consome `back/` estável da tarefa 1. Produz projeto Expo em `front/`, scripts da raiz que executam no diretório correto e exportação web em `.validation/web-export` no CI ou `/app/front/web-dist` na imagem. Preserva `main: "expo-router/entry"`, nome npm, slug, scheme, package Android, rotas e imports internos por `@/`.

- [ ] Mover os diretórios e arquivos rastreados listados no inventário para `front/`, incluindo o lockfile original e `services/AGENTS.md`. Não mover `shared/` nem introduzir `src/`. Instalar com `npm ci --prefix front` e conferir os dois hashes de lockfile contra a tarefa 0.
- [ ] Adicionar a `front/tsconfig.json` o mapeamento específico `"@/shared/*": ["../shared/*"]`, mantendo `"@/*": ["./*"]`. Incluir `../shared/**/*.ts` na verificação do frontend e preservar as exclusões dos testes existentes. Os excludes de diretórios externos ao app não substituem fronteiras de importação.
- [ ] Em `front/metro.config.js`, usar `getDefaultConfig(__dirname)` com as opções atuais e acrescentar `path.resolve(__dirname, '../shared')` aos `watchFolders` já existentes. Recalcular os bloqueios a partir de `path.resolve(__dirname, '..')` para `back/`, `.agents/`, `.validation/` e os bloqueios de ferramentas já necessários. Não adicionar workspaces, aliases de `node_modules` ou cópias de `shared/` dentro do aplicativo.
- [ ] Corrigir os imports relativos dos arquivos movidos: `front/features/territory/selectors.ts` e `front/features/city/municipalContext.ts` passam de `../../shared/` para `../../../shared/`; os dois testes TS passam de `../shared/` para `../../shared/`; leituras de `shared/...` em `citizen-navigation.test.cjs` passam a `../shared/...`; a inspeção da API em `legacy-removal.test.cjs` passa a `../back/src/app.ts`. Preservar as extensões de importação existentes. Repetir a busca para detectar outros consumidores adicionados desde este inventário.
- [ ] Preservar leituras locais de `app/`, `features/`, `components/`, `stores/`, `app.json` e `package.json` nos testes: `npm test --prefix front` executa com `front/` como cwd. `front/scripts/summarize-map-performance.cjs` e seu require relativo permanecem na mesma relação. Não alterar regras de negócio nem reescrever testes que não dependem dos caminhos movidos.
- [ ] Manter os scripts próprios do app em `front/package.json`, retirar dali os atalhos de API e adicionar `typecheck: "tsc --noEmit"`, `config:prebuild: "expo config --type prebuild"` e `export:web: "expo export --platform web"`.
- [ ] Criar o pacote privado da raiz sem `main`, dependências ou `workspaces`, com os encaminhamentos definidos na tabela abaixo. O nome npm do aplicativo continua `fiscaliza-ai`; o pacote da raiz pode se chamar `fiscaliza-ai-repository`. Não executar `npm ci` na raiz.
- [ ] Copiar privadamente o ambiente do Expo para `front/.env`, mantendo os valores; mover o template rastreado para `front/.env.example`. Manter `.env.compose`, seu template e a configuração de produção nos locais atuais. Não depender de um `.env` antigo da raiz para o app iniciar.
- [ ] Ignorar explicitamente `/front/android/`, `/front/ios/`, `/front/web-dist/` e outputs de `back/`; conferir `node_modules`, `.expo`, `expo-env.d.ts` e ambientes aninhados com `git check-ignore`. Em `.dockerignore`, aplicar `**/node_modules`, `**/dist`, `**/.expo`, `**/.env`, `**/.env.*`, `**/android`, `**/ios`, `**/uploads` e `**/web-dist`, preservando exclusões de ferramentas e evidências locais.
- [ ] Em `deploy/citizen.Dockerfile`, usar `WORKDIR /app/front`, copiar `front/package.json` e `front/package-lock.json` antes de `npm ci`, copiar o app para `/app/front` e `shared/` para `/app/shared`. Exportar com `EXPO_PUBLIC_API_URL=/api`; no estágio Nginx, copiar `/app/front/web-dist`. O contexto do build continua `.`. Não copiar `.env` para a imagem.
- [ ] No CI, instalar com `npm ci --prefix front` e `npm ci --prefix back`; configurar cache com `front/package-lock.json` e `back/package-lock.json`. Rodar comandos Expo em `working-directory: front`. Exportar com `npx expo export --platform web --output-dir ../.validation/web-export --max-workers 2`, preservando o artefato `.validation/web-export` e `back/openapi.json`.
- [ ] Atualizar README e AGENTS com instalação e comandos novos; atualizar caminhos de código em DESIGN e `docs/decisoes.md`. Corrigir a documentação de deploy para os dois serviços de aplicação atuais, sem painel municipal. Preservar `deploy/deploy.sh`, configuração Caddy, configuração Nginx, Compose de produção e seus contratos de operação, salvo correção de um caminho de código comprovadamente afetado.
- [ ] Executar pela raiz os atalhos de teste, tipos, lint e configuração; executar `npm run export:web --prefix front -- --output-dir ../.validation/migration-web --max-workers 2`. A exportação deve carregar módulos de `shared/`, fontes e imagens sem depender do diretório antigo do app.
- [ ] Executar `npm start --prefix front -- --clear` e confirmar carregamento do app pelo Metro; conferir também que `npm start` pela raiz inicia o mesmo aplicativo. Encerrar os processos depois da verificação. Conferir que não surgiram cópias de fontes, ícones ou arquivos de `shared/` como solução de resolução.
- [ ] Construir `docker build -f deploy/citizen.Dockerfile -t fiscaliza-migration-citizen:local .`; servir a imagem localmente e confirmar `/LoginScreen`, rota inicial e assets. Conferir a ausência de ambientes locais no contexto/estágios de build, além do estágio final.
- [ ] Conferir o diff e registrar evidências. Ao integrar, usar commit seletivo como `feat(repo): isola aplicativo em front`.

**Comandos da raiz após esta tarefa:**

| Script | Valor |
|---|---|
| `install:all` | `npm ci --prefix front && npm ci --prefix back` |
| `start` | `npm start --prefix front` |
| `android` | `npm run android --prefix front` |
| `ios` | `npm run ios --prefix front` |
| `test` | `npm test --prefix front` |
| `lint` | `npm run lint --prefix front` |
| `typecheck` | `npm run typecheck --prefix front && npm run typecheck --prefix back` |
| `api:start` | `npm start --prefix back` |
| `api:test` | `npm test --prefix back` |
| `api:build` | `npm run build --prefix back` |
| `api:migrate` | `npm run migrate --prefix back` |
| `api:openapi` | `npm run openapi --prefix back` |
| `config:prebuild` | `npm run config:prebuild --prefix front` |

Para passar argumentos ao Metro, documentar `npm start --prefix front -- --clear`, que encaminha diretamente ao pacote do app. O atalho simples `npm start` da raiz continua funcionando. Os comandos `npx expo ...` e `npx tsc ...` passam a ser executados dentro de `front/`; na raiz, usar os scripts acima.

**Saída:** raiz contém coordenação e documentação; app, API e módulos comuns usam seus diretórios finais. Configuração, testes, CI e Docker não dependem dos caminhos antigos.

### Tarefa 3: comprovar instalação limpa, jornadas e reversão

**Files:** verificar o conjunto das tarefas 1 e 2; completar `plan/evidence/2026-11-04-migracao-front-back.md`. Não criar mudanças de comportamento para acomodar a migração.

**Interfaces:** consome a estrutura final e os hashes da tarefa 0. Produz matriz de resultados por ambiente, pendências reais e commits revisáveis de organização.

- [ ] Preparar uma cópia isolada do resultado a integrar, sem `node_modules`, `.expo`, dist, outputs web ou projetos nativos antigos. Garantir que contém o estado funcional usado na linha de base, incluindo as alterações preexistentes necessárias; um checkout incompleto não serve como prova. Executar `npm run install:all`, `npm test`, `npm run typecheck` e `npm run lint`. Nenhum passo pode depender de instalação npm na raiz.
- [ ] Repetir build, migrações, testes e OpenAPI da API com PostgreSQL 17 descartável. Comparar resultados e schema com a linha de base. Verificar que não foram modificados arquivos SQL, contratos, nomes de rotas, nomes npm ou versões resolvidas dos lockfiles.
- [ ] Repetir a exportação web, servir o resultado com o mesmo modo de roteamento usado no Nginx e validar Home → território/mapa/lista → detalhe → salvar → salvos → canal oficial. Confirmar recarga direta de uma rota, fontes, ícones, estado vazio e recuperação de falha HTTP. Verificar que salvos e preferências anteriores continuam acessíveis na mesma origem do navegador.
- [ ] Conferir `npm run config:prebuild` contra a linha de base: slug, scheme, package Android, plugins, permissões e referências de assets devem permanecer equivalentes, descontados caminhos absolutos. Não publicar a saída integral se contiver configuração local.
- [ ] Para validar nativo, inventariar eventuais mudanças locais no Android antigo antes de regenerar. A partir de `front/`, gerar/construir com `npx expo run:android`; abrir em dispositivo ou emulador e repetir exploração, detalhe, salvos e preferências. Preservar o identificador do app e evitar desinstalação/apagamento dos dados durante a comparação. Registrar Expo Go separadamente se testado; iOS fica como não verificado quando não houver ambiente disponível.
- [ ] Validar o fluxo HTTP com a API em container e a imagem web, usando somente infraestrutura de teste. Confirmar `/api/health`, consulta pública e persistência dos dados de teste após recriar apenas a API. Validar Compose de produção com `config --quiet`, variáveis de exemplo e `bash -n deploy/deploy.sh`; não chamar o script de deploy.
- [ ] Executar `git check-ignore front/.env front/android/ front/ios/ front/.expo/ front/node_modules/ back/node_modules/ back/uploads/ back/openapi.json`. Todos esses caminhos devem estar ignorados; templates públicos devem continuar rastreados. Inspecionar também `.dockerignore` e os arquivos copiados pelos dois Dockerfiles.
- [ ] Procurar referências operacionais com `rg -n 'backend/|dist/backend|--prefix backend' .github deploy postman front back README.md AGENTS.md DESIGN.md docs/decisoes.md compose.yaml compose.production.yaml .gitignore .dockerignore --glob '!node_modules/**' --glob '!**/node_modules/**' --glob '!**/dist/**'`. Investigar cada resultado. Não executar substituição em lote ou apagar histórico para obter busca vazia.
- [ ] Revisar `git diff --check`, `git diff --stat` e o diff de cada commit. Confirmar que os dois lockfiles mantêm os hashes originais, a migração não moveu/modificou `shared/` e nenhuma credencial, cache ou projeto nativo foi adicionado. Revisar também as alterações preexistentes para não confundi-las com mudanças introduzidas aqui.
- [ ] Em cópia descartável, testar a reversão dos dois commits de migração em ordem inversa com `git revert`, verificando o retorno de `app/`, `backend/` e dos scripts originais. Não reverter no workspace com trabalho em andamento. A operação não deve executar SQL, remover volumes ou sobrescrever ambientes e uploads locais.
- [ ] Completar a evidência com comando, ambiente, resultado, limitações e links locais para os artefatos apropriados. Usar commit documental seletivo como `docs(repo): registra validacao da organizacao`. Considerar a migração completamente validada apenas quando todos os critérios exigidos tiverem evidência; bloqueios de ambiente permanecem visíveis.

**Saída:** alterações prontas para revisão e integração, com validação separada de código, infraestrutura, web e nativo. Publicação e execução de workflows de release permanecem fora deste plano.

## Matriz de evidências

Preencher durante a execução, sem marcar como aprovado um comando apenas previsto.

| Camada | Evidência necessária | Situação inicial |
|---|---|---|
| Instalação | Cópia sem dependências antigas, dois `npm ci`, hashes iguais | Não executada |
| Código | Testes do app/API, tipos, lint, build e schema OpenAPI | Não executada na estrutura final |
| Infraestrutura | Duas imagens, startup da API, healthcheck, Compose e regras de exclusão | Não executada |
| Web | Rotas, assets, mapa/lista, detalhes, salvos e recuperação de falhas | Não executada |
| Android | Build de desenvolvimento, identidade preservada e jornadas no dispositivo/emulador | Não executada |
| Expo Go / iOS | Execução própria quando houver ambiente, separada da evidência Android | Não verificados |
| Reversão | Revert dos commits em cópia descartável e preservação de dados locais | Não executada |

## Tratamento de falhas e limites

Erro de resolução de `shared/` exige corrigir alias, watch folder ou import relativo, sem duplicar arquivos. Erro de arquivo ausente na API exige conferir cwd, saída do TypeScript e cópias do Dockerfile. Falha presente na linha de base deve ser registrada separadamente; uma nova falha introduzida pela movimentação impede avançar.

Não há reversão de banco prevista, pois não há mudança de esquema. A reversão de código usa somente os commits da migração; ambientes ignorados, uploads e projetos nativos seguem o inventário privado da tarefa 0. Nunca usar `docker compose down -v`, reset do repositório ou limpeza de arquivos locais como mecanismo de reversão.

Workspaces e reorganização interna de `shared/` poderão receber planos próprios depois desta entrega, sem bloquear a organização física solicitada.
