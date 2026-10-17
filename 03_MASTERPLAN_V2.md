# Fiscaliza-AI — Masterplan de implementação v2 (ANTI-SLOP)

**Usar junto de:** `01_AUDITORIA_ANTI_SLOP.md` (diagnóstico e filtro), `02_DESIGN_V2.md` (decisões UX/UI), `04_GEMINI_FASE1_V2.md` (execução imediata). **Invalidar** como referência: a estética `Civic Editorial Minimalism` e o `FISCALIZA_AI_REFERENCIA_VISUAL.html` do primeiro pacote.

## A. Contrato de produto e limites

- Aplicativo acadêmico de **frontend React Native + Expo Router + Zustand**, com dados mockados persistidos localmente. **Não** adicionar backend, Supabase, Firebase, autenticação GOV.BR real, API de IA paga ou serviço de notificação em produção.
- Proposta: cidadão localiza/registra/acompanha ocorrências; prefeitura vê e atualiza um cenário municipal demonstrativo no frontend.
- **Diretriz de design:** `Sinalização & Registro Urbano` (design com foco em informação, território, serviço). Nenhum efeito é proibido por moda: somente usar se justificar sua função.
- Manter municípios/ocorrências fictícios rotulados. Não fingir operação oficial. `Vila Esperança` é cenário demonstrativo, não prefeitura parceira.
- Limitar a **Fase 1** à fundação, login e navegação até aprovação explícita; próximas fases aqui são referência.

## B. Auditoria atual — caminhos verificados no repositório

| Caminho | Achado do código | Por que deve mudar | Momento |
|---|---|---|---|
| `app/LoginScreen.tsx` (~523 linhas) | Logo genérico, 3 benefícios com ícones, credenciais visíveis e CTA `Gov.br` simulado | Parece landing/serviço oficial e é pouco orientado a tarefa | Fase 1 |
| `app/_layout.tsx` | Guard/redirecionamento global, padding top 30, fontes de template | Safe areas, fluxo de demo e tema devem ser previsíveis | Fase 1 |
| `app/(tabs)/_layout.tsx` | Quatro tabs, verde hardcoded e alturas manuais | Navegação com identidade e padrão nativo | Fase 1 |
| `constants/Colors.ts` | Tokens do template Expo (tint cyan) desconectados das telas | Uma fonte de verdade | Fase 1 |
| `components/ThemedText.tsx`, `ThemedView.tsx` | Helpers do template inicial | Migrar/compatibilizar com tokens, só se usados | Fase 1 |
| `app/(tabs)/index.tsx` (~1323) | Mapa e filtros, animações, marcadores/cores variadas, callout complexo | Dar protagonismo ao mapa e simplificar contexto | Fase 2 |
| `app/(tabs)/ProblemsListScreen.tsx` (~822) | Cards repetidos com miniaturas, lista de bairros hardcoded | Lista de registros legível e filtros coerentes | Fase 2 |
| `app/(tabs)/ReportScreen.tsx` (~2002) | Form de quatro etapas, IA obrigatória via `hasUsedAI`, conteúdo e estilo mesclados | Assistência opcional, 3 etapas, layout sem distração | Fase 3 |
| `app/ProblemDetailsScreen.tsx` (~967) | Header parallax, animações e timeline ainda não priorizada no layout | Histórico de atendimento como núcleo | Fase 4 |
| `app/HistoryScreen.tsx` (~612) | Repete cards/listas de outras telas | Consistência sem cartão generalizado | Fase 5 |
| `app/(tabs)/ProfileScreen.tsx` (~1147) | Badges animados, streak e KPIs ocupam foco; dados de `mockProblems` legado | Colocar impacto/ações em primeiro plano | Fase 5 |
| `app/RankingScreen.tsx` (~744) | Pódio e categorias com cores arbitrárias; território fixo | Representação séria, critérios transparentes | Fase 5 |
| `app/PointsGuideScreen.tsx` (~811) | Pontos e benefícios descritos separadamente das regras reais | Alinhar simulação, retirar prioridade de atendimento | Fase 5 |
| `app/SettingsScreen.tsx` (~603) | Toggles e ações de demonstração parcialmente inertes | Não prometer ações falsas; controlar demo | Fase 5 |
| `stores/problemsStore.ts`, `stores/statsStore.ts` | Refresh incremental e dados de contexts diferentes | Atualizar corretamente quando mocks mudam | Fases 2–6 |
| `stores/authStore.ts` | Sessão local de demo persistida | Rotular sessão fictícia, não fingir GOV | Fase 1, revisão 5 |
| `services/mockApi.ts` | **Já** usa `demo/repository.ts` e AsyncStorage | **Preservar**, adapter atual é útil | Todas |
| `demo/repository.ts` | Cenários `registered/in_progress/resolved`, mutações serializadas, histórico com justificativa | **Preservar e reutilizar** na perspectiva municipal | Todas |
| `demo/fixtures.ts`, `demo/types.ts` | Cenários e tipos demonstrativos | Fonte de verdade para casos do artigo | Fases 2–6 |
| `demo/localAnalysis.ts`, `services/aiService.ts` | Análise por regex local, sem leitura real da imagem | UX precisa dizer “sugestão local”, não IA externa | Fase 3 |
| `demo/*.test.ts` | Testes atuais das regras locais | Preservar e ampliar quando contratos mudarem | Todas |
| `app.json` | Configurações do template, permissão de foto descrita como “amigos” | Textos e recursos com contexto real de ocorrência | Fase 1/7 |
| `README.md` | Contém referências antigas ao funcionamento inicial | Documentar app como demo e versões | Fase 7 |

