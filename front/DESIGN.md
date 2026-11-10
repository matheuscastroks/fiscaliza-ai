---
name: Fiscaliza aí — aplicativo cidadão
description: Sistema visual territorial baseado nas referências aprovadas em 18/10/2026.
colors:
  primary: "#16576C"
  brandYellow: "#F4B400"
  ink: "#192D35"
  canvas: "#F3F7F8"
  surface: "#FFFFFF"
  surfaceSubdued: "#E0EFF2"
  muted: "#556B73"
  subtle: "#69818B"
  divider: "#D9E3E7"
  border: "#D9E3E7"
  borderActive: "#16576C"
  accent: "#16576C"
  accentPressed: "#0F3D4C"
  risk: "#9E3431"
  riskSurface: "#FCEDEC"
  info: "#2D5A9B"
  infoSurface: "#E6EEF8"
  attention: "#835916"
  attentionSurface: "#F9F2E0"
  completed: "#236B50"
  completedSurface: "#E7F2EC"
typography:
  screenTitle:
    fontFamily: Instrument Sans
    fontSize: "26px"
    fontWeight: 600
    lineHeight: "32px"
    letterSpacing: "-0.3px"
  sectionTitle:
    fontFamily: Instrument Sans
    fontSize: "21px"
    fontWeight: 600
    lineHeight: "27px"
    letterSpacing: "-0.2px"
  body:
    fontFamily: Instrument Sans
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
  label:
    fontFamily: Instrument Sans
    fontSize: "15px"
    fontWeight: 500
    lineHeight: "21px"
  meta:
    fontFamily: Instrument Sans
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "18px"
  protocol:
    fontFamily: Instrument Sans
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "18px"
  caption:
    fontFamily: Instrument Sans
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
rounded:
  xs: "6px"
  sm: "10px"
  button: "28px"
  card: "28px"
  panel: "20px"
  sheet: "32px"
  pill: "9999px"
spacing:
  xxs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  xxl: "32px"
  xxxl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.onAccent}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    padding: "12px 20px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    padding: "12px 20px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    padding: "12px 20px"
  button-destructive:
    backgroundColor: "{colors.risk}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    padding: "12px 20px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "12px 16px"
  surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
  detail-sheet:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
  navigation-bar:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    height: "72px"
    rounded: "36px"
  header-circle:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    width: "48px"
    height: "48px"
---

# Design System: Fiscaliza aí — aplicativo cidadão

## Visão geral

**Norte criativo: "A cidade em primeiro plano".** Instrument Sans, base clara, tinta escura, azul-petróleo (`#16576C`) como ação e amarelo (`#F4B400`) só como detalhe de marca. O app é de leitura e acompanhamento de dados oficiais: não recebe ocorrências, propostas, consultas ou ações públicas. Jornadas e limites estão em `../PRODUCT.md`.

Este documento é a fonte única dos tokens e componentes. A fonte de verdade dos valores é `theme/`; nenhuma tela usa cor hex, `fontSize`, raio, sombra ou tamanho de ícone literais (o teste `tests/design-literals.test.cjs` só permite diminuir os existentes). Documentação de código não comprova inspeção visual em dispositivo.

## Estrutura da informação

