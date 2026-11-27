# Estratégia de Profundidade, Contraste Tonal e Iluminação Direcional — `fiscaliza-ai`

> **Objetivo:** Substituir a divisão estrutural baseada em bordas (`borderWidth: 1` + `colors.border`) por uma hierarquia física baseada em **camadas tonais (tonal layering)**, **iluminação direcional (luz vinda de cima)** e **sombras multicamadas (`boxShadow` nativo do React Native 0.88.1)** — mantendo a identidade *"A cidade em primeiro plano"* e o tema *Azul-Petróleo Urbana* do `fiscaliza-ai`.
>
> **Escopo:** Este documento guia a refatoração geral de UI no app mobile (`front/`), cobrindo tokens em `front/theme/`, componentes em `front/components/ui/`, auditoria dos 28 arquivos com `borderWidth`, atualização de `front/DESIGN.md`, regras do ratchet test (`front/tests/design-literals.test.cjs`) e plano de execução em fases.

---

## 1. Princípios Fundamentais

### 1.1 O Problema das Bordas Planas
No estado atual (`front/DESIGN.md`), quase todo container (`Surface`, `AppInput`, `AppButton` secundário, `Chip`, `AppSelect`, cards de território e linhas de histórico) depende de `borderWidth: layout.borderWidth.hairline` (`1px`) com `colors.border` (`#D9E3E7` no claro / `#2D3036` no escuro) e `elevation.none`. Isso cria:
- **Ruído visual de grade:** excesso de linhas competindo com dados cívicos, mapas e tipografia.
- **Hierarquia achatada:** cards, inputs e grupos parecem colados no mesmo plano Z.
- **Falta de affordance tátil:** campos editáveis não parecem "rebaixados" para receber texto, e botões/cards interativos não parecem "elevados" acima do canvas.

### 1.2 Os Três Pilares da Nova Estratégia

1. **Camadas Tonais (Tonal Layering):**
   - Cada nível de profundidade tem sua própria luminosidade relativa ao `canvas`.
   - **Modo Claro:** superfícies elevadas são mais claras que o fundo (`#F3F4F6` -> `#FFFFFF` -> `#FFFFFF` com sombra maior); superfícies rebaixadas (wells/inputs/trilhos) são levemente mais escuras/frias que o card que as contém (`#E8EBEF` / `#ECEEF1`).
   - **Modo Escuro:** superfícies elevadas ficam progressivamente mais claras (`#121315` -> `#1B1D21` -> `#25282D` -> `#2D3036`), porque objetos próximos da fonte de luz superior captam mais luz; superfícies rebaixadas ficam mais escuras que o card (`#0C0D0F`).

2. **Iluminação Direcional (Luz de Cima para Baixo):**
   - Toda superfície **elevada** recebe:
     - **Highlight superior interno:** `inset 0 1px 0 rgba(...)` simulando a luz batendo na quina superior.
     - **Sombra de contato (contact shadow):** sombra curta, nítida e próxima (`0 1px 2px`), ancorando o elemento na superfície abaixo.
     - **Sombra ambiente (ambient shadow):** sombra difusa e mais longa (`0 4px 12px` ou `0 8px 24px`), comunicando distância real no eixo Z.
   - Toda superfície **rebaixada / côncava** (`AppInput`, `CitySearch`, `AppSelect`, trilho do `SlidingTabs`, wells de resumo) inverte a física da luz:
     - **Sombra interna no topo:** `inset 0 2px 4px rgba(...)` simulando a borda superior bloqueando a luz.
     - **Highlight interno na base:** `inset 0 -1px 0 rgba(...)` simulando a luz batendo na parede inferior interna do recorte.

3. **Zero `borderWidth` Estrutural (com Exceções Semânticas Claras):**
   - Bordas deixam de ser usadas para **separar layout**.
   - Permanecem apenas para **estados semânticos de alta prioridade** (foco de acessibilidade, erro de validação) ou **traços finos sobre mídia/mapa**, conforme matriz na Seção 5.

