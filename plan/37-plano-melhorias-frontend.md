# Fiscaliza aí — plano de melhorias do frontend

## Contexto

Boa parte do frontend (`front/`) foi gerada com outra IA. A auditoria (código, design e fluxos) mostrou:

- **Código:** a base é razoável (TanStack Query, zustand, TS sem `@ts-ignore`, sem mocks), mas tem bugs de lógica, estado duplicado, arquivos gigantes, ~860 linhas mortas e testes que só verificam texto do código-fonte.
- **Design:** os tokens em `front/theme/` são bons e completos (claro/escuro), mas pouco usados: ~106 cores hex soltas, 115 `fontSize` literais (15 tamanhos diferentes), pesos 800/900 que não existem, sombras em 14 arquivos, cores Tailwind/Material, KPIs e títulos em CAIXA ALTA. É isso que dá a "cara de IA", não a paleta.
- **Fluxo:** sem Home, menu lateral inacessível no mapa e quebrado no Perfil, telas órfãs (`NeighborhoodScreen`), duplicatas (Lugares e CEP em tela + sheet), nomes inconsistentes (Salvos/Acompanhar, bookmark/coração), promessas de "alertas automáticos" que o produto nega.
- **Docs:** `front/DESIGN.md` contradiz a si mesmo (3 especificações da tab bar, seções de participação removida, camadas "checkbox" vs "abas exclusivas").

**Decisões tomadas com o usuário:**
1. Identidade visual: **manter e disciplinar** (azul-petróleo, amarelo, Instrument Sans, marca). Nada de repaginar a paleta.
2. Aba Agir: **manter o montador de mensagem WhatsApp**, reescrevendo a linguagem (quem envia é o morador, pelo canal oficial) e atualizando PRODUCT.md.
3. Entrada: **map-first** com bottom sheet persistente de resumo ("perto de você" + salvos). PRODUCT.md passa a descrever isso no lugar da Home.

Ordem de execução: **Fase 0 (bugs) → Fase 1 (fundação do design system) → Fase 2 (fluxo/IA) → Fase 3 (migração visual tela a tela) → Fase 4 (refatoração estrutural e testes)**. Cada fase vira um ou mais commits/PRs independentes (`fix:`, `feat(ui):`, `refactor:`).

---

## Plano A — Correções e refatoração de código

### Fase 0 — Bugs graves (fazer primeiro, PR pequeno)

| # | Problema | Arquivo | Correção |
|---|---|---|---|
| 1 | Aba Agir nunca preenche o bairro (lê `territoryStore.neighborhood`, que ninguém seta) | `app/(tabs)/ParticipateScreen.tsx:63` | Ler `placesStore.selection` (bairro/lugar ativo); remover `neighborhood/setNeighborhood` de `stores/territoryStore.ts` |
| 2 | Push continua do usuário anterior após logout; novo usuário nunca registra | `stores/notificationStore.ts:45`, `stores/authStore.ts:96-105` | Resetar `pushToken`/inscrições no logout e re-sincronizar salvos ao trocar de sessão; registrar falhas de follow para retry |
| 3 | Município `'3304557'` fixo em 25 lugares (inclusive query keys); `requestPermissions()` sem cidade | `features/territory/usePublicData.ts`, `SettingsScreen.tsx:207`, stores | Ler município da sessão (regra do AGENTS.md); constante única `DEFAULT_MUNICIPALITY` só como fallback anônimo |
| 4 | `placesStore.save()` grava antes de carregar → apaga lugares salvos | `stores/placesStore.ts:50-75` | Aguardar `initialization` como `followStore.persist` faz (linha 117) |
| 5 | Efeito do `focusId` desfaz troca para Serviços; refetch de bairros reseta filtros | `app/(tabs)/TerritoryScreen.tsx:193-212, 253-267` | Aplicar `focusId` uma vez (ref de "já consumido") e limpar o param; não depender de identidade de `neighborhoods.data` |
| 6 | Datas `YYYY-MM-DD` aparecem um dia antes (UTC-3); prazo vence às 21h da véspera | `OfficialCallRow.tsx`, `TerritoryPreviewCard.tsx`, `OfficialCallDetailsScreen.tsx`, `features/city/officialCallStatus.ts` | Módulo único `features/city/formatDates.ts` (data-only = data local; relativo; prazo D/H/M) reaproveitando a lógica correta de `OfficialCallTimeline.tsx:33` e `OfficialCallDetailsScreen.tsx:124-150` |
| 7 | "Restam 3d" para 3 meses | `OfficialCallRow.tsx:101`, `TerritoryPreviewCard.tsx:170` | Resolvido pelo formatador único do item 6 |
| 8 | Modo escuro do sistema nunca segue o SO no nativo | `front/app.config.js:14` (`userInterfaceStyle: 'light'`) | Trocar para `'automatic'` |
| 9 | Botão "Testar notificação" em produção | `app/SettingsScreen.tsx:58-68,220` | Gate `__DEV__` |
| 10 | Usuário logado que abre offline vira anônimo e "perde" salvos | `stores/authStore.ts:50` | Distinguir erro de rede (manter sessão em cache, status "offline") de 401 |
| 11 | Erros não tratados | `MapboxMapView.tsx:324`, `services/http.ts:159`, `FacilityDetails.tsx` (`openURL` no catch), `ParticipateScreen` (`void Linking.openURL`), `avatarStore.load` | try/catch + toast; helper `openExternal(url, fallback)` em `services/` |
| 12 | Requisições de equipamento sem `signal`/`id!` | `features/territory/usePublicData.ts:47,59,76`, `services/publicData.ts` | Passar `signal`; `enabled: !!id` em vez de `id!` |