**Importante:** linhas aproximadas refletem auditoria da branch principal lida; verificar novamente em cada execução. Não copiar cegamente trecho antigo sem inspecionar o arquivo atual.

## C. Arquitetura alvo incremental

**Não realizar migração big-bang.** Manter rotas existentes. Adicionar compartilhados apenas quando houver consumidor real. Escolher um diretório de tema único (`theme/` na raiz, em vez de criar também `src/theme/`) para evitar duas fontes de verdade. Alias `@/` aponta para a raiz no projeto existente.

```text
app/                                 [rotas atuais, conservar]
  _layout.tsx                        [F1]
  LoginScreen.tsx                    [F1]
  (tabs)/
    _layout.tsx                      [F1]
    index.tsx                        [F2]
    ProblemsListScreen.tsx           [F2]
    ReportScreen.tsx                 [F3]
    ProfileScreen.tsx                [F5]
  ProblemDetailsScreen.tsx           [F4]
  HistoryScreen.tsx                  [F5]
  RankingScreen.tsx                  [F5]
  PointsGuideScreen.tsx              [F5]
  SettingsScreen.tsx                 [F5]
  municipal/                         [F6, frontend demo]
    index.tsx
    [problemId].tsx

theme/                               [novo F1]
  colors.ts
  typography.ts
  spacing.ts
  layout.ts
  index.ts
components/ui/                       [novo F1: só primitivos utilizados]
  AppText.tsx
  AppButton.tsx
  AppScreen.tsx
  AppHeader.tsx
  AppDivider.tsx
  AppInput.tsx                        [apenas se usado pelo login F1]
components/occurrences/              [F2-F4, incremental]
  OccurrenceRow.tsx
  StatusText.tsx
  OccurrenceTimeline.tsx
components/demo/                     [F1/F6]
  DemoNotice.tsx
features/map/                        [F2]
  useMapRegion.ts
  useOccurrenceFilters.ts
features/reports/                    [F3]
  useReportForm.ts
  LocationStep.tsx
  DescriptionStep.tsx
  ReviewStep.tsx
  ReportSuccess.tsx
features/participation/              [F5]
  gamification.ts
  selectors.ts
utils/                                [F2+]
  formatDate.ts
  occurrenceLabels.ts

demo/                                 [existente: MANTER]
  repository.ts
  fixtures.ts
  types.ts
  localAnalysis.ts
  *.test.ts
services/mockApi.ts                   [existente: adapter]
stores/                               [existentes]
constants/Colors.ts                   [adapter temporário]
PRODUCT.md                            [novo F1: verdade do produto]
DESIGN.md                             [novo F1: copiar versão v2]
ANTI_SLOP.md                          [novo F1: copiar auditoria]
```