---

## 2. Arquitetura de Tokens (`front/theme/`)

> **Regra do Projeto (`front/tests/design-literals.test.cjs`):** Todo valor literal de cor (`hex`/`rgba`), raio e propriedade de sombra **deve** morar exclusivamente em `front/theme/`. Componentes em `app/`, `features/` e `components/` consomem apenas tokens via `useTheme()` e `useThemedStyles()`.

### 2.1 Paleta Tonal (`front/theme/colors.ts`)

Adicionar tokens semânticos de profundidade sem quebrar os tokens existentes (`canvas`, `surface`, `surfaceSubdued` continuam existindo para compatibilidade incremental):

| Token | Papel na Hierarquia | Light (`lightColors`) | Dark (`darkColors`) |
| :--- | :--- | :--- | :--- |
| `canvas` | Fundo raiz da tela (nível 0) | `#F3F4F6` *(atual)* | `#121315` *(atual)* |
| `surfaceRecessed` | Campos de entrada, trilhos (`SlidingTabs`), wells internos (nível -1) | `#E8EBEF` | `#0C0D0F` |
| `surface` | Cards base, grupos de lista (`InsetGroup`), botões secundários (nível +1) | `#FFFFFF` *(atual)* | `#1B1D21` *(atual)* |
| `surfaceRaised` | Cards interativos destacados, header chips ativos, selects abertos (nível +2) | `#FFFFFF` | `#25282D` |
| `surfaceFloating` | Bottom sheets, toasts, cápsula `AppTabBar`, botões flutuantes sobre mapa (nível +3) | `#FFFFFF` | `#2D3036` |
| `surfaceSubdued` | Estados desabilitados / skeleton / chips neutros sem elevação | `#ECEEF1` *(atual)* | `#22252A` *(atual)* |
| `dividerSubtle` | Separador interno de `InsetGroup` sem linha dura (opacidade suave) | `#DBDEE3` | `#353940` |

> **Nota sobre o Dark Mode:** No tema escuro, sombras pretas puras quase não aparecem sobre `#121315`. Por isso, **a escada tonal (`#0C0D0F` < `#121315` < `#1B1D21` < `#25282D` < `#2D3036`) somada ao highlight superior interno (`rgba(255, 255, 255, 0.06)` a `0.10`)** é o que cria a leitura nítida de profundidade sem precisar de bordas.

### 2.2 Sistema de Elevação com `boxShadow` (`front/theme/elevation.ts`)

O projeto roda em **React Native `0.88.1` (Expo `~58.0.26`, New Architecture)**, que suporta nativamente a propriedade CSS `boxShadow` em formato string, incluindo **múltiplas camadas separadas por vírgula** e **`inset`** tanto no iOS quanto no Android — sem dependências extras e sem disparar a regra `shadowProps` (`shadowOpacity|shadowRadius|shadowOffset|elevation`) do ratchet test fora de `theme/`.

Substituir o `elevation.ts` atual (`none` e `floating` apenas) por uma função/mapa consciente do tema (`getElevation(isDark)` ou `colors.elevation` exposto em `useTheme()`):

