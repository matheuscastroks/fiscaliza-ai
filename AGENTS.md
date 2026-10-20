# Repository Guidelines

## Produto e arquitetura

Fiscaliza aí demonstra participação na gestão urbana: ocorrências, propostas, consultas e ações públicas. O cidadão contribui; a gestão responde e presta contas. Consulte PRODUCT.md e DESIGN.md. O plano integrado aprovado substitui decisões antigas de execução exclusivamente mockada.

## Organização

- app/: rotas Expo Router; features/: jornadas; components/: UI compartilhada; theme/: tokens.
- services/: transporte HTTP e compatibilidade; stores/: sessão, interface e adaptadores legados.
- shared/: contratos públicos; backend/: Fastify, PostgreSQL, Drizzle, migrações e testes.
- demo/: fixtures, heurística e testes puros; assets/: arquivos estáticos; plan/: decisões e evidências.

## Comandos

Use npm e preserve os package-lock.json. Instale módulos Expo com npx expo install.

- npm start: Metro; npm run web: cidadão web.
- npm test: testes locais Node; npx tsc --noEmit: tipos; npm run lint: Expo lint.
- npm test --prefix backend: testes API; npm run typecheck --prefix backend: tipos.
- npx expo run:android: build nativo; npx expo config --type prebuild: configuração.
  Consulte README.md para Docker e configuração.

## Convenções

O município vem da sessão e usa código IBGE. Não aceite cidade arbitrária em mutações; registros validam o polígono no servidor. Cache e rascunhos incluem usuário e município. Gestão não escolhe território pelo onboarding cidadão.

TypeScript estrito, indentação de dois espaços, componentes PascalCase, hooks useX e funções com responsabilidade delimitada. Preserve contratos compartilhados e valide entradas no servidor. API/banco são a autoridade; cache e rascunho nunca podem confirmar gravação inexistente. Apoios/respostas devem ter unicidade persistida. Mudanças de atendimento/decisão exigem justificativa e histórico com ator.

## UI e testes

Aplique RITO: razão, informação, tarefa e originalidade funcional. Sem slogans, cards aninhados, vínculo institucional fictício, ranking competitivo ou animações entering em Marker. Teste comportamento, falhas e autorização; registre separadamente evidência de código, web e dispositivo nativo. Nenhuma alegação de desempenho sem medição.

## Segurança e colaboração

Nunca comite .env, credenciais ou android/ios gerados. Gemini somente no servidor; fotos permanecem nesta aplicação. Atualize templates de ambiente. Commits seguem feat/fix/docs e escopo quando útil; sem prefixos de ferramenta na branch ou mensagem. PRs descrevem comportamento, validação e limitações reais.
Skills oficiais selecionadas estão em .agents/skills; instruções do projeto prevalecem.