### Contratos de design system

- `AppText`: variante (`screenTitle/sectionTitle/body/label/meta/protocol`), cor semântica e forwarding de props nativas, sem bloquear escalonamento de fonte.
- `AppButton`: `primary/secondary/quiet/destructive`, loading, disabled, rótulo acessível; **não** criar efeito de scale/bounce.
- `AppScreen`: safe area/background/padding, não impor scroll automático em rotas com MapView/FlatList.
- `AppHeader`: título claro, ação contextual opcional, layout compacto; evitar grandes blocos de slogan.
- `AppDivider`: sem decoração, só separação semântica.
- `AppInput`: rótulo persistente, erro textual, controle nativo; usado para conta de teste se mantida.
- `DemoNotice`: rótulo único, discreto, inequívoco de dados fictícios; não repetir banner gigante em todo card.
- `OccurrenceRow`: título, local, data, status, ação de abrir; sem miniatura obrigatória.
- `OccurrenceTimeline`: deriva de `statusHistory`; data e justificativa são informação primária.

Critério para um componente novo: há pelo menos 2 consumidores com a mesma intenção ou ele é um primitivo de composição; não criar `Card`, `Badge`, `Pill`, `IconTile` “por via das dúvidas”.

## D. Sequência por fase

### FASE 1 — Fundamentos, login e navegação (executar AGORA)

**1.0 Auditoria de referência (não editar):**
- Ler todos os documentos v2; `package.json`, `app.json`, `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/LoginScreen.tsx`, `components/ThemedText.tsx`, `constants/Colors.ts` e `stores/authStore.ts`.
- Capturar telas atuais de login, form login e tabs no emulador quando disponível; declarar se não foi possível. Inventariar animações e código usado.
- Escrever `PRODUCT.md`: audiência, serviço proposto, mock, não-vínculo institucional, limites de fluxo, vocabulário e cenários.

**1.1 Sistema de tokens (arquivos novos):**
- Criar `theme/colors.ts`, `typography.ts`, `spacing.ts`, `layout.ts`, `index.ts` a partir de `02_DESIGN_V2.md`. Verificar contraste; adaptar tokens se falhar, documentando mudança.
- Alterar `constants/Colors.ts` para apontar ao novo tema sem quebrar consumidores legados.
- Não introduzir fonte externa apenas para “dar design”. Preservar padrão nativo por enquanto.

**1.2 Primitivos estritamente necessários (novos arquivos):**
- Implementar `AppText`, `AppButton`, `AppScreen`, `AppHeader`, `AppDivider`, `DemoNotice`, `AppInput` (apenas se necessário).
- Testar variantes carregando/disabled, erro de formulário, escala de fonte, label acessível.
- Não criar card universal ou wrappers de ícone redondo sem dois usos concretos.

**1.3 Entrada (modificar `app/LoginScreen.tsx`):**
- Substituir desenho de prédios, 3 itens decorativos e hero de 4 linhas por entrada objetiva do protótipo.
- CTA único `Abrir demonstração`; caminho secundário de conta de teste se precisar manter. Evitar credenciais expostas e ação GOV.BR enganosa.
- Usar conta `demoUser` já existente, e `authApi.login` atual quando aplicável; **não** adicionar auth externa.
- Mensagem visível: `Protótipo acadêmico • dados simulados • sem vínculo com prefeitura`.
- Tratamento de erro real e navegação de volta, não deixar usuário preso em tela.

**1.4 Navegação e shell (modificar `app/_layout.tsx`, `app/(tabs)/_layout.tsx`):**
- Substituir padding-top manual por safe areas com teste da status bar/teclado.
- Preservar fluxo de sessão demo; verificar hidratação do Zustand antes de redirecionar, se aplicável.
- Quatro tabs permanecem `Mapa / Registrar / Ocorrências / Perfil`, mesma rota atual; ícones nativos discretos, rótulos legíveis e diferenciação textual/visual de ativo.
- Não implementar ainda mudanças de conteúdo do mapa/registro/perfil.