```ts
// Exemplo conceitual para front/theme/elevation.ts
export type ElevationLevel = 'none' | 'recessed' | 'subtle' | 'raised' | 'floating';

export function createElevationTokens(isDark: boolean) {
  if (isDark) {
    return {
      none: { boxShadow: 'none' },
      // Campos de input, trilhos, poços internos
      recessed: {
        boxShadow:
          'inset 0 2px 4px rgba(0, 0, 0, 0.45), inset 0 -1px 0 rgba(255, 255, 255, 0.05)',
      },
      // Surface padrão, InsetGroup, AppButton secondary, Chip ocioso
      subtle: {
        boxShadow:
          'inset 0 1px 0 rgba(255, 255, 255, 0.07), 0 1px 2px rgba(0, 0, 0, 0.35), 0 4px 10px rgba(0, 0, 0, 0.22)',
      },
      // Cards interativos de destaque, botões elevados, seleção ativa em trilhos
      raised: {
        boxShadow:
          'inset 0 1px 0 rgba(255, 255, 255, 0.10), 0 2px 4px rgba(0, 0, 0, 0.42), 0 8px 20px rgba(0, 0, 0, 0.28)',
      },
      // AppTabBar, IconButton floating, AppToast, BottomSheet, controles sobre mapa
      floating: {
        boxShadow:
          'inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 4px 8px rgba(0, 0, 0, 0.48), 0 12px 28px rgba(0, 0, 0, 0.38)',
      },
    } as const;
  }

  return {
    none: { boxShadow: 'none' },
    recessed: {
      boxShadow:
        'inset 0 2px 4px rgba(25, 45, 53, 0.08), inset 0 -1px 0 rgba(255, 255, 255, 0.85)',
    },
    subtle: {
      boxShadow:
        'inset 0 1px 0 rgba(255, 255, 255, 0.90), 0 1px 2px rgba(25, 45, 53, 0.06), 0 3px 8px rgba(25, 45, 53, 0.05)',
    },
    raised: {
      boxShadow:
        'inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 2px 4px rgba(25, 45, 53, 0.08), 0 8px 18px rgba(25, 45, 53, 0.08)',
    },
    floating: {
      boxShadow:
        'inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 4px 10px rgba(25, 45, 53, 0.12), 0 14px 30px rgba(25, 45, 53, 0.14)',
    },
  } as const;
}
```

### 2.3 Armadilha Crítica no React Native: `overflow: 'hidden'` + `boxShadow`
No arquivo atual `front/components/ui/Surface.tsx`, o container aplica:
```ts
overflow: 'hidden'
```
**Atenção:** No iOS e Android, `overflow: 'hidden'` no mesmo `View` que possui sombra externa **recorta a sombra**.
- **Regra de Implementação:** Quando uma `Surface` ou card precisar cortar conteúdo interno arredondado (ex.: imagem de capa, mapa embarcado ou linhas de `InsetGroup`), separe em dois nós:
  - **Wrapper externo:** `backgroundColor`, `borderRadius`, `boxShadow` (sem `overflow: 'hidden'`).
  - **Wrapper interno (opcional via prop `clipContent`):** `borderRadius`, `overflow: 'hidden'`.
- Para cards simples com apenas texto/padding, `overflow: 'hidden'` pode ser removido completamente.

---

## 3. Especificação por Componente Primitivo (`front/components/ui/`)

### 3.1 `Surface.tsx`
- **Antes:** `backgroundColor: colors.surface`, `borderWidth: 1`, `borderColor: colors.border`, `overflow: 'hidden'`.
- **Depois:**
  - Adicionar prop opcional `elevation?: 'none' | 'recessed' | 'subtle' | 'raised' | 'floating'` (padrão `'subtle'`) e `tone?: 'surface' | 'subdued' | 'recessed' | 'raised'` (padrão `'surface'`).
  - Remover `borderWidth` e `borderColor`.
  - Aplicar o token de `boxShadow` correspondente e só usar wrapper interno `overflow: 'hidden'` quando `clipContent` for necessário.

### 3.2 `AppInput.tsx` e `CitySearch.tsx`
- **Antes:** Caixa branca (`colors.surface`) com `borderWidth: 1`, `borderColor: colors.border` (`borderActive` no foco, `risk` no erro).
- **Depois (Recessed Well):**
  - Estado padrão: `backgroundColor: colors.surfaceRecessed` + `elevation.recessed`, **sem borda** (`borderWidth: 0`).
  - Estado desabilitado: `backgroundColor: colors.surfaceSubdued` sem sombra `recessed` pronunciada (aparência achatada/inativa).
  - Estado focado (`inputFocused`): fundo transiciona sutilmente para `colors.surface` (ou mantém `surfaceRecessed`) + **anel de foco** com `borderWidth: layout.borderWidth.focus` (`2`) e `borderColor: colors.borderActive` (mantido por acessibilidade e clareza tátil).
  - Estado de erro (`inputError`): `borderWidth: layout.borderWidth.focus` + `borderColor: colors.risk` (exceção semântica).