Cada correção acompanha teste de comportamento (padrão `.cjs` com `transpileModule + vm` já existente em `front/tests/`).

### Fase 4 — Refatoração estrutural (depois da migração visual, para não refazer duas vezes)

- **Quebrar arquivos gigantes:**
  - `components/territory/TerritoryFilterBar.tsx` (1462 linhas) → `TerritorySearchBar`, `TerritoryChipRow`, `TerritoryFilterSheet` + estilos.
  - `app/(tabs)/TerritoryScreen.tsx` (880, ~15 effects) → hook `useTerritoryController` com a lógica de seleção/foco/câmera; a tela só compõe.
  - `features/places/PlaceSelector.tsx`, `app/(tabs)/ProfileScreen.tsx`, `app/ResultsScreen.tsx`.
- **Persistência:** extrair o padrão repetido nas stores (promise de inicialização, fila de escrita, geração de escopo usuário+município) para `stores/createScopedPersistence.ts`, usado por follow/places/territory/theme.
- **Estado de bairro:** uma fonte só (`placesStore.selection` = ativo; `preferredNeighborhood` = preferência). Remover a store oculta em `features/places/useTerritoryFilters.ts` ou movê-la para `stores/` com reset no logout.
- **Duplicatas:** um `formatRadius/getPlaceIcon` (`features/places/`), um serviço de CEP (`services/postalCode.ts`) usado por `MunicipalityScreen` e `PostalCodeSheet`, um `TerritoryLayer`, constante `OPEN_STATUS` no lugar de `'Não Encerrado'`, uma função de cor de status (remover `getStatusSemanticColor` de `ResultsScreen`).
- **Performance:** seletores em todas as stores (`useAuthStore(s => s.x)` em vez da store inteira — `_layout.tsx:61`, `FollowScreen`, `SettingsScreen` etc.); `useCallback` no `onPress` de `FollowScreen.tsx:181`; `mutation()` em `services/http.ts:116` invalidar só as chaves afetadas; converter `assets/images/onboarding-*.jpg` (1–1,3 MB) para WebP redimensionado.
- **Código morto:** remover `AppBottomSheet`, `AppDivider`, `ProgressiveList`, `Engagement`, `features/city/CitizenAction.tsx`, `CityCarousel.tsx`, `municipalContext.ts`, `features/home/CategoryChips.tsx`, `NearbyCalls.tsx` (avaliar reaproveitar `NearbyCalls` no sheet da Fase 2 antes), exports não usados. `RecordCard` é avaliado na Fase 1. Dependências sem import (`mapbox-gl`, `react-native-webview`, `expo-blur`, `expo-symbols`, `@expo/ui`…) só saem após checar `app.config.js` plugins.
- **Tipos:** tipar `icon` em `officialCategoryThemes.ts` como `ComponentProps<typeof Ionicons>['name']`; restringir `AppText` `color` a chaves do tema; corrigir `TerritoryScreen.tsx:207` (`as 'school'`).
- **Testes:** substituir os ~20 testes que fazem `content.includes('borderRadius: 12')` por testes de comportamento; instalar `@testing-library/react-native` (via `npx expo install`) para render tests dos componentes base e estados (loading/erro/vazio).

