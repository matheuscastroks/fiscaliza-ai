# SDD ledger — plan: plan/implementation/demo-v1.md

Planejamento inicial: cc5e793. Usuário autorizou implementação por subagentes e, em seguida, commits exclusivamente na main.

## Decisões de coordenação

- Ruling: trabalhar no checkout atual na main — instrução explícita do usuário, substitui isolamento padrão da skill — alterações são recuperáveis por commits locais.
- Ruling: primeira entrega é o ciclo demonstrativo essencial; ranking/pontos não receberão redesign completo — evitar atrasar o núcleo por telas secundárias — custo se inadequado: rodada posterior de UI.
- Ruling: React/Vite em municipal/ e domínio puro em demo/ — duas interfaces sem backend e mínimo rearranjo — custo se inadequado: refatoração local, sem dependência externa.
- Ruling: scripts auxiliares Bash indisponíveis no PATH; usar briefs do plano e ledger versionados em plan/evidence — preservar rastreabilidade em PowerShell — custo: arquivos de coordenação no histórico.

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

- Auditorias técnicas e de UX em andamento, somente leitura.
- Task 1: pendente.
- Task 2: pendente.
- Task 3: pendente.