### 3.3 `AppButton.tsx`
- **Antes:** `secondary` usa `colors.surface` + `borderWidth: 1` + `colors.border`; `disabledContainer` usa `surfaceSubdued` + `borderWidth: 1`.
- **Depois:**
  - `primary` e `destructive`: mantêm preenchimento sólido (`colors.accent` / `colors.destructive`), ganham `elevation.subtle` (e highlight superior interno sutil para dar volume ao botão principal) e reduzem para `elevation.none` no `pressed`.
  - `secondary`: remove `borderWidth`/`borderColor`; usa `backgroundColor: colors.surface` + `elevation.subtle`. No `pressed`, troca para `colors.surfaceSubdued` + `elevation.none` (sensação de clique físico).
  - `quiet`: permanece transparente e plano (`elevation.none`).
  - `disabledContainer`: `backgroundColor: colors.surfaceSubdued`, `elevation.none`, sem borda.

### 3.4 `Chip.tsx`
- **Antes:** `idle` usa `colors.surface` + `borderWidth: 1` + `colors.border`; `selected` usa `colors.ink` + `borderColor: colors.ink`.
- **Depois:**
  - Remover `borderWidth` e `borderColor`.
  - `idle`: `backgroundColor: colors.surface` + `elevation.subtle` (ou `colors.surfaceRecessed` sem sombra se estiver dentro de uma barra já elevada, para não gerar "sombra sobre sombra" excessiva).
  - `selected`: `backgroundColor: colors.ink` (ou `colors.primary`) + `elevation.raised` leve para destacar a seleção ativa.

### 3.5 `SlidingTabs.tsx` e `AppSelect.tsx`
- **`SlidingTabs.tsx`:**
  - Trilho externo (`container`): remover `borderWidth`/`borderColor`, aplicar `backgroundColor: colors.surfaceRecessed` + `elevation.recessed`.
  - Pílula ativa (`indicator`): remover borda, aplicar `backgroundColor: colors.surface` + `elevation.subtle` (no dark mode: `colors.surfaceRaised`). O contraste entre o trilho afundado e o pill elevado torna o controle segmentado imediatamente legível.
- **`AppSelect.tsx`:**
  - Gatilho (`trigger`): segue exatamente o padrão `AppInput` (`colors.surfaceRecessed` + `elevation.recessed`, sem borda em repouso; borda apenas em foco/erro).
  - Opções dentro do `AppBottomSheetModal`: usar contraste tonal (`surface` vs `surfaceRaised` / `surfaceSubdued` no item selecionado) em vez de bordas em volta de cada linha.

### 3.6 `ListRow.tsx` (`InsetGroup`)
- **Antes:** `Surface` com borda externa + `divider` de `1px` sólido (`colors.divider`).
- **Depois:**
  - O container `InsetGroup` herda `Surface` sem borda (`elevation.subtle`, `clipContent: true` em wrapper interno).
  - Divisores internos entre linhas usam `colors.dividerSubtle` (baixa opacidade) com recuo horizontal (`marginHorizontal: spacing.md`) — ou espaçamento vertical (`gap`) com mini-superfícies quando forem itens independentes.

### 3.7 `IconButton.tsx`, `AppHeader.tsx`, `AppTabBar.tsx`, `AppToast.tsx`
- **`ThemeToggleButton`:** superfície flutuante sobre a foto ou a apresentação. Ao pressionar ou desabilitar, usa a superfície tonal sem sombra.
- **Badges:** use elevação sutil na marca sobre a foto e nos indicadores de estado de perfil e chamado. No chamado, preserve o texto e o ponto com a cor semântica do estado.
- **`IconButton`:**
  - Variante `surface`: remove `borderWidth`/`borderColor`; usa `colors.surface` + `elevation.subtle`.
  - Variante `floating` (sobre mapa/foto): usa `colors.surfaceFloating` + `elevation.floating`. Em modo claro sobre mapa claro, pode manter `hairline` translúcido apenas se o contraste com o mapa exigir (ver Seção 5).
