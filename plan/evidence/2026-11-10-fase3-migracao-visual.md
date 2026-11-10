# Fase 3 — migração visual (evidência de código)

Data: 2026-11-10. Tipo de evidência: **código, testes automatizados e bundle Android de JavaScript (`expo export --platform android`)**. Não houve inspeção visual na web (o projeto não instala `react-native-web`) nem em dispositivo.

## Contagem de valores literais fora de `theme/`

Medida por `tests/design-literals.test.cjs` em `app/`, `features/` e `components/`.

| Categoria | Antes | Depois |
| --- | --- | --- |
| Cores hex | 102 | 0 |
| `fontSize` numérico | 115 | 0 |
| Pesos 700/800/900/bold | 88 | 0 |
| Raios numéricos de borda | 55 | 0 |
| Tamanhos de ícone numéricos | 199 | 0 |
| Propriedades de sombra | 21+ | 0 (a elevação só vem de `elevation.floating`) |
| Caixa alta espaçada (`letterSpacing`, `textTransform`) | 24 | 0 |
| `monospace` | 2 | 0 |

A trava falha se qualquer categoria voltar a crescer.

## O que mudou

- `theme/palette.ts`: cores de categoria, equipamentos e marcas externas (WhatsApp, gov.br).
- `fontSizes` (escala fechada de 6 tamanhos), pesos limitados a 400/500/600, raios por `layout.radius.*`, ícones por `layout.iconSize.*`.
- Elevação só em elementos flutuantes (tab bar, toast, controles sobre o mapa, carrossel); cartões, campos e botões ficam planos.
- Títulos em caixa alta viraram caixa normal; a fonte monospace saiu.
- `CallSummary` é o único miolo do chamado, usado por `OfficialCallRow` e `TerritoryPreviewCard`.
- `IconTile` substitui 13 cópias do quadrado de ícone em Agir, Perfil, Preferências, montador e CEP.

## Limitações

- O mapeamento de tamanhos foi mecânico: 9–12 → 12, 13–14 → 13, 15 → 15, 16 → 16, 18–22 → 21, 24–34 → 26. Textos que eram 10–11 ficam maiores e 14 fica menor. Nenhum contraste, quebra de linha ou densidade foi conferido em tela.
- As cores de categoria mudaram de matiz (Tailwind → derivadas da marca). Contraste dos marcadores sobre o mapa não foi medido.
- `CallSummary` mudou levemente espaçamentos e tamanhos dos badges.
- O KPI principal da tela de dados continua; a revisão "sem número gigante sem pergunta" fica para uma passada com dispositivo.
- Telas ainda usam seus próprios blocos `tableRow`/`insetTable` em vez de `InsetGroup`/`ListRow`; só Agir, Preferências e Dados do bairro usam os novos componentes em pontos específicos.
- Nenhum teste de render nativo foi executado.