**1.5 Consistência e entregáveis:**
- Guardar `DESIGN.md`, `PRODUCT.md`, `ANTI_SLOP.md` no repo e atualizar `README.md` apenas para descrever demo/local.
- Testar `npm test`, `npm run lint`, `npx tsc --noEmit`. Corrigir somente erros introduzidos ou bloqueantes e reportar pré-existentes separadamente.
- Screenshots reais de login e tabs após mudança (ou declarar impedimento), resumo de arquivos e razões, comparação da densidade, acessibilidade e caminho de navegação.

**Gate F1:** identidade inteligível sem logo genérico; UI sem hero promocional/cards de benefício; componente sem decoração gratuita; navegação intacta; dados demo preservados; sem afirmação falsa de GOV; testes relatados.

### FASE 2 — Mapa + lista

| Passo | Arquivos | O que implementar | Aceite |
|---|---|---|---|
| 2.1 Filtragem separada | `features/map/useOccurrenceFilters.ts`, `app/(tabs)/index.tsx` | Estado de filtros por status/categoria sem sobrescrever coleção global | Mapa e lista não mudam dados indevidamente |
| 2.2 Cálculo de região | `features/map/useMapRegion.ts` | Extrair geolocalização e foco do mapa, manter permissão negada | Zoom/foco coerentes sem loop de render |
| 2.3 Marcadores + controles | `app/(tabs)/index.tsx` | Remover escala/bounce; pins com status/risco distintos; ação de registrar posicionada | Território continua dominante |
| 2.4 Visualização de registro | `components/occurrences/OccurrenceRow.tsx`, `StatusText.tsx` | Linha de ocorrência reutilizável sem card para tudo | Lista e histórico compartilham informação |
| 2.5 Busca e bairro | `app/(tabs)/ProblemsListScreen.tsx`, `demo/fixtures.ts` se necessário | Derivar filtros do cenário real; remover lista de bairros fixos | Busca efetiva, estados vazios claros |
| 2.6 QA | mapa e lista | Estado vazio, foto ausente, permissão GPS negada, Android/iOS, fallback web honestamente identificado | Abre detalhe correto e não perde filtro |

### FASE 3 — Registro

| Passo | Arquivos | O que implementar | Aceite |
|---|---|---|---|
| 3.1 Hook do formulário | `features/reports/useReportForm.ts` | Extrair estado/validação/ações da tela de 2002 linhas | Sem mudança de regra antes de teste |
| 3.2 Etapas | `LocationStep.tsx`, `DescriptionStep.tsx`, `ReviewStep.tsx`, `app/(tabs)/ReportScreen.tsx` | 3 etapas: localização, descrição/evidência, revisão | Voltar não perde campos |
| 3.3 IA local opcional | `demo/localAnalysis.ts`, `services/aiService.ts`, tela | Sugerir título/categoria sem bloquear continuação; rotular heurística local | Pode enviar sem IA |
| 3.4 Fotos | tela, armazenamento local se necessário | Preview, remover, erro; considerar URI temporária | Screenshot de reabertura e evidência |
| 3.5 Confirmação | `ReportSuccess.tsx` e rota/tela apropriada | Protocolo gerado pelo demo repo, ações claras | Novo item aparece no mapa/histórico |
| 3.6 Pontos | `features/participation/gamification.ts`, perfil | Eliminar bônus por autoelevação de urgência; regras coerentes | Guia e pontos exibem mesmos critérios |

### FASE 4 — Detalhe e acompanhamento

| Passo | Arquivos | Modificação | Aceite |
|---|---|---|---|
| 4.1 Ordem de informação | `app/ProblemDetailsScreen.tsx` | Retirar hero e cabeçalho animado, priorizar título/status/endereço | Situação evidente sem scroll |
| 4.2 Timeline | `components/occurrences/OccurrenceTimeline.tsx` | Renderizar `statusHistory` do repositório com data/justificativa | Cada cenário `registered/in_progress/resolved` mostra histórico coerente |
| 4.3 Apoio/comentários | `app/ProblemDetailsScreen.tsx`, demo repo se preciso | Ação clara e atualização no mesmo registro | Sem contagem duplicada; erros acessíveis |
| 4.4 Revisão | detalhes e stores | Vazio de foto, texto longo, status novo, deep link | Sem editar ícone decorativo inerte |

