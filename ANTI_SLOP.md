# Fiscaliza aí — Auditoria Anti-AI-Slop v2

**Escopo:** protótipo acadêmico React Native/Expo com dados locais mockados. **Data:** 17/10/2026. **Status:** substitui a orientação estética do pacote anterior, inclusive a referência visual HTML anterior. Não afirmar vínculo com órgãos públicos ou login GOV.BR funcional.

## 1. O diagnóstico do nosso próprio plano

O problema do design proposto não era apenas animação exagerada. Ao trocar o visual saturado por _Civic Editorial Minimalism_, continuamos usando decisões estéticas previsíveis: verde-sálvia, quase branco, muitos painéis brancos com bordas, badges pastéis, slogan grande, ícones genéricos, grade de métricas idênticas e mapas ilustrados que parecem dados reais. Essas decisões não derivavam suficientemente das tarefas de uma plataforma de ocorrência urbana. A nova direção NÃO é “deixar tudo cinza”. É associar cada escolha à tarefa executada.

### Antipadrões identificados na referência HTML anterior

| Problema anterior                                          | Por que é genérico/nocivo aqui                          | Diretriz corretiva                                                                   | Evidência de melhora                                         |
| ---------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Hero de 4 linhas (`Sua cidade, mais perto de uma solução`) | Publicidade, não orientação de serviço                  | Título factual e tarefa explícita                                                    | Usuário sabe o que pode fazer sem ler subtítulo publicitário |
| Logotipo provisório `F` em quadrado arredondado            | Marca arbitrária sem relação urbana                     | Wordmark tipográfico provisório; marca definitiva em projeto próprio                 | Funciona sem ícone de pin genérico ou lettering fake         |
| Paleta sage/ivory                                          | Repetição de aesthetic “AI beige + green”               | Base mineral/neutra e **azul de informação territorial** como único acento principal | A cor chama atenção só onde ajuda decidir/agir               |
| Excesso de chips e badges em sequência                     | Produz ruído, compete com mapa                          | Filtros por texto/menu de acordo com densidade                                       | Apenas filtro ativo se destaca                               |
| Pódios, stats em 3 colunas, bento                          | Template SaaS para contexto cívico                      | Lista de trabalho + sumário textual, valores apenas quando orientam uma decisão      | Hierarquia muda conforme a tarefa                            |
| Mapa genérico desenhado em CSS/SVG                         | Falsa informação geográfica                             | Usar mapa nativo verdadeiro; para documentos, wireframe claramente abstrato          | Nada sugere precisão que não existe                          |
| Grandes blocos brancos arredondados                        | Mesmo tratamento para conteúdos de naturezas diferentes | Separadores, linhas e agrupamentos sem cartão                                        | Leitura fica mais rápida, menos bordas                       |
| Ícones dentro de caixas arredondadas                       | Ornamento repetitivo de agent UI                        | Ícones somente quando auxiliam reconhecimento/comando                                | Leitura preservada sem ícone                                 |
| Tudo centralizado, simétrico e folgado                     | Escaneabilidade ruim e ar promocional                   | Alinhamento à esquerda; densidade calibrada; ritmos assimétricos funcionais          | Informações essenciais cabem na tela                         |
| Metadados fictícios como números publicitários             | Parecem KPIs de operação real                           | Derivar todos dos mocks e rotular demonstração                                       | Cada número é reproduzível no cenário                        |
| Espaçamento/rounded uniformes sem função                   | Não distingue dado, comando ou agrupamento              | Raio por semântica, espaçamento proporcional à informação                            | Elementos funcionalmente diferentes não parecem iguais       |
| Animações de entrada, crescimento e pódio                  | Chama atenção para interface, não tarefa                | Movimento só para mudanças de estado/navegação                                       | Nada pula ou gira ao entrar em uma tela                      |
| “IA inteligente” ou “análise da imagem”                    | Exagera implementação                                   | “Sugestão automática local”; imagem não é analisada                                  | Usuário entende exatamente o que o mock faz                  |
| Login que finge GOV.BR                                     | Afirma autenticação que não existe                      | Protótipo explicitamente identificado; login fictício separado                       | Nenhum usuário confundiria com serviço governamental         |

## 2. Pesquisa consultada: padrão recorrente ≠ proibição universal

- **Impeccable**: aponta hierarquias sem foco, cartões dentro de cartões, excesso de chips, texto vago, detalhes decorativos e ausência de critérios de design verificáveis: https://impeccable.style/ (área Slop / documentação).
- **Anti-AI-UI skill**: catálogo negativo de gradientes roxos, glassmorphism, CTA de pílula e ícones sem contexto. É uma lista de sintomas; não se deve adotá-la como estética substituta: https://github.com/Vanszs/Anti-AI-UI/blob/main/Anti-AI-SLop/SKILL.md
- **Refero anti-ai-slop**: alerta também contra o “anti-slop genérico” — fundos marfim/verde-oliva e layouts calmos pouco específicos: https://github.com/referodesign/refero_skill/blob/master/skills/refero-design/references/anti-ai-slop.md
- **antislop.md**: filtro de decisões sem motivo; não proíbe componentes úteis indiscriminadamente: https://github.com/miqdadbadjuber/anti-slop/blob/main/antislop.md
- **GOV.UK Government Design Principles**: começar por necessidades, fazer menos, consistência sem uniformidade: https://www.gov.uk/guidance/government-design-principles
- **GOV.BR Padrão Digital**: clareza, acessibilidade e coerência em aplicações de serviço: https://www.gov.br/ds

