# GEMINI — Tarefa executiva: Fase 1 Fiscaliza-AI (Design V2 / Anti-Slop)

Você atua como engenheiro frontend React Native experiente e designer de produto. Trabalhar no repositório `matheuscastroks/fiscaliza-ai`, preservando dados de demonstração locais. **Objetivo agora: implementar apenas a Fase 1.** Não sair implementando fases 2–7.

## Fontes obrigatórias (ler antes de editar)

1. `01_AUDITORIA_ANTI_SLOP.md`: diagnóstico do design anterior, antipadrões e teste RITO.
2. `02_DESIGN_V2.md`: **fonte de verdade estética** (Sinalização & Registro Urbano), hierarquia, copy e telas.
3. `03_MASTERPLAN_V2.md`: auditoria por arquivo, dependências, sequência de fases e testes.
4. Estado ATUAL do código (não confiar em linhas antigas): `app/LoginScreen.tsx`, `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `stores/authStore.ts`, `constants/Colors.ts`, `components/ThemedText.tsx`, `services/mockApi.ts`, `demo/repository.ts`, `demo/fixtures.ts`, `package.json`.

**ATENÇÃO:** ignorar e não reaproveitar visualmente o `FISCALIZA_AI_REFERENCIA_VISUAL.html`, `FISCALIZA_AI_DESIGN.md` e o conceito `Civic Editorial Minimalism` anteriores. Eles foram rejeitados por parecerem template/AI slop.

## Escopo não negociável

- Apenas frontend React Native/Expo/TypeScript/Zustand, com mocks em AsyncStorage.
- Sem backend, sem Supabase/Firebase, sem auth GOV.BR real, sem API IA externa.
- Preservar `demo/repository.ts`, `demo/fixtures.ts`, os testes e interfaces existentes, exceto correção mínima justificada.
- Sem pins/logos genéricos, prédio ilustrativo decorativo, 3 benefícios com ícones, gradientes, glassmorphism, cards aninhados, pódios, marketing genérico ou animações de entrada.
- Não substituir tudo por cinza/bege/verde-oliva. A direção define informação territorial, registro e estado de serviço, não uma moda visual.
- Um CTA prioritário por tela/área. Somente usar cartão, badge, ícone ou sombra quando houver motivo funcional.
- Identificar claramente `Ambiente demonstrativo`, sem associação falsa com governo ou prefeitura.
- Não reorganizar ainda o conteúdo das telas de mapa, registro, detalhes, histórico, ranking, perfil e prefeitura; isso pertence às próximas fases.

## Forma de trabalho

**Etapa A — Auditoria:**
- Revisar o código da branch atual, listar componentes e estilos locais relacionados ao login e tabs, verificar a navegação demo e possíveis efeitos do guard global.
- Entregar primeiro uma tabela `arquivo existente → mudança proposta → por quê → risco → como validar`. Evitar perguntas genéricas; decidir tecnicamente a partir das fontes.
- Comparar duas composições estruturais sem cor para a entrada: (1) serviço + CTA primeiro; (2) contexto territorial + CTA primeiro. Selecionar a de leitura mais simples e documentar o motivo.

**Etapa B — Implementar tokens:**
- `theme/colors.ts`: cores semânticas de DESIGN_V2.
- `theme/typography.ts`: tipografia nativa e escala; nenhuma dependência de fonte só por estética.
- `theme/spacing.ts` + `theme/layout.ts`: escalas e superfícies.
- `theme/index.ts`: exportações.
- `constants/Colors.ts`: adaptador compatível com consumidores legados.
- Verificar contraste antes de aprovar tokens de texto/ação.

**Etapa C — Primitivos úteis:**
- `components/ui/AppText.tsx`, `AppButton.tsx`, `AppScreen.tsx`, `AppHeader.tsx`, `AppDivider.tsx`, `DemoNotice.tsx` (ou `components/demo/DemoNotice.tsx`).
- `AppInput.tsx` somente se a conta de teste realmente precisar de formulário nesta fase.
- Preservar props nativas, acessibilidade e estados de feedback; não adicionar `Card` por hábito.

**Etapa D — Entrada:**
- Redesenhar `app/LoginScreen.tsx` como entrada de serviço: brand tipográfica, contexto fictício `Vila Esperança`, propósito concreto, `Abrir demonstração`, opção discreta de conta teste e aviso de protótipo não oficial.
- Remover CTA falso `Entrar com Gov.br`; mencionar integração futura apenas como texto informativo se necessário.
- Não usar ilustração decorativa, hero publicitário, botão pílula ou tripla de features.
- Usar `demoUser`/`authApi` atual; validar fluxos de erro e retorno.

**Etapa E — Shell/tabs:**
- Revisar `app/_layout.tsx` para SafeArea/StatusBar/guard de sessão demo. Remover paddingTop 30 se responsável por espaço artificial, sem causar sobreposição.
- Revisar `app/(tabs)/_layout.tsx`: abas `Mapa`, `Registrar`, `Ocorrências`, `Perfil`, ícones discretos, um padrão de rótulos/seleção, sem altura fixa arbitrária que quebre safe area.
- Não mudar as rotas atuais nem o conteúdo interno de cada tab.

**Etapa F — Gate/QA:**
- `npm test`, `npm run lint`, `npx tsc --noEmit`. Registre comando, status e erros. Não alegar teste que não foi executado.
- Testar login demo → mapa → trocar abas → sair → entrar, usando dispositivo/emulador se disponível. Se não, dizer explicitamente.
- Verificar textos escalados, botões/touch targets, labels de leitor de tela, texto longo e estado de erro.
- Atualizar `PRODUCT.md`, `DESIGN.md` e `ANTI_SLOP.md` no repo, deixando documentação consistente com design V2.
- Documentar screenshots anteriores/posteriores com **capturas reais**. Não usar mockup HTML do pacote anterior como prova.

## Formato do relatório de entrega

1. Decisões de design tomadas e razões específicas do Fiscaliza-AI;
2. Lista de arquivos alterados, criados e arquivos intocados deliberadamente;
3. Resumo “antes → depois” com diferenças perceptíveis;
4. Lista de antipadrões removidos e os que ainda restam em outras telas (previstos);
5. Testes executados com resultados reais;
6. Screenshots ou explicação por que não foi possível capturar;
7. Riscos/regressões, pendências e recomendação de aprovação da Fase 1.

**Condição de parada:** terminou Fase 1, entregue revisão e PARE. Não iniciar Fase 2 sem pedido expresso do usuário.
