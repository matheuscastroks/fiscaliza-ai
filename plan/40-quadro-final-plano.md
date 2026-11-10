# Quadro final do plano de melhorias do frontend

Data: 2026-11-10. Cada linha cita o que existe no código e o tipo de evidência (C = código/testes automatizados; A = aparelho Android via adb; — = não feito). Estado de `main` no commit do quadro: app 159 testes e 30 testes `.ts` passando, typecheck passando, lint com 0 erros e 3 avisos, `back/` 32 testes passando.

## Fase 0 — bugs
| # | Item | Estado | Evidência |
| --- | --- | --- | --- |
| 1 | Bairro da aba Agir | feito | C (teste) + A |
| 2 | Push após logout / troca de usuário | feito (`reset`/`resync`) | C |
| 3 | Município fixo | feito (`municipalityId`, sessão) | C |
| 4 | `placesStore` gravando antes de carregar | feito | C (teste) |
| 5 | `focusId` e filtros do Território | feito | C (sem teste de tela) |
| 6–7 | Datas e unidades de prazo | feito (`formatDates`) | C (testes) |
| 8 | Tema do sistema | feito; só vale com app reconstruído | A (Samsung) |
| 9 | Botão de teste de push | só em dev | C |
| 10 | Sessão offline | feito (`NetworkError`/`ApiError`) | C + A (Xiaomi) |
| 11 | Erros não tratados | feito (`openExternal`, try/catch) | C |
| 12 | `signal` / `id!` | feito | C |

## Fase 1 — design system
- `DESIGN.md` reescrito; `PRODUCT.md` atualizado — C.
- Tokens: `elevation`, `iconSize`, `info`, `palette`, `fontSizes` — C.
- Componentes base: `Surface`, `IconButton`, `Chip`, `StatusBadge`, `IconTile`, `ListRow`/`InsetGroup`, `SectionHeader`, `ScreenState`, `CallSummary` — C (8 testes de render) + A (em uso).
- Trava anti-literais: oito categorias em zero, com teste — C.

## Fase 2 — fluxo
- Quatro abas com nomes e ícones únicos; menu lateral coerente — C + A.
- Entrada map-first: **decisão revertida a pedido do usuário** — o botão "Ver em lista · N chamados" que abre o bottom sheet ficou, e o sheet persistente foi removido — A.
- Onboarding em duas telas com "Pular" — A (Xiaomi e Samsung).
- Agir reordenado, montador de mensagem agora em bottom sheet — A (Samsung).
- Detalhe do chamado com atendimento oficial fixo — C (não percorrido por toque).
- Dados do bairro dividido (`NeighborhoodVolumeScreen`), sem rankings competitivos — A.
- Duplicatas (Lugares, CEP) — C.
- Promessas falsas removidas; apagar salvos com confirmação — C + A.
- `+not-found` pública — C.

## Fase 3 — migração visual
- Cores, fontes, pesos, raios, ícones, sombras e caixa alta em tokens — C.
- `CallSummary` único; `IconTile`; `InsetGroup` em Perfil, Agir, Preferências, Conta — C + A.
- **Não migrado:** blocos próprios `tableRow`/`insetTable` ainda existem em Preferências (parte), Lugares, Ajuda e outras telas; o KPI principal de Dados do bairro continua grande (agora com pergunta e fonte).

## Fase 4 — estrutura e testes
- Código morto e 5 dependências sem uso removidos — C (bundle Android exporta).
- Arquivos: `TerritoryScreen` 390 linhas; controlador dividido em `useTerritoryQueries` (387) e `useTerritoryView` (525); `ProfileScreen` 391; `ResultsScreen` 466; `PlaceSelector` 350; `TerritoryFilterModal` 563. Nenhum arquivo do plano passa de 600 linhas.
- `scopedPersistence` usado por `territoryStore` e `placesStore`; **`followStore` e `themeStore` mantêm filas próprias** — C.
- `useShallow`, `OPEN_STATUS`, `formatRadius`, `officialStatusColor`, `mutation()` restrito — C.
- Imagens do onboarding em WebP (~2,3 MB para ~540 KB) — C (peso medido; abertura não medida).
- Testes de render: renderizador mínimo para `node --test` (8 testes). **`@testing-library/react-native` não foi adotado** (exige Babel/Jest) — decisão de infraestrutura pendente.

## Extras pedidos depois do plano
- Diretriz de carga cognitiva e justificativa por tela (`plan/38`).
- Guia de UX Writing, glossário e teste que bloqueia jargão (`plan/39`, `tests/ux-writing.test.cjs`) — C; **não testado com moradores**.

## Jornadas no aparelho
| Jornada | Aparelho |
| --- | --- |
| Abrir, escolher área, ver chamados | Xiaomi + Samsung |
| Bairro pelo seletor (lista completa com busca) | Samsung |
| Salvar um chamado e reencontrá-lo em Salvos, inclusive depois de fechar e reabrir o app | Samsung |
| Modo escuro, fonte 1,5×, offline, localização negada | Xiaomi (offline com conta) e Samsung (fonte, offline) |
| Onboarding, Perfil, Conta e privacidade, Agir, Preferências, Dados do bairro, mensagem para o 1746 | Xiaomi e/ou Samsung |
| Não percorrido: detalhe do chamado por toque, Lugares/editor por toque, login e cadastro, apagar conta | — |

## Pendências reais
1. Decidir se adota um executor de testes de componentes (Jest + `@testing-library/react-native`).
2. Cadastrar no servidor os contornos dos demais bairros (a API devolve 1).
3. Configurar o `projectId` do EAS para os avisos funcionarem.
4. Testar os textos com moradores e aferir contraste/desempenho em aparelhos de entrada.
5. Migrar os blocos de lista restantes para `InsetGroup`/`ListRow` e levar `followStore`/`themeStore` ao `scopedPersistence`.
