# Evidências da migração front/back

Plano: [migração](../implementation/2026-11-04-migracao-front-back.md). Execução iniciada em 04/11/2026 e validada em 05/11/2026 na branch `refactor/organizacao-front-back`. Estrutura implementada; validação em aparelho/emulador permanece pendente.

## Preservação e decisões de execução

- Alterações preexistentes preservadas no workspace. Snapshot dos arquivos rastreados, manifesto SHA-256, diff inicial e inventário Git ficam em `/tmp/fiscaliza-migration/baseline`, sem cópia de ambientes locais para o snapshot.
- Lockfile do app: `e8b0fd6d265cc97042661587228fb1ef99e4b2d57f4dfc8cef8a08854163bbe8`.
- Lockfile da API: `c39d372197f7ef66ccf3418934769e476b77865bb4eebe5eb8becc840c244deb`.
- Ruling: executar na branch dedicada do workspace atual — preserva o estado funcional ainda não commitado; um worktree baseado apenas em HEAD excluiria mudanças preexistentes necessárias. Não criar commits das alterações do usuário automaticamente.
- Ruling: manter o progresso neste documento e logs privados em `/tmp/fiscaliza-migration/logs`; validar a movimentação com as suítes existentes e builds reais. Não adicionar testes que apenas reproduzem nomes de diretórios ou conteúdo das configurações.
- Pré-verificação: tarefa 1 produz `back/`, consumido pelo teste estrutural do frontend na tarefa 2; corrigir o teste em ambas as posições. A tarefa 2 mantém a saída de CI em `.validation/web-export` na raiz, embora o Expo execute em `front/`.
- Ajuste de escopo solicitado pelo usuário durante a execução: priorizar aplicativo Expo móvel e API. Não criar interface web, executar exportações web ou validar navegação em navegador. Corrigir somente os caminhos da infraestrutura web já existente. Esses itens deixam de ser critérios de conclusão desta execução e ficam explicitamente não verificados.

## Linha de base

Node `24.21.0`, npm `11.19.0`. Estes resultados documentam a estrutura inicial; a validação final está abaixo.

- `npm test`: passou (3 arquivos TS e 20 CJS).
- `npx tsc --noEmit`: passou.
- `npm run typecheck --prefix backend`: passou.
- `npm run build --prefix backend`: passou fora da sandbox. A execução inicial foi bloqueada por EROFS no caminho real com maiúsculas; não era erro TypeScript.
- `npm run lint`: falha anterior à migração, `Failed to load native binding` em `unrs-resolver`; instalação atual não contém o binding Linux. Reavaliar na instalação nova de `front/`.
- A suíte original da API também falhou pela ausência do binário Linux de `sharp` na instalação preexistente. Dependências novas foram obtidas por `npm ci` sem alterar lockfiles; confirmar novamente a suíte completa com essa instalação.
- `expo config --type prebuild --json`: passou; configuração de referência mantida privadamente.
- Exportação web de referência: primeira tentativa bloqueada pela sandbox; interrompida e retirada do escopo por orientação do usuário.

## Execução

- Tarefa 0: inventário, snapshot, hashes, testes do app, tipos e configuração de referência registrados; falhas ambientais de bindings identificadas.
- Tarefa 1: API movida para `back/`; scripts, CI, Docker, Compose, Postman e documentação operacional ajustados. Uploads locais preservados em `back/uploads/`. Fontes de execução e SQL mantidos byte a byte. Imagem, startup e testes aprovados.
- Tarefa 2: aplicativo movido para `front/`, incluindo configurações, testes, scripts, lockfile e template de ambiente. Imports relativos, alias específico de `shared/`, watch folder do Metro e encaminhamento de comandos ajustados. Ambiente ativo em `front/.env`; cópia anterior preservada em `.validation/migration-legacy/.env`.
- Tarefa 3: instalação limpa, testes, tipos, lint, bundle Android, configuração Expo, infraestrutura e preservação de arquivos verificados. Sem build APK, emulador, aparelho, Expo Go ou iOS disponíveis nesta execução. Ver observação de Metro abaixo.

## Decisões adicionais e revisão

- Ruling: compilar a API uma vez por verificação na cópia limpa e executar os mesmos entrypoints compilados de migrate/test/openapi — evita repetir a compilação sem alterar a suíte. O comando original `npm test` também passou dentro da imagem Docker.
- Ruling: preservar o trabalho sem criar commits automáticos que absorvam alterações anteriores do usuário. A reversão estrutural foi ensaiada em cópia descartável com o snapshot inicial; `git revert` dos futuros commits dependerá de sua integração.
- Depois da implementação, o usuário autorizou a criação dos commits. A migração e sua documentação serão registradas separadamente; alterações anteriores de ferramentas e documentação histórica permanecem fora desses commits. Nenhum push foi solicitado ou executado. Os testes do app foram repetidos e passaram antes de preparar os commits.
- Ruling: manter ignorados os outputs antigos enquanto houver arquivos locais nesses diretórios. A tentativa de arquivar `node_modules/`, `android/`, `.expo/`, `dist/` e o `backend/` residual foi recusada pelo filesystem com PermissionError, mesmo fora da sandbox. Esses diretórios não foram apagados nem usados pela instalação limpa. Não forçar fechamento de processos do usuário ou exclusão de dados.
- Revisão independente: não encontrou regressões estruturais Critical/Important; confirmou preservação de SQL, contratos e código de comportamento. Apontou perda de encaminhamento de flags em alguns atalhos da raiz.
- Ruling da revisão: corrigir o encaminhamento como compatibilidade funcional dos comandos. Antes, `npm run config:prebuild -- --help` mostrava ajuda do npm; após acrescentar `--` aos wrappers de um único pacote, mostrou ajuda do Expo. A suíte completa do app foi executada depois dessa correção.
- Uma primeira checagem da cópia limpa começou antes de a reinstalação terminar, resultando em arquivos de tipos ausentes e falhas transitórias nos testes de stores. Foi desconsiderada e repetida após a instalação; testes e tipos passaram. Não houve mudança de código para acomodar esses erros.
- A revisão deixou fora de julgamento mudanças anteriores à migração, defeitos preexistentes do fluxo legado de fotos, runtime web excluído pelo usuário, publicação e validações físicas ainda indisponíveis. Essas áreas não foram alteradas para acrescentar funcionalidades.