- **Navegação:** quatro abas fixas com ícone e rótulo — `Explorar` (mapa), `Salvos`, `Agir`, `Perfil`. O menu lateral repete os mesmos nomes e ícones e abre por gesto só nas abas principais.
- **Explorar (entrada):** mapa do recorte atual com um botão de resultados na base ("Ver em lista · N chamados") que abre a lista equivalente num bottom sheet; tocar num marcador mostra a prévia do chamado. Sem Mapbox a lista ocupa a tela.
- **Domínios exclusivos do território:** **Chamados 1746** e **Serviços Públicos** (escolas, saúde, praças). Nunca sobrepostos no mesmo mapa; o recorte (bairro, ou lugar com raio de 500 m, 1 km, 2 km ou 5 km) é compartilhado.
- **Chamado:** problema, local, situação publicada, protocolo, datas e prazo, nessa ordem. "Salvar chamado" e "Acessar atendimento oficial" são ações distintas, sem rolagem para a segunda.
- **Agir:** 1) "Já existe chamado? Veja no mapa"; 2) canais oficiais (telefone, WhatsApp, portal, Meus Protocolos); 3) preparar mensagem para o WhatsApp do 1746, recolhido. O texto deixa claro que quem envia é o morador, pelo canal oficial; o app não registra nem acompanha o envio.
- **Dados do bairro:** uma tela de aprofundamento; cada gráfico traz a pergunta, a fonte e o período. Sem ranking competitivo; sem número gigante sem pergunta.
- **Perfil:** identidade, duas métricas (salvos e lugares), domicílio e um menu curto (Preferências, Dados do bairro, Ajuda, Sobre e fontes, Conta e privacidade). Os chamados salvos ficam só na aba Salvos. Decisões raras e destrutivas (sair, apagar conta) ficam em `AccountScreen`, fora do Perfil.
- **Telas de apoio:** `AccountScreen` (conta e privacidade) e `NeighborhoodVolumeScreen` (bairros por volume, sem numeração de ranking) existem para aliviar Perfil e Dados do bairro; qualquer tela que passe de uma pergunta principal deve ser dividida assim, exceto o mapa.

**Diretriz de carga cognitiva.** Cada tela tem uma tarefa principal; conteúdos e ações são priorizados, o resto fica atrás de revelação progressiva ou vai para outra tela. Não sacrificar acessibilidade, descoberta nem eficiência de navegação só por minimalismo. Antes de mudar uma tela, justificar os elementos principais e apontar as fontes de sobrecarga; o estado atual está em `../plan/38-justificativa-ux-telas.md`.

Teste em cada tela: *onde estou? o que posso fazer aqui? para onde vou depois?* Rótulos de tarefa ("Salvar chamado"), nunca slogans.

## Cores

Papéis separados de marca, texto, navegação, seleção e estado. Valores claros e escuros em `theme/colors.ts`.

- **Ação:** `primary`/`accent` `#16576C` (escuro `#79CBD5`); texto sobre ação `onAccent`. Seleção ativa usa `darkPill`/`borderActive`.
- **Marca:** `brandYellow` `#F4B400` só em logotipo e detalhes pontuais; nunca como botão amplo nem como estado `attention`.
- **Conteúdo:** `ink`, `muted`, `subtle`; fundos `canvas`, `surface`, `surfaceSubdued`; bordas `border`/`divider`.
- **Estados:** `risk`, `attention`, `completed`, `info` (cada um com `…Surface`). Em andamento usa `primary`; aberto usa `info`. Cor acompanha o texto e nunca substitui a situação do servidor. Recebida/pendente é neutro, não risco.
- **Categorias e equipamentos:** paleta derivada da marca em `theme/` (claro/escuro), sem cores Tailwind/Material.
- **Logotipo:** grafia **Fiscaliza aí**; `AppBrandGlyph` preserva as duas cores do símbolo, sem `tintColor`.

## Tipografia

Instrument Sans local (`useFonts` em `app/_layout.tsx`), pesos 400/500/600; 700 só em `display`, se existir. Não existem 800/900. `AppText` escolhe o arquivo por `fontForWeight`.

| Token | Uso |
| --- | --- |
| `screenTitle` | título de tela |
| `sectionTitle` | seção e título de cartão |
| `body` | texto corrido |
| `label` | ações e rótulos, em caixa normal |
| `meta` | local, data, tipo, situação |
| `protocol` | identificadores, `tabular-nums` |
| `caption` | ajuda e complemento |

Sem CAIXA ALTA espaçada. Preserve o escalonamento de texto do sistema.

## Layout, formas e elevação

