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
  record-card:
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

## Overview

**Creative North Star: "A cidade em primeiro plano"**

Reproduza a linguagem das três referências fornecidas pelo usuário: Instrument Sans, base clara, tinta escura, cápsulas, controles circulares, fotografias amplas e painéis inferiores arredondados. Aplique essa composição às contribuições e ao território, mantendo o conteúdo cívico e as jornadas de PRODUCT.md. O contrato de direção está em plan/17-identidade-referencia.md.

Este documento registra tokens e componentes do aplicativo cidadão presentes no código. Não redefine a arquitetura, a autoridade da API ou o painel municipal. O menu lateral e a barra inferior estão descritos conforme o código integrado; a revisão visual final permanece pendente. Documentação de código não comprova inspeção visual, gestos ou teclado em dispositivo nativo.

**Key Characteristics:**

- Fotografia contextual da contribuição, com alternativa editorial quando ausente e identificação dos exemplos ilustrativos.
- Uma ação principal escura por tarefa e controles de apoio circulares.
- Conteúdo legível, superfícies claras e situação sempre textual.
- Detalhe em painel acoplado à página, com expansão sem modal.

## Hierarquia orientada à jornada cidadã

### Home e lugares próximos

A Home usa uma lista curta de até cinco chamados do lugar selecionado, com acesso ao mapa e à lista antes dos resultados. Categorias, situação e período ficam em controles explícitos. O seletor de lugar se recolhe após mudar a seleção; o raio permanece visível em 500 m, 1 km, 2 km ou 5 km. Distâncias são aproximadas, em linha reta, e só aparecem quando os pontos existem.

A apresentação de localização antecede a permissão do sistema e oferece escolher bairro ou continuar. Mostrar horário e precisão da captura, inclusive aviso quando a precisão excede o raio. Após reiniciar, pedir nova captura por ação explícita. O editor de lugares tem nome, endereço/referência opcional e ponto confirmado, com alternativa por coordenadas; digitar endereço não move o marcador. Falhas preservam os campos. Salvos e lugares são descritos como dados deste aparelho, sem promessa de sincronização. Controles compactos de seleção têm alvo mínimo de 48, e o raio não oferece uma ação de limpar para valor inválido.

No mapa, o raio ativo aparece em metros com contorno tracejado e preenchimento discreto; bairro e busca por área visível removem esse círculo. O ponto azul com borda branca representa somente a última captura do aparelho, com halo de precisão e horário informado. Lugares salvos têm centro próprio identificado, sem assumir a identidade do GPS. Enquadrar o raio não bloqueia zoom em agrupamentos; uma recaptura recentraliza mesmo sem mudança de coordenadas. Evidência: `../plan/evidence/2026-11-06-mapa-raio-localizacao.md`.

Validação Android desta entrega e limites estão em `../plan/evidence/2026-11-06-home-entorno-configuravel.md`; não equivalem a validação iOS ou web.

Direção aplicada à jornada pública descrita em PRODUCT.md. Validação de código, navegador e aparelho são evidências distintas.

- **Home:** explorar o entorno é a ação principal. Salvos, demandas recentes e acesso ao atendimento dão continuidade. Contagens, rankings territoriais e gráficos não ocupam o protagonismo.
- **Território:** mapa e lista são duas formas de realizar a mesma descoberta. Camadas de serviços são opcionais, com seleção legível e recorte preservado. Nunca apresentar um equipamento como responsável por demandas próximas.
- **Chamado:** problema e localização orientam a leitura; situação, protocolo, prazo disponível e datas permitem fiscalizar. Salvar e acessar o atendimento oficial são ações distintas. Não aplicar linguagem de resolução confirmada a um simples encerramento administrativo.
- **Equipamento:** endereço, tipo e formas de contato dão utilidade à ficha. Não reutilizar apoio, avaliação de atendimento ou estados de chamados como se fossem propriedades do cadastro.
- **Aprofundamento:** gráficos entram quando respondem a uma pergunta identificável; origem e período ficam junto à informação. Falta de dados tem tratamento próprio, sem contagem zero artificial.

Preferir rótulos de tarefa, como “Explorar no mapa”, “Salvar chamado” e “Acessar atendimento oficial”. Evitar slogans e explicações repetidas. O conceito “seu bairro, mais perto” orienta a composição; não exige um novo bloco promocional na Home. Preservar Instrument Sans, tokens, modo escuro e componentes existentes.

## Colors

