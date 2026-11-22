# Implementação da jornada cidadã sem login

Spec: `plan/specs/2026-10-20-jornada-cidada-sem-login.md`.
Execução: inline, autorizada pelo usuário. Sem commits ou push.

- [x] Persistir salvos e preferências de região, com hidratação e gravações serializadas. Testar reinício, leitura tardia e falha de escrita.
- [x] Desacoplar rotas públicas da inicialização de sessão; manter proteção dos módulos legados e gestão.
- [x] Adaptar Home, menu móvel/desktop, Acompanhar e detalhe. Atualizar somente IDs salvos, com concorrência limitada.
- [x] Transformar Participar em Agir; atualizar onboarding com SVGs existentes e preferências com exclusão confirmada dos salvos.
- [x] Preservar mapa/lista, filtros e cache. Verificar tipos, lint, testes e exportação web; registrar limites de inspeção nativa.

Evidências e limites: `plan/evidence/24-jornada-sem-login.md`. Inspeção no Expo Go permanece pendente.

Contratos: sem alteração do backend. AsyncStorage existente; nenhum dado local concede autorização. Chamado encerrado não significa problema resolvido. Em falha de gravação, manter conteúdo e permitir nova tentativa. Preferências não dependem da conta.