- **`AppTabBar`:** já é uma cápsula flutuante; atualizar para usar o novo token `elevation.floating` unificado (com highlight superior no dark mode).
- **`AppToast`:** remover borda estrutural; usar `colors.surfaceFloating` + `elevation.floating` + barra/ícone lateral semântico para sucesso/aviso/erro.

---

## 4. Auditoria Completa de `borderWidth` (28 Arquivos)

Inventário levantado em `front/components/`, `front/features/` e `front/app/` com a estratégia de migração para cada arquivo:

### Grupo A — Primitivos de UI (`front/components/ui/` — 11 arquivos)
| Arquivo | Ocorrências | Ação Recomendada |
| :--- | :---: | :--- |
| `AppSelect.tsx` | 3 | Trocar trigger para `surfaceRecessed` + `elevation.recessed`; opções selecionadas por fundo tonal; manter borda só em erro/foco. |
| `CitySearch.tsx` | 2 | Trocar caixa de busca para `surfaceRecessed` + `elevation.recessed`; lista de resultados em `Surface` (`subtle`/`floating`). |
| `AppButton.tsx` | 2 | Remover borda de `secondary` e `disabled`; usar `elevation.subtle` + feedback tátil no `pressed`. |
| `Surface.tsx` | 1 | Remover borda padrão; adotar `elevation.subtle` e separar `overflow: 'hidden'` para não cortar sombra. |
| `AppInput.tsx` | 1 | Remover borda em repouso (`surfaceRecessed` + `recessed`); manter `borderWidth.focus` apenas para foco e erro. |
| `SlidingTabs.tsx` | 1 | Trilho `surfaceRecessed` + `recessed`; indicador ativo `surface`/`surfaceRaised` + `subtle`. |
| `ListRow.tsx` | 1 | Avaliar `divider` interno: suavizar para `colors.dividerSubtle` ou substituir por `gap` entre linhas onde aplicável. |
| `IconButton.tsx` | 1 | Remover borda da variante `surface`; usar `elevation.subtle` (ou `floating` sobre mapa). |
| `AppToast.tsx` | 1 | Remover borda externa; promover para `surfaceFloating` + `elevation.floating`. |
| `Chip.tsx` | 1 | Remover borda; diferenciar `idle` vs `selected` por contraste tonal e `elevation`. |
| `ItemLocationMap.tsx` | 1 | **Exceção avaliada:** se for contorno de recorte sobre tiles de mapa, manter hairline translúcido ou usar apenas sombra do card pai. |

### Grupo B — Território (`front/components/territory/` — 5 arquivos)
| Arquivo | Ocorrências | Ação Recomendada |
| :--- | :---: | :--- |
| `TerritoryClusterCarousel.tsx` | 4 | Substituir bordas dos cards do carrossel e badges por `Surface` (`raised`/`subtle`) e chips tonais. |
| `TerritoryFilterBar.tsx` | 3 | Barra e botões de filtro passam a usar `surface` / `surfaceRecessed` + `elevation.subtle` sem `borderWidth`. |
| `TerritoryPreviewCard.tsx` | 1 | Card de preview flutuante sobre o mapa: usar `surfaceFloating` + `elevation.floating` sem borda. |
| `TerritoryListView.tsx` | 1 | Substituir borda de item/separador por `Surface` (`subtle`) com `gap` entre cards. |
| `FacilityLoadMoreButton.tsx` | 1 | Alinhar ao padrão de `AppButton secondary` (superfície tonal + `elevation.subtle`, sem borda). |