## Validação final

| Camada | Verificação | Resultado |
|---|---|---|
| Instalação | `npm run install:all` em `/tmp/fiscaliza-migration/clean`, sem dependências antigas da raiz | Passou; instalações separadas e lockfiles inalterados |
| Instalação local | Dependências novas em `front/node_modules` e `back/node_modules` | Concluída; bindings Linux presentes |
| App | `npm test` pela raiz da cópia limpa | Passou: 3 arquivos TS e 20 CJS, sem falhas ou skips |
| Tipos | `npm run typecheck` na raiz do workspace | Passou para app e API |
| Lint | `npm run lint` na cópia limpa | Passou sem erros ou avisos do ESLint |
| API local | `npm run api:build` na raiz do workspace | Passou; saída em `back/dist/back/` e `back/dist/shared/` |
| API em Docker | Build de `back/Dockerfile` e `npm test` em Node 22 contra PostgreSQL 17 descartável | Passou: 39 testes, zero falhas, zero skips |
| API limpa | Build, migrações, suíte compilada e OpenAPI em Node 24, contra a mesma base descartável | Passou: 39 testes, zero falhas, zero skips; OpenAPI gerado |
| API HTTP | Health, fontes, equipamentos e chamados na API isolada | Quatro respostas HTTP 200 |
| Android JS | `npm run export:android --prefix front -- --output-dir /tmp/fiscaliza-migration/android-bundle --max-workers 2` na cópia limpa | Passou; bundle Hermes e assets gerados; não equivale a APK ou execução nativa |
| Expo | Configuração prebuild da estrutura inicial comparada à final | Igual em todos os campos, exceto metadados internos dos diretórios; identificadores, plugins e assets preservados |
| Infraestrutura | Parsing dos dois workflows/Compose, `docker compose config --quiet` com variáveis fictícias e `bash -n deploy/deploy.sh` | Passou; nenhum deploy executado |
| Arquivos | Manifesto dos 362 arquivos rastreados no início | 234 arquivos movidos; nenhuma alteração fora da lista de mudanças esperadas; `shared/` e lockfiles preservados byte a byte |
| Reversão | Restauração do mapeamento e conteúdos iniciais em `/tmp/fiscaliza-migration/rollback-rehearsal` | Todos os 362 hashes coincidem com a linha de base; sem ação no workspace ou banco |
| Pastas vazias | Limpeza das origens antigas e varredura das pastas de código/documentação | Mais 11 diretórios vazios residuais removidos; varredura final sem pastas vazias remanescentes ou remoções bloqueadas; dependências, ferramentas, caches e dados excluídos da varredura |
| Web | Exportação, imagem do cidadão e navegação | Dispensadas por solicitação do usuário; somente caminhos da infraestrutura existente ajustados |
| Dispositivo | APK, emulador/aparelho, Expo Go e iOS | Não verificados; Java e adb não disponíveis neste ambiente |

### Metro e ambiente local

`npm start -- --offline --port 8089 --max-workers 2` funcionou pela raiz da cópia limpa; `/status` respondeu `packager-status:running`. O processo de teste foi encerrado depois da verificação. No workspace sobre o filesystem do Windows, as tentativas com limite de 300 segundos não chegaram a responder ao status, inclusive usando dois workers. O encaminhamento iniciou o projeto correto em `front/`, mas a inicialização completa nesse ambiente específico permanece não verificada. Não foi atribuída uma causa de desempenho sem medição adicional. Os processos de teste foram encerrados.

Nas duas instalações, o React Native DevTools registrou ausência da biblioteca de sistema `libnspr4.so`. Isso não impediu o Metro na cópia limpa. Não foi instalada biblioteca de sistema ou alterado o app para ocultar esse diagnóstico. Não há alegação de desempenho ou de execução física das telas.

### Artefatos de auditoria

Logs privados, configurações resolvidas, inventário, manifesto, relatório de pastas vazias e ensaio de reversão estão em `/tmp/fiscaliza-migration/`. Não adicionar esses conteúdos integralmente ao Git: a configuração resolvida pode conter valores do ambiente local. A evidência pública é este resumo. Os containers de validação são exclusivos do projeto Compose `fiscaliza-migration`; não foram utilizados os serviços ou volumes habituais da aplicação.