A paleta adota a identidade **Azul-Petróleo Urbana** (`#16576C`) combinada ao amarelo secundário de identidade (`#F4B400`), separando estruturalmente os papéis de marca, texto, navegação, seleção e estados cívicos.

### Marca e Logotipo (`AppBrandGlyph` e `AppBrandLockup`)

- **Grafia oficial**: **Fiscaliza aí**, sempre com espaço e acento, sem hífen. Assinatura institucional opcional: *"Seu bairro, em acompanhamento."*
- **Composição do símbolo**: marcador territorial azul-petróleo (`#16576C` no claro / `#79CBD5` ou `#FFFFFF` no escuro) abrigando as silhuetas dos morros, casas/bairros e o Cristo Redentor, com ponta inferior separada por faixa curva e três raios superiores em amarelo de marca (`#F4B400`).
- **Preservação bicolor**: `AppBrandGlyph` renderiza o pin (`brand-pin.svg` / `brand-pin-dark.svg` / `brand-pin-on-dark.svg`) e os três raios (`brand-sparkle.svg`) sem aplicar `tintColor` destrutivo, mantendo as duas cores da marca tanto em fundos claros quanto escuros.

### Identidade de Marca e Ações (`primary` / `accent` / `brandYellow`)

- **Azul-Petróleo** (`primary` / `accent`): `#16576C` (modo escuro: `#79CBD5`). Botões primários, links, seleção e destaques interativos.
- **Amarelo de Marca** (`brandYellow`): `#F4B400` (`onBrandYellow`: `#192D35`, contraste 7,92:1 WCAG AAA). Cor secundária de identidade para elementos da marca, detalhes pontuais e realce do logotipo sobre fundos escuros (9,32:1 a 10,25:1). Nunca usar indiscriminadamente em botões ou fundos amplos, nem confundir com o estado semântico `attention`.
- **Pills e Seleção Ativa** (`darkPill` e `borderActive`): `#16576C` (modo escuro: `#79CBD5`). A borda ativa de foco e as pílulas de filtros selecionados assumem a cor de marca.
- **Texto sobre Ações** (`onAccent` / `onPrimary`): `#FFFFFF` no tema claro; `#0E2A33` no tema escuro (garantindo legibilidade e alto contraste sobre os botões preenchidos).
- **Recipiente Suave** (`primaryContainer` / `surfaceSubdued` / `accentSoft`): `#E0EFF2` (modo escuro: `#1A2C34`). Destaques leves, apoio e filtros secundários.

### Conteúdo e Superfícies

- **Texto Principal** (`ink`): `#192D35` (modo escuro: `#F0F6F8`). Títulos, informações e leitura principal — tonalidade profunda distinta do azul de ação.
- **Texto Secundário** (`muted`) e **discreto** (`subtle`): `#556B73` e `#69818B` (modo escuro: `#8FA5AE` e `#748B94`). Metadados, datas, endereços e descrições secundárias.
- **Fundo Geral** (`canvas`): `#F3F7F8` (modo escuro: `#0B1316`). Fundo sutil frio e moderno.
- **Superfície** (`surface`): `#FFFFFF` (modo escuro: `#121E23`). Cartões, campos e cabeçalhos.
- **Bordas e Divisórias** (`border` e `divider`): `#D9E3E7` (modo escuro: `#20343D`). Contraste estrutural aprimorado (> 3:1) para contornos de cartões e inputs.
- **Navegação Flutuante** (`navigationSurface`): `#192D35` (modo escuro: `#121E23`), com seleção `#FFFFFF` (escuro: `#79CBD5`) e ícone ativo `#16576C` (escuro: `#0E2A33`).

### Estados semânticos

- `risk` / `riskSurface`: erro, risco explícito e ação destrutiva.
- `attention` / `attentionSurface`: atendimento que pede atenção.
- `completed` / `completedSurface`: conclusão confirmada.

**The Estado Factual Rule.** Recebida, pendente ou enviada usa tratamento neutro. Recebimento não significa risco; cor acompanha o texto e nunca substitui a situação fornecida pelo servidor.

## Typography

Use Instrument Sans em toda nova UI cidadã. A família é carregada localmente por `useFonts` em `app/_layout.tsx`, a partir dos TTF de `@expo-google-fonts/instrument-sans`: Regular (400), Medium (500), SemiBold (600) e Bold (700). A licença SIL Open Font License 1.1 está em `node_modules/@expo-google-fonts/instrument-sans/LICENSE_FONT`; autores: The Instrument Sans Project Authors. Preserve a licença ao redistribuir os arquivos. Não depende de requisição ao Google Fonts em execução.