### Grupo C — Ofício / Chamados (`front/components/official/` — 3 arquivos)
| Arquivo | Ocorrências | Ação Recomendada |
| :--- | :---: | :--- |
| `OfficialCallRow.tsx` | 3 | Migrar card de chamado e badges internos de bordas para camadas tonais (`surface` + `surfaceRecessed` para metadados). |
| `CallSummary.tsx` | 1 | Bloco de resumo dentro do detalhe: usar `surfaceRecessed` (well) sem borda. |
| `OfficialCallTimeline.tsx` | 1 | **Atenção:** se a ocorrência for a linha conectora vertical da timeline, **manter** (é conector gráfico, não borda de container); se for borda de card da etapa, remover. |

### Grupo D — Perfil e Features (`front/components/profile/` e `front/features/` — 6 arquivos)
| Arquivo | Ocorrências | Ação Recomendada |
| :--- | :---: | :--- |
| `components/profile/PostalCodeSheet.tsx` | 3 | Trocar caixas/opções com borda por `AppInput`/`Surface` tonais (`surfaceRecessed` vs `surface`). |
| `features/places/LocationEntryPrompt.tsx` | 3 | Substituir bordas de cards/opções de endereço por `Surface` (`subtle`/`raised`). |
| `features/places/RadiusControl.tsx` | 1 | Controle de raio usando trilho `surfaceRecessed` e botões/opções `surface` + `subtle`. |

### Grupo E — Telas (`front/app/` — 4 arquivos)
| Arquivo | Ocorrências | Ação Recomendada |
| :--- | :---: | :--- |
| `app/PlacesScreen.tsx` | 4 | Substituir cards e controles locais com `borderWidth` por `Surface` / `AppButton` / `AppInput` atualizados. |
| `app/(tabs)/TerritoryScreen.tsx` | 3 | Remover bordas de painéis/controles sobrepostos ao mapa; usar `surfaceFloating` + `elevation.floating`. |
| `app/(tabs)/FollowScreen.tsx` | 1 | Substituir borda de seção/card por `Surface` (`subtle`) ou well `surfaceRecessed`. |
| `app/SettingsScreen.tsx` | 1 | Usar `InsetGroup` / `Surface` sem borda para agrupamento das preferências. |

---

## 5. Matriz de Exceções (Onde `borderWidth` Continua Permitido)

Para evitar regressões de acessibilidade ou perda de contraste em casos extremos, **não** remova bordas nos seguintes casos:

1. **Foco de teclado / acessibilidade (`borderWidth.focus: 2`):** inputs, selects e botões focados mantêm `colors.borderActive` para conformidade visual clara.
2. **Erro de validação (`borderWidth.focus: 2`):** `AppInput` e `AppSelect` em estado inválido mantêm `colors.risk` além da mensagem de erro.
3. **Conectores gráficos:** linha vertical da `OfficialCallTimeline` (é um elemento de diagrama, não uma borda de caixa).
4. **Elementos sobre mapa de alto ruído:** caso `ItemLocationMap` ou controles flutuantes sobre tiles claros/satélite percam definição mesmo com `elevation.floating`, usar apenas `1px` translúcido sutil (`rgba`) definido como token em `colors.ts` — nunca borda cinza opaca.

---

## 6. Governança: Atualizações em `DESIGN.md` e Testes

### 6.1 Atualizar `front/DESIGN.md`
O documento atual declara explicitamente:
- *"Cartões, campos, cabeçalho e linhas de lista são planos"* e *"Don't: sombra fora de elementos flutuantes"*.

Ao iniciar a refatoração, atualizar `front/DESIGN.md` para documentar:
- Os 4 níveis de elevação (`recessed`, `subtle`, `raised`, `floating`) e a regra de luz vinda de cima.
- Os novos tokens `surfaceRecessed`, `surfaceRaised`, `surfaceFloating` e `dividerSubtle`.
- A substituição da regra *"bordas de 1px definem containers"* por *"contraste tonal + sombras multicamadas definem planos; bordas ficam restritas a foco, erro e conectores"*.