---

## Plano B — Fluxo do usuário e arquitetura da informação

### Jornada-alvo (a partir do texto de UX)

Descobrir → Fiscalizar → Agir, com revelação progressiva:

| Momento | O que aparece |
|---|---|
| Abertura | Mapa do recorte atual + sheet recolhido "Perto de você · N chamados · atualizado em …" + barra de busca |
| Puxar o sheet | Lista equivalente ao mapa (é o mesmo `TerritoryListView`, agora sempre presente), atalho "Seus salvos (N)" |
| Toque no marcador | Sheet passa a mostrar o resumo do chamado (problema, local, situação, prazo, salvar) — substitui o card flutuante |
| Expandir | Ficha completa (`OfficialCallDetailsScreen`) |
| Nada encontrado | Estado vazio com "Acessar atendimento oficial" + texto "ausência aqui não prova que não exista chamado no 1746" |

Teste das 3 perguntas em cada tela: *Onde estou? O que posso fazer aqui? Para onde vou depois?*

### Mudanças

1. **Entrada map-first com sheet persistente** (`app/(tabs)/TerritoryScreen.tsx`, `components/territory/TerritoryListView.tsx`): o sheet da lista vira persistente (snap recolhido ~15%, médio, alto) em vez de ser aberto por "Ver em lista". O preview do marcador (`TerritoryPreviewCard`) passa a ser um estado do mesmo sheet. Sem Mapbox (Expo Go/web) o sheet já fica expandido como lista — hoje o mapa nunca aparece nesses ambientes, documentar isso.
2. **Primeiro acesso** (`features/onboarding/OnboardingFlow.tsx`): reduzir para 2 telas, opcional ("Pular" sempre visível), linguagem fiel: explorar dados oficiais, salvar para acompanhar, encontrar o canal oficial. Remover "Receba avisos automáticos" e "Cobre melhorias com 1 toque". Depois, pedir bairro (ou "usar minha localização" por ação explícita) — garante que o mapa abre num recorte útil.
3. **Navegação** — 4 abas, nomes e ícones únicos em toda a app:
   - `Explorar` (map) · `Salvos` (bookmark — header e menu também dizem "Salvos"; trocar coração por bookmark no preview, detalhe e empty state) · `Agir` (ícone `chatbubbles`/`call` em vez de megafone) · `Perfil`.
   - Menu lateral (`components/ui/SideMenu.tsx`): remover "Início" duplicado; habilitar o botão no Perfil ou remover o botão dele (`components/ui/AppDrawer.tsx` `MAIN_TABS`); adicionar botão de menu no Explorar.