`AppText` seleciona o arquivo pela espessura efetiva via `fontForWeight`. Não invente pesos sintéticos nem substitua por fonte nativa. Em previews HTML, use `"Instrument Sans", sans-serif`; o fallback não representa a fonte aprovada. Preserve o escalonamento de texto.

### Hierarchy

| Token          | Aplicação                                             |
| -------------- | ----------------------------------------------------- |
| `screenTitle`  | Título principal de tela.                             |
| `sectionTitle` | Seção, título do cartão e cabeçalho.                  |
| `body`         | Descrição, resposta e texto de formulário.            |
| `label`        | Ação e rótulo de campo, em caixa normal.              |
| `meta`         | Local, data, tipo e situação.                         |
| `protocol`     | Identificador com números tabulares (`tabular-nums`). |
| `caption`      | Ajuda e informação complementar.                      |

A escala normativa do frontmatter vem de `theme/typography.ts`; não possui razão modular fixa.

## Layout

Use `AppScreen`: largura fluida, limite de 760 unidades lógicas, centralização e áreas seguras. `px` no frontmatter é a representação para ferramentas web; React Native usa unidades lógicas, não pixels físicos. Não há breakpoint global de conteúdo; o menu lateral tem regra própria a partir de 600 unidades.

O ritmo parte de quatro unidades. Aliases reais: `contentPadding = lg`, `gutter = md`, `rowGap = sm` e `sectionGap = xl`. Listas cívicas usam padding de conteúdo, intervalo `xl` e espaço inferior de 120 para navegação. Filtros podem quebrar linha; não reduza alvos para caber.

No detalhe com foto, a posição inicial do painel é `min(320, max(180, altura × 0.32))`; a imagem alcança essa altura mais o raio superior. O painel expande até o topo. Sem foto, começa em oito unidades sob o cabeçalho convencional. Preserve área segura no rodapé e rolagem independente para conteúdo longo.

## Elevation & Depth

Cartões, campos, cabeçalho e painel acoplado são planos: a profundidade vem de cor, recorte e sobreposição. Texto sobre foto recebe um gradiente funcional de contraste: transparente → `rgba(15,18,20,0.78)` → `rgba(15,18,20,0.96)`, sem corte horizontal visível. Use `expo-linear-gradient` para compatibilidade com Expo Go. Sua ação recebe branco translúcido (`rgba(255,255,255,0.12)`). A barra inferior é sólida, sem blur, com sombra web (`0 8px 24px rgba(0,0,0,0.12)`), sombra iOS preta (deslocamento vertical 8, opacidade 0,12, raio 12) e elevação Android 4. Não espalhe essa sombra para os componentes de conteúdo.

A expansão do painel leva 220 ms; com movimento reduzido, é imediata. O gesto fica no puxador, preservando a rolagem, com botão acessível equivalente para expandir/recolher. Nunca use animação `entering` em `Marker`.

## Shapes

Use cápsulas em ações e campos de uma linha; círculos em voltar, abrir menu e avançar. Cartões fotográficos têm recorte amplo com `overflow: hidden`; o painel arredonda somente cantos superiores. Campos multilinha usam `panel`, sem esticar uma cápsula.

Raios normativos vêm de `theme/layout.ts`. Controles circulares de cabeçalho e cartões medem 48 × 48, raio 24. Bordas usuais têm uma unidade. O tema oferece espessura de foco de duas, mas `AppInput` atualmente muda a cor da borda de uma unidade.

## Components

### Buttons

`AppButton`: altura mínima de 54, padding `sm` vertical / `lg` horizontal, texto `label`. Use `primary` escuro, `secondary` branco com borda, `quiet` transparente e `destructive` semântico. Pressionado reduz opacidade (0,75). Carregamento substitui conteúdo por indicador e impede nova ação. Indisponível usa fundo secundário, texto discreto e opacidade (0,6). Declare bloqueio e carregamento acessíveis. Confirmação visual depende da resposta da API.

### Inputs / Fields

`AppInput`: orientação por placeholder no lugar de rótulo externo persistente, altura mínima de 56, fundo branco e borda clara. Foco muda borda para tinta; erro muda para risco e inclui mensagem anunciada. Indisponível usa fundo secundário. Multilinha tem altura mínima de 120 e padding superior `md`. Preserve ajuda, texto digitado e rascunho em falhas.

