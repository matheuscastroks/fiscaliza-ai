# Revisão geral (13/11/2026) — o que foi feito e o que falta

Plano aprovado em `C:\Users\Matheus\.claude\plans\preciso-que-revise-todo-linear-rossum.md` (cópia das decisões abaixo). Evidências em `plan/evidence/2026-11-13-*`.

## Feito e integrado na `main` (sem push)
- **Fase 0, produção:** limpeza de fotos do agendador; revisita dos chamados salvos ou seguidos (a partição do 1746 é a data de abertura); caixa de saída de push; agendador decide pelo banco o que já rodou; `backup.sh` não esconde falha; pacote do release com `backup.sh`; API na porta 43001.
- **Fase 1, privacidade:** migração `0019` remove `records`, `relations`, `answers`, `demo_engagement` e `users.sector` (dump em `backups/legacy/`); token só para o app nativo (`X-Fiscaliza-Client: citizen-native`); sessão deslizante; bloqueio de login por (e-mail, IP); limite por usuário; apagar conta exige senha e limpa o aparelho; desregistro do push ao sair; foto `private, no-store`.
- **Fase 2, backend:** datas no horário do Rio; `merge` de salvos; migração `0020` (índices); validação de query e params; erros em português; `cf-ray` como id; encerramento com prazo; catálogo SIURB; contratos de salvos no `shared/`; CI exige banco.
- **Fase 3, app:** Sentry no app (`EXPO_PUBLIC_SENTRY_DSN`) e na API (`SENTRY_DSN`); `ErrorBoundary`; retry só de rede; `focusManager`/`onlineManager` (`expo-network`); cache persistido; abertura sem esperar `/auth/me`; splash curta depois da primeira vez; `useLastNotificationResponse`.
- **Fase 6, infra e docs:** Caddy removido; ignores; Postman; `plan/` arquivado; `docs/decisoes.md`; AGENTS/README/PRODUCT; Dependabot no CI; shellcheck.

## Pronto, mas fora da `main`
- **Fase 4, interface no aparelho:** branch `refs/heads/fix/app-fase-4-interface` (worktree `.claude/worktrees/youthful-lumiere-e60a3f`), 3 commits, conferida no S22. **Falta juntar na `main`.** Conflito esperado em `front/package.json` e `front/package-lock.json` (a Fase 3 instalou `@sentry/react-native`, `expo-network` e os persisters; a Fase 4 instalou `expo-clipboard`): manter as dependências dos dois lados e rodar `npm install` em `front/`. Depois, `npm test`, `npm run typecheck` e `npm run lint`.

## Falta fazer
1. **Verificar no aparelho as Fases 1, 3 e 4 juntas.** Depois da junção, gerar um build de desenvolvimento novo (`npx expo run:android` em `front/`): o Sentry e o `expo-network` são módulos nativos e o APK instalado não os tem. Percorrer: abrir sem rede (cache e conta guardada), modo avião e volta (salvos pendentes sobem), apagar conta com senha, sair (sem avisos depois), erro forçado com a `ErrorBoundary` chegando ao Sentry (`EXPO_PUBLIC_SENTRY_DEV=1`).
2. **Aplicar em produção:** reconstruir a imagem da API (`docker compose --env-file .env.compose -f compose.yaml -f compose.public.yaml --profile public up -d --build api scheduler migrate`). Isso aplica as migrações `0019` e `0020`; o dump das tabelas legadas já está em `backups/legacy/participacao-20261113.dump`. Antes, rodar um backup (`BACKUP_ONCE=1`).
3. **Fase 5, estrutura e testes (não iniciada):**
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