4. **Aba Agir** (`app/(tabs)/ParticipateScreen.tsx`, `features/city/QuickComplaintKit.tsx`): manter o montador, reescrito:
   - Ordem: 1) "Já existe chamado? Veja no mapa" (atalho), 2) canais oficiais (telefone, WhatsApp, portal, Meus Protocolos), 3) "Preparar mensagem para o WhatsApp do 1746" recolhido (revelação progressiva).
   - Copy: "Você envia pelo WhatsApp oficial da Prefeitura. O Fiscaliza aí não registra nem acompanha esse envio." Remover "envie em segundos diretamente". Remover a assinatura "Registrado com auxílio do aplicativo Fiscaliza aí" (ou torná-la opcional).
   - Bairro vindo do recorte ativo (bug #1).
5. **Detalhe do chamado → Agir**: botão "Acessar atendimento oficial" visível sem rolar; mini-mapa "expandir" volta ao mapa existente (`router.back` quando veio do mapa) em vez de empilhar outro.
6. **Aprofundamento** (`app/ResultsScreen.tsx`, `app/NeighborhoodScreen.tsx`): unificar em uma tela "Dados do bairro" acessível pelo seletor de recorte e pelo menu; remover rankings "Bairros que mais cumprem prazo/resolução mais lenta" e a pílula "vs média do Rio" (regra: sem ranking competitivo). Cada gráfico com pergunta, fonte e período.
7. **Duplicatas**: Lugares = só `PlacesScreen` (Perfil navega para ela; remover `PlacesSheet`); CEP = só `PostalCodeSheet` reaproveitado por `MunicipalityScreen`.
8. **Promessas falsas**: remover "alertas automáticos" de Settings/onboarding ou condicionar a texto factual ("quando o app sincroniza novos dados do 1746"); Settings ganha "Apagar salvos" com confirmação (exigido pelo PRODUCT.md). Registro: retirar "participar da sua cidade".
9. **Redirect de rota desconhecida** vai para `+not-found` e não para Login (`app/_layout.tsx` + `shared/citizen-navigation.ts`).

---

## Plano C — Design system (padronização)

Princípio: **tokens e componentes primeiro, depois migrar telas**. Nada de valores literais fora de `front/theme/`.

### Fase 1 — Fundação

1. **Corrigir a fonte da verdade:** reescrever `front/DESIGN.md` enxuto — remover seções de participação/foto/IA/Melhoria/Consulta/Ação pública, uma única especificação da tab bar, esclarecer domínios exclusivos (Chamados × Serviços). Atualizar `PRODUCT.md` (map-first + sheet; Agir com montador).
2. **Tokens novos** em `front/theme/`:
   - `elevation.ts`: só `none` e `floating` (tab bar, sheet, botões sobre o mapa). Fim das 13 opacidades diferentes.
   - `iconSize` em `layout.ts`: `sm 16`, `md 20`, `lg 24` (substitui 14 tamanhos).
   - Raios: manter `xs/sm/panel/card/sheet/pill`; banir literais 2–27.
   - Cores semânticas extras para o que hoje é Tailwind: `info/infoSurface` (status "em andamento", no lugar de `#1D4ED8`), `categoryPalette` (8–11 tons derivados da marca, claro/escuro) substituindo `officialCategoryThemes.ts`, e cores de equipamentos (`features/territory/selectors.ts`) viram tokens.
   - Tipografia: manter os 7 tokens; adicionar no máximo `display` (para números grandes do aprofundamento) e `overline` só se necessário — **sem caixa alta**. Pesos permitidos: 400/500/600 (700 só em `display`).
3. **Componentes base** em `front/components/ui/` (cada um com variantes fechadas, alvo ≥ 48, estados acessíveis):
   - `AppButton` (existe; ajustar `quiet` = ink, `destructive` = `risk` conforme spec) + `IconButton` (círculo 48, substitui `iconCircle`, botões de mapa, `GovBrButton` interno).
   - `Chip` (filtro: claro em repouso, escuro selecionado; usado em `TerritoryFilterBar`, `RadiusControl`, `CategoryChips`, `SlidingTabs`).
   - `StatusBadge` (situação textual + cor semântica, usa `officialCallStatus`), `MetaLabel` (protocolo, órgão, data com ícone).
   - `IconTile` (ícone em quadrado suave — substitui os ~10 `iconSquircle` copiados).
   - `ListRow` / `InsetGroup` (linha com ícone, título, subtítulo, chevron — Settings, Perfil, Agir, SideMenu, Lugares).
   - `Surface` (cartão plano, sem sombra, raio `card` ou `panel`; proibido aninhar).
   - `SectionHeader` (substitui 7 `sectionHeaderRow`).
   - `ScreenState` (loading / erro com retry / vazio ilustrado com ação) — move `QueryState` de `features/city/CityUI.tsx` e `IllustratedEmptyState` para `components/ui/`.
   - `CallSummary` — o miolo único do chamado (categoria, título, local, status, prazo, protocolo) usado por `OfficialCallRow` e pelo sheet do mapa, eliminando os blocos copiados em `OfficialCallRow.tsx:355-500` e `TerritoryPreviewCard.tsx:401-534`.
   - `RecordCard`: deletar (está morto e descreve fluxo removido).
4. **Guarda automática:** regra ESLint (`no-restricted-syntax`) ou teste que falha com hex/`fontSize` literais em `app/`, `features/`, `components/` (exceto `theme/`). Assim o Gemini/qualquer IA não volta a espalhar valores.

### Fase 3 — Migração tela a tela (ordem por impacto)

1. `TerritoryScreen` + `TerritoryFilterBar` + `PlaceSelector` + `MapboxMapView` (cores de marcador `#0072BB` → token)
2. `OfficialCallDetailsScreen`, `OfficialCallRow`, `FollowScreen`
3. `ParticipateScreen` + `QuickComplaintKit` (sem sombra colorida verde, sem `monospace`)
4. `ProfileScreen`, `SettingsScreen`, `PlacesScreen`, `AboutScreen`, `HelpScreen`
5. `ResultsScreen` (sem KPI hero, sem pílulas Material `#E8F5E9`)
6. `OnboardingFlow`, `AuthScreenLayout` (remover gradientes cosméticos), `+not-found.tsx`

Checklist "anti-cara-de-IA" por tela: sem sombra fora de flutuantes · sem card dentro de card · sem CAIXA ALTA espaçada · sem número gigante sem pergunta · sem cor fora do tema · um botão primário por tela · rótulos de tarefa ("Salvar chamado", "Acessar atendimento oficial"), não slogans · todos os estados (loading/erro/vazio) via `ScreenState`.

---

## Arquivos críticos

- Bugs: `front/stores/{territoryStore,placesStore,notificationStore,authStore}.ts`, `front/app/(tabs)/{TerritoryScreen,ParticipateScreen}.tsx`, `front/app.config.js`, `front/app/SettingsScreen.tsx`
- Design system: `front/theme/*`, `front/components/ui/*`, `front/DESIGN.md`, `PRODUCT.md`
- Fluxo: `front/components/territory/{TerritoryListView,TerritoryPreviewCard,TerritoryFilterBar}.tsx`, `front/features/onboarding/OnboardingFlow.tsx`, `front/features/city/QuickComplaintKit.tsx`, `front/components/ui/{SideMenu,AppDrawer,AppTabBar}.tsx`, `front/app/_layout.tsx`

Reaproveitar: `useThemedStyles` (`theme/useTheme.ts`), `fontForWeight`, `officialCallStatus()` (`features/city/officialCallStatus.ts`), `AppBottomSheetModal`, `IllustratedEmptyState`, `QueryState`, formatação correta de `OfficialCallTimeline.tsx` e `OfficialCallDetailsScreen.tsx:124-150`.

## Verificação

- Por fase: `npm test`, `npm run typecheck`, `npm run lint` (raiz) — e `npm test --prefix back` se `shared/` mudar.
- Fase 0: um teste de comportamento novo por bug (placesStore antes de carregar, push após troca de usuário, data `2026-10-01` em UTC-3, `focusId` + troca de domínio).
- Fase 1/3: regra anti-literais passando em zero violações; contagem de hex/fontSize antes × depois registrada em `plan/evidence/`.
- Fase 2: percorrer na web (`npx expo start --web`, navegador do app) e no Expo Go/Android as jornadas do PRODUCT.md: abrir → achar chamado → entender estado → salvar → reencontrar em Salvos; sem resultado → canal oficial; localização negada → escolher bairro; offline → erro recuperável. Claro e escuro, fonte ampliada.
- Evidências de código, web e dispositivo registradas separadamente em `plan/evidence/` (regra do AGENTS.md). Nenhuma alegação de desempenho sem medição.