### Cards / Containers

`RecordCard` reúne tipo/situação, título, local/data e ação explícita. Com imagem válida, a fotografia absoluta preenche o fundo em `cover`; um espaçador de 148 antecede o conteúdo em fluxo, cuja altura cresce com o texto e a fonte. A faixa legível e o avanço circular branco permanecem no fluxo, sem altura fixa para o cartão. Sem imagem, ou em falha de carregamento, usa cartão editorial branco com resumo. Não preencha automaticamente um registro do cidadão com imagem de catálogo. Os exemplos acadêmicos têm origem e uso ilustrativo definidos abaixo. Padding `lg`, intervalo `xs`; pressionado reduz opacidade (0,82).


### Photo attachments and illustrative examples


Durante seleção e preparação, mostre o indicador no botão Adicionar foto, bloqueie novas seleções e remoções e comunique `preparing` ao formulário. Permissão recusada informa como autorizar ou continuar sem anexos. Erro de preparação ou envio exige mensagem textual e nova tentativa pela ação correspondente, conservando texto e fotos já escolhidos; não confirme publicação antes da resposta do servidor. Uma falha de carregamento da foto no cartão/detalhe usa a alternativa editorial existente.

As imagens de exemplo do cenário acadêmico são ilustrativas: não representam os locais fictícios dos registros nem comprovam serviço municipal. Fontes, autores, CC0 e preparação estão em `../back/data/demo-media/README.md`; a identificação da versão permanece em Sobre. Os arquivos são servidos localmente por `/api/demo-media/`, sem hotlink, e suas referências pertencem aos registros persistidos. A carga de cenário preenche apenas fotos ausentes dos registros controlados e preserva fotos enviadas, situações e interações. Isso não autoriza associar uma fotografia qualquer a um novo registro do cidadão.

### Attached detail panel

`DetailSheet` mantém a ficha do chamado oficial na mesma página, sem backdrop modal. O conteúdo rola e permite salvar o chamado. Erros ficam junto da ação, com recuperação visível.

### Header and navigation

`AppHeader` usa título, contexto territorial opcional e controles circulares brancos. O avatar interativo do início mede 48 × 48, com foto ou iniciais. Sobre foto, volta sobreposta; sem foto, cabeçalho no fundo da página. Ícones interativos exigem nome acessível e alvo mínimo de 48 unidades.

Para novos filtros, use cápsulas claras em repouso, escuras na seleção, texto legível e estado selecionado acessível.

`AppTabBar` implementa cápsula sólida em tinta: altura 64, raio 32 e largura 232, limitada à janela menos 32. São quatro alvos/círculos de 48, com gap de 8 e folga interna de 8 (congruente com a folga interna do campo de busca e botão de filtro); o ativo usa círculo branco e ícone escuro de 24. A barra é centralizada, com margem inferior `max(área segura, 16)`, some nas rotas internas e quando o teclado abre. Cada aba tem nome acessível e estado selecionado; pressionado reduz opacidade (0,75) e aplica micro-escala tátil com transição por física de mola (`Animated.spring`).

`SideMenu` preserva seu layout lateral de 90% da janela, com teto de 480 a partir de 600. A abertura leva 280 ms e o fechamento 240 ms, com duração zero em movimento reduzido. Os destinos refletem tarefas reais, incluindo Propor melhoria; não use pontuação fictícia, selo institucional sem fundamento ou indicadores inventados. Valores animados permanecem estáveis entre renderizações. A integração de código não substitui revisão final renderizada.

### Remote states and accessibility

Leituras remotas precisam de carregamento, erro com recuperação, vazio e conteúdo. `QueryState` fornece indicador e ação de tentar novamente. Falhas de atualização preservam conteúdo existente. Use situação textual, foco visível na web e suporte a teclado e leitor de tela. Exija contraste normal de pelo menos 4,5:1 e teste fonte ampliada. Evidência web permanece separada de dispositivo nativo; desempenho exige medição em release.

## Do's and Don'ts

### Composição conforme a participação

Compartilhe tipografia, superfícies, raios e espaçamentos, mas não uma ficha universal. A diferença precisa aparecer na tarefa e na hierarquia:

| Conteúdo | Card | Detalhe e ação central |
| --- | --- | --- |
| Ocorrência | Foto em fundo, contraste em gradiente, situação, endereço e engajamento | Evidência, linha de atendimento, apoio no topo e avaliação de 1–5 estrelas após conclusão |
| Melhoria | Foto horizontal sobre superfície branca, ideia legível e apoio comunitário | Foto de fundo com painel, percurso Recebida → Em análise → Decisão, justificativa e acompanhamento da decisão |
| Consulta | Prazo, alternativas com círculos de seleção e acesso à escolha | Cédula com seleção exclusiva; envio fixo no rodapé, confirmação e resultado com distribuição das respostas |
| Ação pública | Percentual e barra de execução, prazo e evidência compacta | Progresso no topo, atualizações de execução e evidências; acompanhar execução |

Não diferenciar apenas por cor ou prefixos. As alternativas no card são prévias; só a cédula do detalhe registra a resposta. Percentuais vêm do andamento informado ou das respostas registradas, sem progresso inventado.

Carrosséis e faixas de filtro ultrapassam o padding lateral até as bordas da tela; o primeiro e último elementos mantêm respiro interno. Preserve controles acessíveis e indicação de posição. O avatar de 48 fica à esquerda da saudação, separado por 12; a câmera à direita inicia o relato com foto.


Indicadores fictícios são permitidos nos cenários de apresentação por solicitação do responsável pelo projeto. Persistem separados das interações atribuíveis; não fabricar apoio da conta ativa nem substituir evidências enviadas. Fontes de fotos ilustrativas e a natureza dos números ficam documentadas em Sobre e nos créditos do banco.

### Do:

- **Do** usar Instrument Sans local, tokens de theme/ e componentes compartilhados antes de criar variações.
- **Do** mostrar foto enviada da contribuição, exemplo acadêmico explicitamente ilustrativo ou ficha editorial sem imagem, conforme a origem do registro.
- **Do** manter situação textual, ação concreta e retorno da gestão acima de contagens.
- **Do** preservar estados remotos, rascunhos, contexto territorial e alvos acessíveis.
- **Do** validar conteúdo longo, foto ausente, erro, expansão e fonte ampliada nas plataformas declaradas.

### Don't:

- **Don't** retornar ao azul de ação, à fonte nativa ou à paleta anterior deste documento.
- **Don't** converter recebimento ou pendência em risco, nem sucesso visual em gravação não confirmada.
- **Don't** usar fotografia turística como evidência, ranking competitivo, slogans ou vínculo institucional fictício.
- **Don't** acrescentar gradientes cosméticos, cards aninhados ou animação entering em Marker.
- **Don't** afirmar revisão visual concluída, teste nativo ou desempenho sem evidência específica.

### Perfil, menu e espaçamento de listas

O perfil apresenta cabeçalho suave com avatar circular de 76 unidades e badge de câmera, nome, e-mail selecionável e pill de estado "Cidadão Conectado". Os cards de métricas cívicas (Chamados salvos e Lugares salvos) utilizam visual suave e limpo, sem elevações agressivas ou sombras opacas (`shadowOpacity: 0`, `elevation: 0`). As opções de Configurações e Informações seguem rigorosamente a anatomia e estilo do menu lateral (`SideMenu.tsx`): linhas com ícone, título descritivo e chevron à direita com efeito press sutil. Ações de conta no rodapé oferecem Sair da Conta e Apagar Minha Conta (destrutivo com confirmação modal). Em Acompanhar, `cityStyles.section` define gap de 16 unidades entre os registros, sem margem própria nos cards.

### Modais e Bottom Sheets (`AppBottomSheetModal` / `BottomSheetView`)

Ao utilizar componentes baseados em `@gorhom/bottom-sheet` com redimensionamento dinâmico (`enableDynamicSizing`), os estilos de espaçamento **devem** ser declarados diretamente no `BottomSheetView`, pois seu posicionamento interno absoluto sobrepõe paddings de contêineres externos:
- `paddingHorizontal: spacing.contentPadding` (20px) para alinhamento horizontal com as margens do app.
- `paddingTop: spacing.md` (16px) com respiro entre o handle indicator e o primeiro elemento textual.
- `paddingBottom: Math.max(insets.bottom + spacing.md, spacing.xxl)` para respeitar a safe area de navegação por gestos/botões do Android e iOS.
- Conteúdos textuais de confirmação utilizam contêiner com `gap: spacing.xs` (8px) entre título e descrição explicativa, seguidos pelo bloco de ações verticais com `gap: spacing.xs`.

### Território e detalhes com foto