**Natureza das fontes:** os catálogos “AI slop” são guias e opiniões profissionais sobre tendências de design, não critérios científicos objetivos de identificação de autoria de IA. O teste final é a adequação às tarefas e a usabilidade verificada.

## 3. Novo teste de justificativa: R-I-T-O

Para TODO elemento proposto, a IA deve preencher mentalmente ou documentar:

1. **R — Razão:** qual necessidade urbana/cívica resolve?
2. **I — Informação:** que conteúdo concreto carrega ou organiza?
3. **T — Tarefa:** que ação permite ou esclarece?
4. **O — Originalidade funcional:** por que o padrão escolhido combina com este contexto, e não com qualquer aplicativo SaaS?

Se não houver uma resposta, retirar ou redesenhar. Não criar diferenciação apenas com estilização: boa identidade pode ser silenciosa, específica e funcional.

## 4. Regras aplicáveis ao Fiscaliza aí

**Não usar como solução padrão** (exceção somente com justificativa funcional registrada):

- Logo de letra isolada, pin/cidade genérico, prédios em trio, mascote, imagem genérica de “cidade inteligente”;
- Gradiente roxo/azul, aurora, glow, glassmorphism, blur de fundo decorativo;
- Cartões 3/4 por linha com ícone + título + descrição, cards aninhados, bento decorativo;
- Frases vazias (“transformando comunidades”, “seu futuro começa aqui”, “juntos fazemos a diferença”);
- Texto enorme de marketing na entrada, overlines em CAIXA ALTA por toda parte, prosa explicativa redundante;
- Pins com emojis, marcadores coloridos como confete, sombras elevadas;
- Pintar categorias com arco-íris; confundir gravidade com status;
- Pódio gigante, estrela dourada, streak como destaque principal, ranking como prioridade de atendimento;
- Elementos sem ação, números inventados, telas de “em breve” em funções anunciadas como ativas;
- Foto placeholder de banco de imagem e mapa ilustrativo apresentado como mapa funcional;
- Efeito de montagem de interface (`FadeIn`, `BounceIn`, `SlideInUp`, `withSpring` decorativo);
- Trocar todo o app por preto/cinza: isso também é genérico se não houver linguagem e contexto.

**Usar deliberadamente:**

- Organização de **ficha de ocorrência** (código, localização, situação, data, histórico);
- Geografia funcional: mapa como superfície central, texto de bairro/localização ancorando o contexto;
- Hierarquia de informação com alinhamento claro, separação tipográfica e linhas, não caixas para tudo;
- Marca em wordmark tipográfico, sem símbolo provisório genérico;
- Azul de navegação territorial/ação primária em pequenas áreas; alerta amarelo/vermelho só em condição real;
- Linguagem de serviços: “Registrar ocorrência”, “Acompanhar”, “Recebida”, “Em atendimento”, “Concluída”;
- Mocks reproduzíveis, reconhecimento explícito de “Ambiente demonstrativo”;
- Clareza de acesso: explorar a demo primeiro; nenhuma falsa integração GOV.BR.

## 5. Critérios de rejeição visual para PRs

Um PR deve ser revisado se:

- Tela principal contém >1 área visual primária concorrente, sem justificativa;
- A mesma hierarquia (cartão com borda + ícone + badge) é repetida em todo conteúdo;
- Há elemento decorativo que não transporta informação e compete com ações;
- Layout perde contexto territorial, protocolo ou situação ao priorizar estética;
- Todos os botões estão em destaque, ou controles em preto/cor indiscriminada;
- Acessibilidade é sacrificada para “ficar clean”;
- “Demonstração” não está clara; narrativas/imagens/contagens são apresentadas como reais;
- Novo componente duplicado existe e não há motivo para variante distinta;
- Mockup passa a ditar comportamento ruim no celular.

## 6. Conferência obrigatória antes de cada fase

1. Capture ANTES/DEPOIS das telas alteradas em aparelho/emulador ou screenshots verificáveis; não inventar validação.
2. Liste a tarefa primária de cada tela e o que foi simplificado.
3. Descreva mudanças de ordem/hierarquia **antes** de trocar cores/radius.
4. Execute `npm test`, `npm run lint`, `npx tsc --noEmit` e registre resultados reais (com desvios se houver).
5. Teste estados vazios, longos, offline/erro local, fonte aumentada, permissão GPS negada quando pertinente.
6. Teste impacto das mudanças nas outras rotas e preservação de `demo/repository.ts`.
7. Dê evidência de consistência sem uniformidade: por que **Mapa** não parece **Perfil**, e ambos parecem Fiscaliza aí?
