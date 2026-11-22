# SDD ledger — plan: plan/implementation/demo-v1.md

Planejamento inicial: cc5e793. Usuário autorizou implementação por subagentes e, em seguida, commits exclusivamente na main.

## Decisões de coordenação

- Ruling: trabalhar no checkout atual na main — instrução explícita do usuário, substitui isolamento padrão da skill — alterações são recuperáveis por commits locais.
- Ruling: primeira entrega é o ciclo demonstrativo essencial; ranking/pontos não receberão redesign completo — evitar atrasar o núcleo por telas secundárias — custo se inadequado: rodada posterior de UI.
- Ruling: React/Vite em municipal/ e domínio puro em demo/ — duas interfaces sem backend e mínimo rearranjo — custo se inadequado: refatoração local, sem dependência externa.
- Ruling: auxiliar Bash da skill falhou com caminhos/permissões Windows; usar apply_patch para pacotes de diff e ledger versionado em plan/evidence — mantém rastreabilidade sem insistir no auxiliar — custo: coordenação manual equivalente.

## Preflight

| Tarefas | Interface/arquivo compartilhado | Resultado |
| --- | --- | --- |
| 1 e 2 | demo/repository.ts, tipos, scripts | Task 2 começa após contrato e revisão da Task 1 |
| 1 e 3 | services/mockApi.ts, tipos, stores | Manter assinaturas; Task 3 integra cenários depois |
| 2 e 3 | package.json, tsconfig | Execução sequencial evita edições concorrentes |
| 1 | Testes de persistência vs adaptador assíncrono | Coerentes; erro deve propagar |
| 2 | UI vs dados sem backend | Coerentes; localStorage separado |
| 3 | Sessão/registro vs API legada | Preservar chamada existente; não autenticação real |

## Estado

- Auditorias concluídas: npm ls limpo; baseline com 5 erros TypeScript e 9 erros/1 aviso lint. Sem adb/emulador/Xcode no PATH. Fluxo atual pode chamar Gemini, não persiste relatos e contém botões sem ação.
- Task 1: complete (commits 5ff66fd..b85a17e, review approved). 12 testes e TypeScript passaram; lint de UI legado segue para Task 3.
- Task 1: minor (deferred): validar datas opcionais resolvedAt/comment.createdAt na restauração; carregar para Task 3 e revisão final.
- Task 2: implementação em andamento; base b85a17e; agente implement_dashboard.
- Task 3: pendente.

## Verificações do coordenador

- Após Task 1: export Expo web concluído (16 rotas), sem falhas de bundle. Avisos de ambiente NO_COLOR/FORCE_COLOR registrados; não são aprovação de execução nativa.
- Versão web antiga aberta em navegador local; confirmação visual de que a entrada ainda anuncia gov.br real. Correção já prevista na Task 3.
- Branch temporária feat/tcc-demo removida; implementação segue exclusivamente na main.