O Território divide-se em dois domínios exclusivos de exploração via abas superiores pill (`layout.radius.pill`): **Chamados 1746** (ocorrências urbanas) e **Serviços Públicos** (escolas, unidades de saúde e praças/lazer). Essa exclusividade impede poluição do mapa e conflito entre marcadores. Na barra de pesquisa, a alternância entre modo Mapa e modo Lista ocorre via botão de ação com ícone (`map-outline` / `list-outline`), enquanto o botão de filtros abre o painel inferior com rolagem interna contínua (`BottomSheetScrollView`), seletores contextuais do domínio ativo e botão de limpeza de filtros. Itens sem ponto permanecem acessíveis na lista, sem inventar coordenadas. O mapa é recortado por um contêiner de raio 28 com `overflow: hidden`. A foto de `DetailSheet` se estende até atrás da status bar; somente os controles e o painel expandido respeitam o inset superior. A barra inferior mede `min(largura - 64, 440)` e mantém o círculo ativo de 52 unidades em uma camada persistente.

### Menu por gesto

No celular, o menu abre por arraste horizontal iniciado nos 24 pontos da borda esquerda, com ativação após 12 pontos de movimento. Use AppDrawer (ReanimatedDrawerLayout da dependência existente) como contêiner da navegação; SideMenu contém somente os destinos e o visual. O painel acompanha o gesto e fecha por arraste para a esquerda, toque fora, controle Fechar ou retorno do Android. A seleção navega após o fechamento.

Habilite o gesto apenas nas quatro abas principais, com sessão autenticada e município confirmado. Telas de detalhes e formulários preservam sua navegação de retorno. O botão de abrir permanece na web e quando há leitor de tela ativo. O menu fechado não recebe foco; no navegador, o foco fica no painel aberto, Escape fecha e o foco retorna ao controle anterior. Não adicione detectores sobre o mapa nem novas animações a Marker.


### Assistência por foto no relato

Não usar card de sugestão automática. Foto antes de título/descrição inicia análise e sugere ambos os campos; o botão de IA não aparece. Foto inserida depois de texto revela ação circular de 56 ao lado de Escolher local. A análise só ocorre por esse botão neste segundo caso. Não sobrescrever edição feita durante a requisição; não chamar fallback textual de análise visual. O cidadão revisa o relato e segue para Local e Revisão.

## Telas amplas e desktop

A partir de 1100 px, o aplicativo cidadão usa navegação lateral persistente, área de conteúdo de até 1200 px e carrosséis com cards de até 360 px. Formulários de registro preservam o limite de 760 px. Abaixo desse ponto, mantém barra inferior, menu por gesto e composição móvel. Redimensionar a janela não remonta a árvore de rotas.


## Apresentação inicial e estados vazios

O onboarding apresenta exploração territorial, acompanhamento de chamados oficiais e acesso aos canais de atendimento. Não oferece envio de ocorrências ou participação dentro do aplicativo.

Usar somente os oito SVGs originais selecionados do pacote Notion Resources Freebie fornecido pelo usuário (procedência em assets/illustrations/README.md). Renderizar com expo-image e tintColor dinâmico de acordo com o tema (colors.ink), sem fundo artificial, adaptando os traços naturalmente entre os modos claro e escuro. Estados vazios ilustrados cobrem exploração e acompanhamento dos dados oficiais; erros de rede continuam com recuperação própria via QueryState.

## Camadas territoriais e fichas cadastrais

Preservar Instrument Sans, tokens e navegação. Camadas são seleções independentes com ícone, rótulo e estado de checkbox (alvo mínimo 44); não usar tabs mutuamente exclusivas. A lista horizontal alcança a borda. Filtros de atendimento e período afetam somente o 1746. Cada camada mantém carregamento, falha recuperável, contagem exibida/total e publicação próprias.

Equipamentos usam ficha cadastral sem foto genérica: categoria, nome oficial ou indicação de ausência, endereço, contatos, funcionamento informado e proveniência. Reutilizar DetailSheet, mapa arredondado e atualização por arraste; não oferecer apoio, avaliação ou status de atendimento a um cadastro. Polígonos de espaços públicos permanecem no detalhe. O marcador derivado não representa entrada.

A página do bairro separa equipamentos de demandas, preserva datas explícitas nos links e mostra indisponível em vez de zero quando faltar publicação ou vínculo. Contagens são cadastros com bairro confirmado; não sugerem capacidade ou qualidade. Mostrar data de importação separadamente da referência desconhecida. A apresentação inicial explica exploração pública, bairro, contribuição independente e acompanhamento de fontes, sem prometer respostas institucionais.
