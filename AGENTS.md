# Repository Guidelines

## Produto e arquitetura

Fiscaliza aí permite explorar dados oficiais do 1746 e Data.Rio, acompanhar chamados salvos e acessar canais oficiais. Não recebe ocorrências, propostas, consultas ou ações públicas. Consulte PRODUCT.md e front/DESIGN.md. O plano integrado aprovado substitui decisões antigas de execução exclusivamente mockada.

## Organização

- front/: aplicativo Expo; front/app/: rotas Expo Router; front/features/: jornadas; front/components/: UI compartilhada; front/theme/: tokens.
- front/services/: transporte HTTP e compatibilidade; front/stores/: sessão, interface e adaptadores legados.
- shared/: contratos públicos; back/: Fastify, PostgreSQL, Drizzle, migrações e testes.
- front/tests/: testes puros e de componentes; front/assets/: arquivos estáticos; plan/: decisões e evidências.
- package.json da raiz: atalhos; instalações npm independentes em front/ e back/, sem workspaces.

## Comandos

Use npm e preserve os package-lock.json. Instale módulos Expo com npx expo install.

- npm run install:all: instalar os dois projetos com seus lockfiles; não executar npm ci na raiz.
- npm start: Metro; npm run android: build nativo Android.
- npm test: testes locais Node do app; npm run typecheck: tipos do app e da API; npm run lint: Expo lint.
- npm test --prefix back: testes API; npm run typecheck --prefix back: tipos.
- npm run config:prebuild: configuração. Comandos diretos npx expo e npx tsc devem executar dentro de front/.
  Consulte README.md para Docker e configuração.

## Convenções

O município vem da sessão e usa código IBGE. Não aceite cidade arbitrária em mutações; pontos são validados contra o polígono no servidor. Chaves locais e cache incluem usuário e município. Não há papéis de gestão ou administração nas contas; sincronização é operação do servidor.

TypeScript estrito, indentação de dois espaços, componentes PascalCase, hooks useX e funções com responsabilidade delimitada. Preserve contratos compartilhados e valide entradas no servidor. API/banco são a autoridade; cache local nunca pode confirmar gravação inexistente. Salvos e seguidores têm unicidade persistida no banco.

## UI e testes

Aplique RITO: razão, informação, tarefa e originalidade funcional. Sem slogans, cards aninhados, vínculo institucional fictício, ranking competitivo ou animações entering em Marker. Teste comportamento, falhas e autorização; registre separadamente evidência de código, web e dispositivo nativo. Nenhuma alegação de desempenho sem medição.

## Segurança e colaboração

Nunca comite .env, credenciais ou android/ios gerados. Credenciais de integração (BigQuery, Sentry, Expo) ficam só no servidor ou nos secrets do EAS; a foto de perfil fica nesta aplicação. Atualize templates de ambiente. Commits seguem feat/fix/docs e escopo quando útil; sem prefixos de ferramenta na branch ou mensagem. PRs descrevem comportamento, validação e limitações reais.
Skills Expo selecionadas ficam em front/.agents/skills. Em tarefas do aplicativo, leia front/AGENTS.md e carregue primeiro front/.agents/skills/expo-overview/SKILL.md. As instruções do projeto prevalecem.