### 6.2 Compatibilidade com `front/tests/design-literals.test.cjs`
O ratchet test verifica `app/`, `features/` e `components/` para impedir aumento de:
- `hexColors` e `rgbaColors` fora de `theme/`
- `shadowProps` (`shadowOpacity|shadowRadius|shadowOffset|elevation`) fora de `theme/`
- `radiusLiterals`, `fontSizeLiterals`, `fontWeightLiterals`, `iconSizeLiterals`

**Por que a estratégia proposta passa sem quebrar o ratchet:**
1. Todas as strings de `boxShadow` (incluindo os `rgba(...)` dos highlights e sombras) ficam **exclusivamente em `front/theme/elevation.ts`**, expostas via `useTheme()`.
2. Os novos fundos tonais (`surfaceRecessed`, `surfaceRaised`, `surfaceFloating`, `dividerSubtle`) ficam **exclusivamente em `front/theme/colors.ts`**.
3. Os componentes em `components/`, `features/` e `app/` apenas aplicam `colors.surfaceRecessed` e `elevation.subtle` / `elevation.recessed` — mantendo `0` novos literais fora de `theme/`.

---

## 7. Roteiro de Refatoração em 4 Fases

### Fase 1 — Fundação de Tema e Documentação
1. Atualizar `front/theme/colors.ts` com `surfaceRecessed`, `surfaceRaised`, `surfaceFloating`, `dividerSubtle` (light e dark).
2. Atualizar `front/theme/elevation.ts` com `createElevationTokens(isDark)` usando `boxShadow` (`none`, `recessed`, `subtle`, `raised`, `floating`).
3. Expor `elevation` reativo ao tema em `front/theme/useTheme.ts` (ex.: `const { colors, elevation, isDark } = useTheme()`).
4. Atualizar `front/DESIGN.md` refletindo as novas regras de profundidade.
5. Rodar `npm test` em `front/` para garantir que o ratchet test segue verde.

### Fase 2 — Primitivos Centrais (`front/components/ui/`)
1. Refatorar `Surface.tsx` (remover `borderWidth`, adicionar `elevation` e `tone`, corrigir `overflow: 'hidden'`).
2. Refatorar `AppInput.tsx`, `CitySearch.tsx` e `AppSelect.tsx` (padrão côncavo `surfaceRecessed` + `recessed`).
3. Refatorar `AppButton.tsx`, `Chip.tsx`, `SlidingTabs.tsx`, `IconButton.tsx`, `ListRow.tsx` e `AppToast.tsx`.

### Fase 3 — Features e Telas (Eliminação dos `borderWidth` Restantes)
1. Migrar `components/territory/*` (5 arquivos) e `app/(tabs)/TerritoryScreen.tsx`.
2. Migrar `components/official/*` (3 arquivos, preservando o conector da timeline).
3. Migrar `components/profile/*`, `features/places/*`, `features/city/*` e demais telas (`PlacesScreen.tsx`, `FollowScreen.tsx`, `SettingsScreen.tsx`).

### Fase 4 — Validação Visual e Regressão
Checklist obrigatório em **Light Mode e Dark Mode** (iOS e Android / Expo Go ou dev build):
- [ ] **Sem corte de sombra:** verificar que cards com imagens/mapas internos não têm a sombra externa cortada por `overflow: 'hidden'`.
- [ ] **Legibilidade em Dark Mode:** confirmar que a escada tonal (`#0C0D0F` / `#121315` / `#1B1D21` / `#25282D` / `#2D3036`) + highlight superior `inset` separam claramente cards, inputs e modais sem parecerem "chapados".
- [ ] **Contraste sobre mapa:** validar `TerritoryPreviewCard`, `IconButton floating` e `AppTabBar` sobre o mapa claro e escuro.
- [ ] **Estados de foco e erro:** validar que `AppInput` e `AppSelect` continuam mostrando feedback inequívoco ao focar ou falhar validação.
- [ ] **Testes automatizados:** rodar `npm test` (incluindo `design-literals.test.cjs`), typecheck e lint em `front/`.