- `AppScreen`: largura fluida até 760, áreas seguras. Ritmo de 4 (`spacing`): `contentPadding = lg`, `gutter = md`, `rowGap = sm`, `sectionGap = xl`. Acima de 1100 há navegação lateral e conteúdo até 1200.
- **Raios** (`layout.radius`): `xs`, `sm`, `panel`, `card`, `sheet`, `pill`. Cápsulas em ações e campos de uma linha; círculos de 48 em voltar/menu; campo multilinha usa `panel`.
- **Ícones** (`layout.iconSize`): `sm 16`, `md 20`, `lg 24`.
- **Elevação** (`theme/elevation.ts`): só `none` e `floating`. Cartões, campos, cabeçalho e linhas de lista são planos. `floating` é para tab bar, sheets e botões sobre o mapa. Texto sobre foto usa gradiente funcional de contraste.
- Alvos de toque de pelo menos 48. Nunca animação `entering` em `Marker`; movimento reduzido torna transições imediatas.

## Componentes

Cada componente tem variantes fechadas e estados acessíveis.

- `AppButton`: `primary` (cor de ação), `secondary` (branco com borda), `quiet` (transparente, texto `ink`), `destructive` (`risk`). Altura mínima 54; um botão primário por tela; carregamento e bloqueio declarados; confirmação visual só após a resposta da API.
- `AppInput`: placeholder no lugar de rótulo persistente, altura mínima 56; foco muda a borda; erro usa `risk` com mensagem anunciada; preserva texto em falhas.
- `AppHeader`: título, contexto territorial opcional e controles circulares. Ícones interativos exigem nome acessível.
- `AppTabBar`: cápsula sólida de tinta, altura 64, quatro alvos de 48, ativo em círculo branco; some em rotas internas e com teclado aberto.
- `SideMenu`/`AppDrawer`: destinos reais, sem pontuação fictícia nem selo institucional; o botão de menu existe em todas as abas principais.
- `DetailSheet`, `AppBottomSheetModal`: espaçamento declarado no `BottomSheetView` (`paddingHorizontal: contentPadding`, `paddingTop: md`, `paddingBottom: max(insets.bottom + md, xxl)`).
- Base compartilhada: `IconButton`, `Chip` (claro em repouso, escuro selecionado), `StatusBadge`, `IconTile`, `ListRow`/`InsetGroup`, `Surface` (plano, proibido aninhar), `SectionHeader`, `ScreenState` (carregando, erro com nova tentativa, vazio com ação) e `CallSummary` (miolo único do chamado, usado na lista e no sheet). Telas antigas ainda têm blocos próprios que devem migrar para esses componentes.

Estados remotos: toda leitura tem carregando, erro recuperável, vazio e conteúdo; falha de atualização preserva o conteúdo anterior.

## Do / Don't

**Do:** usar tokens de `theme/` e componentes compartilhados antes de criar variações; mostrar situação textual e a próxima ação; informar origem e período dos dados; testar conteúdo longo, erro, vazio, fonte ampliada, claro e escuro.

**Don't:** valores literais fora de `theme/`; sombra fora de elementos flutuantes; card dentro de card; ranking competitivo; slogans ou vínculo institucional fictício; confundir encerramento administrativo com resolução; fotografia genérica como evidência; afirmar revisão visual, teste nativo ou desempenho sem evidência específica.

## Camadas e fichas cadastrais

Equipamentos usam ficha sem foto genérica: categoria, nome oficial ou aviso de ausência, endereço, contatos, funcionamento informado e proveniência. Sem apoio, avaliação ou status de atendimento. Polígonos de espaços públicos ficam no detalhe; o marcador derivado não indica entrada. Contagens são cadastros com bairro confirmado e não sugerem capacidade ou qualidade; faltando publicação, mostrar "indisponível" e não zero.

No mapa, o raio ativo aparece em metros com contorno tracejado. O ponto azul com borda branca é só a última captura do aparelho, com horário e precisão; lugares salvos têm centro próprio.

## Apresentação inicial e estados vazios

O onboarding tem até duas telas, com "Pular" sempre visível, e descreve só o que existe: explorar dados oficiais, salvar para acompanhar, achar o canal oficial. Depois pede o bairro, ou a localização por ação explícita. Estados vazios usam as ilustrações de `assets/illustrations/` com `tintColor` do tema. Sem resultado: ação "Acessar atendimento oficial" e o aviso de que ausência aqui não prova ausência de chamado no 1746.