### FASE 5 — Participação

| Passo | Arquivos | Modificação | Aceite |
|---|---|---|---|
| 5.1 Contribuição | `ProfileScreen.tsx`, `features/participation/selectors.ts` | Remover pódio/streak como foco, dados consolidados | Perfil reflete dados do demo repo |
| 5.2 Meus relatos | `HistoryScreen.tsx`, `OccurrenceRow.tsx` | Listagem com status e histórico legíveis | Estados sincronizados com detalhes |
| 5.3 Pontuação e ranking | `RankingScreen.tsx`, `PointsGuideScreen.tsx`, `gamification.ts` | Regras únicas, ausência de privilégios administrativos | Guia e ranking não mentem sobre função |
| 5.4 Configurações | `SettingsScreen.tsx` | Retirar ações inertes, agrupar demonstração e preferências efetivas | Nenhuma confirmação de ação não executada |

### FASE 6 — Visão da prefeitura (frontend mock)

- `app/municipal/index.tsx`: tabela/lista responsiva de triagem, filtros por status, busca e indicadores calculados do mesmo `demo/repository.ts`.
- `app/municipal/[problemId].tsx`: resumo, justificativa, escolher etapa seguinte e registrar. Estado grava local via `problemsApi.updateProblem`; **não** criar outro banco ou API.
- `components/demo/DemoNotice.tsx`: identifica perspectiva fictícia.
- `demo/repository.ts` + testes: alterar só o estritamente necessário para cenário compartilhado. Verificar que a ficha do cidadão mostra a mudança após retornar.
- Gate: criar pelo cidadão -> encontrar na gestão -> alterar status com justificativa -> acompanhar no cidadão; uma demonstração completa em uma mesma sessão.

### FASE 7 — Validação e artigo

- `README.md`, `PRODUCT.md`, `DESIGN.md`: documentação fiel ao que realmente existe; screenshots verdadeiros, funcionalidades efetivas, limitações de mocks.
- Testes em tamanhos diferentes, fonte ampliada, TalkBack/VoiceOver quando disponível, permissão negada, sem imagens, sem ocorrências e cenários restaurados.
- Registrar teste exploratório com tarefas do cidadão e da gestão, sem alegar resultados de campo não medidos.
- Material do artigo: problema, método, decisões de UX, arquitetura de demonstração, jornadas, limitações e teste de usabilidade.

## E. Exigências de execução e checkpoints

**Trabalhar por PR/commit pequeno, não um patch gigante:**
1. Tokens / compatibilidade;
2. Componentes realmente usados;
3. Login;
4. Shell/tabs;
5. QA + docs.

Para cada PR entregue: objetivo, telas afetadas, arquivos criados/movidos/alterados, mudanças de comportamento, como testar, resultados de testes executados, screenshots **reais**, riscos/regressões, pendências.

**Passo de crítica antes de concluir:** “Se tirar cor e sombra, o app ainda faz sentido? As informações têm hierarquia própria? Algum elemento parece um template de SaaS? Há padrão que está sendo aplicado uniformemente em telas com tarefas diferentes?”. Reprovar PR com respostas sem justificativa.

**Critério de sucesso NÃO é** “todos os componentes estão uniformes”. É “cada tela é correta para a sua tarefa, compartilha os padrões adequados e pertence visualmente ao mesmo produto”.

## F. Referências verificáveis

- https://impeccable.style/
- https://github.com/Vanszs/Anti-AI-UI/blob/main/Anti-AI-SLop/SKILL.md
- https://github.com/referodesign/refero_skill/blob/master/skills/refero-design/references/anti-ai-slop.md
- https://github.com/miqdadbadjuber/anti-slop/blob/main/antislop.md
- https://www.gov.br/ds
- https://www.gov.uk/guidance/government-design-principles
