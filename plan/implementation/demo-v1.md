# Demonstração TCC — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox syntax for tracking. Implementar na main por instrução explícita do usuário.

**Goal:** ciclo demonstrativo local consistente no app existente e novo painel municipal.
**Architecture:** domínio mockado compartilhado, adaptadores de armazenamento independentes e duas interfaces separadas.
**Tech Stack:** TypeScript, Expo/React Native, React/Vite, armazenamento local, Node test runner ou ferramenta mínima compatível.
**Spec:** plan/specs/demonstracao-mocks-design.md

## Global Constraints

- Sem backend, banco remoto, autenticação real ou chamadas externas de IA.
- Cenários independentes; não sincronizar celular e navegador.
- Commits locais na main. Sem push ou publicação.
- Preservar assinaturas dos consumidores existentes e alterações do usuário.
- Português, controles acessíveis, indicação clara de demonstração e confirmação de reset.

## Review Focus

1. Persistência inválida ou indisponível não deve quebrar a aplicação nem simular salvamento bem-sucedido.
2. Atualizações concorrentes não devem perder relatos e histórico.
3. Filtros/indicadores devem refletir a mudança de status.
4. Reset e seleção de cenário precisam descartar dados somente após confirmação.
5. Reabrir sessão demonstrativa e navegar para detalhes não deve causar redirecionamento incorreto.

### Task 1: Domínio demonstrativo persistente

**Files:** criar demo/types.ts, demo/fixtures.ts, demo/repository.ts, demo/repository.test.ts; adaptar data/mockData.ts, services/mockApi.ts, services/aiService.ts; ajustar package.json/lock/tsconfig somente conforme necessário.
**Interfaces:** preservar Problem/User e APIs atuais; produzir createDemoRepository(storage, key), métodos list/get/create/update/reset/getScenario e tipos de cenário, documentados no relatório para os próximos agentes.

- [ ] Escrever testes comportamentais para cenários, criação/filtro, histórico, persistência, reset, isolamento, corrupção e falha de escrita; observar falha antes da implementação.
- [ ] Implementar fixtures e repositório puro com adaptador, mutações serializadas e validação de dados persistidos.
- [ ] Integrar API móvel com AsyncStorage, sem acesso externo; substituir IA real por análise local demonstrativa e corrigir bloqueios técnicos diretamente relacionados.
- [ ] Executar testes, tsc e lint; registrar falhas legadas separadamente, corrigindo erros bloqueantes relacionados.
- [ ] Commit e revisão independente de especificação/qualidade.

### Task 2: Painel municipal separado

**Files:** criar municipal/package.json, index.html, tsconfig.json, vite.config.ts, src/ com componentes de painel e estilos; atalhos npm e exclusões de escopo TypeScript/ESLint na raiz.
**Interfaces:** consumir demo/repository.ts e fixtures da Task 1; adaptador localStorage, chave fiscaliza:municipal:v1.

- [ ] Criar testes dos filtros e ações de atendimento com resultados observáveis antes de implementar comportamento.
- [ ] Construir painel responsivo com lista, resumo, filtros, detalhe/histórico, atualização justificada e controles de cenário/reset.
- [ ] Implementar estado de erro/ausência, semântica de formulários e feedback de salvamento; esquema local de localização identificado, com alternativa em lista.
- [ ] Instalar apenas dependências necessárias, executar testes/build e verificar fluxo em navegador.
- [ ] Commit e revisão independente.

### Task 3: Jornada móvel e acabamento de integração

**Files:** app/LoginScreen.tsx, app/_layout.tsx, app/(tabs)/ProblemsListScreen.tsx, ReportScreen.tsx, ProfileScreen.tsx, app/ProblemDetailsScreen.tsx e componentes/stores necessários; README.md e evidências.
**Interfaces:** consumir API/mock repository da Task 1; estado de sessão via authStore e atualização de listas via problemsStore.

- [ ] Testar transições de sessão, refresh de dados e reset onde houver lógica nova; remover dependência de fixtures mutáveis na jornada principal.
- [ ] Entrada demonstrativa clara, cenários/reset, listagem e acompanhamento coerentes; formulário funcional com localização manual e revisão antes de enviar.
- [ ] Corrigir navegação/estado obsoleto e rótulos de IA para explicitar simulação.
- [ ] Executar suíte, tsc/lint, build do painel e export móvel/web quando viável; registrar limites de teste nativo.
- [ ] Atualizar instruções e roteiro da apresentação, commit e revisão de tarefa e revisão final.
