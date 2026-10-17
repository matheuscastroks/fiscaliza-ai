# Fiscaliza-AI — DESIGN V2: Sinalização & Registro Urbano

> **Substitui** o DESIGN anterior (*Civic Editorial Minimalism*) e a referência visual HTML do pacote anterior, rejeitada por aparência genérica. Este arquivo define direção de UX/UI para projeto **frontend mockado**. Não tomar os desenhos como screenshots do app.

## 0. Ideia

**Produto:** um serviço demonstrativo de registro e acompanhamento de problemas urbanos. **Frase interna do projeto:** “Mapa para encontrar. Ficha para entender. Histórico para acompanhar.” Não usar a frase como hero publicitário.

**Personalidade:** objetiva, urbana, familiar, confiável, legível; não “premium SaaS”, não jogo, não startup de IA, não formulário burocrático nem réplica do GOV.BR.

**Assinatura de interface:**
- Um cabeçalho territorial curto: `Vila Esperança · ambiente demonstrativo`.
- O mapa real ocupa o espaço que merece, sem moldura decorativa nem wallpaper cartográfico.
- Ocorrências são apresentadas como **registros**: tipo, rua/bairro, status, data e código onde necessário.
- O **histórico** é uma linha de eventos sóbria, com data, rótulo e justificativa.
- O uso de cor é operacional: azul para ação/localização, cores semânticas para risco/etapa. Sem arco-íris por categoria.
- Apenas uma ação visualmente dominante por contexto, e não por cada bloco.

## 1. Ordem de leitura (o design antes da paleta)

| Tela | Pergunta que responde primeiro | Informação dominante | Controle que mais importa |
|---|---|---|---|
| Entrada | O que é isso? | “Registre e acompanhe ocorrências no município fictício Vila Esperança” | `Abrir demonstração` |
| Mapa | O que foi registrado nesta área? | território + marcadores + ocorrências selecionadas | `Registrar ocorrência` |
| Lista | Qual ocorrência busco? | títulos, localização, status | buscar/filtrar e abrir |
| Registro | O que devo informar agora? | pergunta da etapa e campo | `Continuar`/`Registrar` |
| Detalhe | O que aconteceu e em que pé está? | título + status + histórico | acompanhar/apoiar |
| Histórico | O que aconteceu com minhas demandas? | registros em ordem temporal | abrir ocorrência |
| Perfil | Qual foi minha contribuição? | relatos e acompanhamentos | meus relatos |
| Ranking | Como a contribuição é medida? | critérios explícitos e dados mockados | filtrar / compreender regra |
| Gestão | O que precisa ser analisado? | fila, situação, prioridade, bairro | abrir/alterar com justificativa |

### O que difere de um design genérico

O componente principal do Mapa é **o mapa**, não um card com frase. O principal do Detalhe é **a tramitação documentada**, não um hero animado. O principal da Prefeitura é **a fila de trabalho**, não a grade de KPIs. A tela de entrada é **acesso a serviço**, não landing promocional. Cada tela usa densidade e composição apropriadas à ação.

## 2. Material visual — direção, não receita automática

**Conceito:** asfalto/papel de registro/sinalização urbana. Escolher neutros sólidos e azuis com função de navegação. Não criar efeito “papel reciclado”, textura falsa, grade ornamental, linhas de estrada decorativas ou pin logotipo.

### Tokens iniciais (proposta, validar com screenshots e contraste)

| Token | Cor | Justificativa |
|---|---|---|
| `canvas` | `#FAFAF8` | fundo de leitura, sem degradê |
| `surface` | `#FFFFFF` | formulário quando requer plano separado |
| `ink` | `#18232A` | texto de informação factual |
| `muted` | `#4E5A61` | descrição/contexto com contraste |
| `divider` | `#DCE1E2` | linhas de separação de registros |
| `accent` | `#176287` | ação principal, seleção de mapa/localização |
| `accentPressed` | `#104864` | feedback de pressão |
| `accentSoft` | `#E8F2F7` | foco contextual discreto |
| `risk` | `#9E3431` | risco/erro, **não** pendente |
| `riskSurface` | `#FCEDEC` | fundo de comunicação de risco se necessário |
| `attention` | `#835916` | atendimento/atenção, se aplicação textual |
| `attentionSurface` | `#F9F2E0` | fundo da atenção |
| `completed` | `#236B50` | estado concluído |
| `completedSurface` | `#E7F2EC` | fundo discreto de concluído |

**Checagem inicial calculada de contraste (razão WCAG sobre fundos propostos):** `ink/canvas 15,31:1`; `muted/canvas 6,79:1`; `accent/branco 6,70:1`; `risk/riskSurface 6,18:1`; `attention/attentionSurface 5,52:1`; `completed/completedSurface 5,56:1`. Isso verifica apenas pares previstos, não substitui inspeção de estados, tamanhos, opacidade e acessibilidade real na UI.

Regras de cor: categorias usam pictogramas ou nomes, não cores arbitrárias. Não criar gradiente da marca. Não espalhar fundo azul-claro por todas as seções. Mapas/tiles reais não são recoloridos artificialmente para “combinar com o tema”. O azul GOV.BR, quando mostrado em referências, não implica integração ou autorização oficial.

### Tipografia e desenho da informação

- **Primeira preferência:** fonte nativa do SO (San Francisco/iOS, Roboto/Android) pela familiaridade e qualidade em formulários. Evitar Inter/IBM Plex só para criar aparência “editorial” artificial.
- `screenTitle` 24/30 semibold; `sectionTitle` 18/24 semibold; `body` 16/24 regular; `label` 15/21 medium; `meta` 13/18 regular; `protocol` 13/18 mono nativa quando existir código.
- Evitar títulos gigantes, palavras coloridas/itálicas decorativas, letter spacing exagerado, muitos overlines em caixa alta.
- Alinhamento à esquerda como padrão. Não centralizar todas as seções.
- Texto é conteúdo, não textura gráfica. Comportamento com fonte maior deve ser testado; nunca fixar altura de texto crítico.

### Espaçamento e superfícies

- Espaçamento funcional em 4/8/12/16/20/24/32; `contentPadding` 16–20.
- Lista: preferir `OccurrenceRow` e separador em vez de cards individuais.
- Card com borda só quando o agrupamento ajuda (confirmação, folha de detalhe, modal). Sem cards dentro de cards.
- Borda de botão `6` a `8`, painel `8`, sheet conforme padrão de plataforma; pill apenas para chip com seleção óbvia, nunca por padrão estético.
- Sombras somente para camadas flutuantes que precisem distinguir-se do mapa, de preferência elevação discreta nativa. Não banir sombra como dogma.
- Alvos de toque pelo menos 44pt iOS/48dp Android como referência; verificar com dispositivo e leitores de tela.

### Identidade

Manter **wordmark `Fiscaliza-AI` simples**, sem ícone arbitrário de pin, prédio, brasão ou F dentro de quadrado. Eventual símbolo deve nascer de exploração separada e validação; não inventá-lo na Fase 1.

## 3. Linguagem por tela

### Entrada (`app/LoginScreen.tsx`)

Tela objetiva, não comercial:

```
Fiscaliza-AI                              Ajuda

Vila Esperança
Protótipo de participação cidadã

Registre problemas urbanos
na sua região

Consulte o mapa, informe uma ocorrência
ou acompanhe o atendimento.

[ Abrir demonstração ]

Dados fictícios · não vinculado a prefeitura
Acesso gov.br: proposta de integração futura
```

Nada de ilustração com três prédios, grande hero em quatro linhas, lista tripla de benefícios, entrada GOV.BR falsamente funcional ou campos de senha ocupando a primeira dobra. Caso seja preciso manter login com credenciais: caminho secundário `Conta de teste`, claramente rotulado.

### Mapa (`app/(tabs)/index.tsx`)

```
Vila Esperança                           [Filtros]
3 ocorrências nesta região · demonstração
──────────────────────────────────────────────
[Todos]  Recebidas  Em atendimento  Concluídas
┌────────────────────────────────────────────┐
│ MAPA NATIVO REAL, com pins funcionais       │
│                                            │
│                              [Minha posição]│
└────────────────────────────────────────────┘
[Em atendimento] Poste sem iluminação
Praça Central · atualizado 11 set.   [Ver →]
──────────────────────────────────────────────
Mapa       Registrar      Ocorrências    Perfil
```

Proibir desenhar mapa fake para implementação. Mapa grande, painel de ocorrência como *peek contextual* sem elemento de marketing. Não sobrepor o campo de controles, não transformar o mapa em card pequeno. Se não renderizar na web, oferecer lista fallback explícita.

### Ocorrências (`app/(tabs)/ProblemsListScreen.tsx`)

```
Ocorrências
[Buscar por local ou problema              ]
Status: Todos                       [Ordenar]
──────────────────────────────────────────────
Buraco próximo à faixa de pedestres       →
Rua das Palmeiras · Recebida · 10 set.
──────────────────────────────────────────────
Poste sem iluminação                       →
Praça Central · Em atendimento · 9 set.
──────────────────────────────────────────────
```

Sem mosaico de miniaturas por padrão. Fotos só quando de fato ajudam a reconhecer ocorrência e estão disponíveis.

### Registro (`app/(tabs)/ReportScreen.tsx`)

```
‹  Registrar ocorrência             2 de 3
──────────────────────────────────────────────
O que aconteceu?
Descreva o problema com suas palavras.

Descrição
[ Buraco próximo à travessia ...         ]

Foto — opcional                     [Adicionar]

[Sugerir título e categoria]
Sugestões locais, sem análise da imagem

[Voltar]                        [Continuar]
```

Um campo principal por etapa. IA heurística local sempre opcional e claramente identificada. Evitar modal com “IA concluída” e porcentagem de confiança enganosa, se não sustentada. Prioridade autodeclarada não gera mais pontos.

### Detalhe (`app/ProblemDetailsScreen.tsx`)

```
‹  Ocorrência DEMO-001
Em atendimento
Buraco na Rua das Palmeiras
Rua das Palmeiras, 120 · 10 set. 2026
──────────────────────────────────────────────
Descrição
Texto do relato ...
──────────────────────────────────────────────
Acompanhamento
11 set.   Em atendimento
          Equipe de manutenção designada
10 set.   Recebida
          Relato recebido para triagem
──────────────────────────────────────────────
[ Apoiar ocorrência ]      Comentários
```

Histórico é a informação principal; preservar justificativas reais dos mocks e jamais decorar com um grande hero falso. Fotos aparecem se existirem, no espaço adequado. Não criar botão editar inerte.

### Perfil / histórico / ranking

Perfil começa com nome e `Minhas contribuições`. Apresentar número de relatos válidos, situações e link para histórico; gamificação em segundo plano, sem medalhas enormes, chama/streak, pódio 3D ou promessa de prioridade no serviço público. Ranking apresenta critérios e privacidade demonstrativos. Conquistas podem aparecer em lista compacta, quando úteis para narrativa do artigo.

### Gestão demonstrativa

Interface de **fila municipal**: ocorrência, bairro, situação, possível gravidade, data, alteração com justificativa e histórico. Contadores derivados dos mocks em resumo textual no cabeçalho; sem cards de KPI com números inventados. Prioridade é trabalho a fazer, não decoração.

## 4. Microcopy / vocabulário

Preferir: `Ocorrência`, `Registrar ocorrência`, `Acompanhar`, `Em atendimento`, `Concluída`, `Apoiar`, `Minhas contribuições`, `Ambiente demonstrativo`.

Não usar: `Revolucione sua cidade`, `Seja um herói`, `Juntos fazemos a diferença`, `Ganhe badges`, `Análise IA concluída ✨`, `Dashboard inteligente`, `Seu futuro começa aqui`.

Exemplos:
- `Não há ocorrências nesta região. Tente outra área ou remova os filtros.`
- `A localização não está disponível. Marque o ponto diretamente no mapa.`
- `Sugestão automática gerada localmente. Confirme as informações antes de continuar.`
- `Ocorrência DEMO-004 registrada neste dispositivo.`
- `Esta versão apresenta cenários simulados e não encaminha demandas a uma prefeitura.`

## 5. Design checks antes de qualquer implementação visual

1. **Duas alternativas estruturais** da tela em wireframe sem cores, para validar hierarquia ANTES da paleta.
2. **Checklist RITO:** Razão, Informação, Tarefa, Originalidade funcional para elementos dominantes.
3. **Auditoria de densidade:** identificar duplicação de cabeçalho, badge e ações repetidas.
4. **Acessibilidade:** fonte escalável, rótulos, ordem de foco, feedback textual, contraste.
5. **Estados:** vazio, erro, carregando, dados longos, localização negada, cenário inicial.
6. **Demonstração:** IDs, números e estados devem vir da mesma fonte local; rotular explicitamente.
7. **Qualidade:** não oferecer título/CTA sem relação direta com o trabalho do usuário.

## 6. Referências

- https://impeccable.style/ — slop, critique, distill, layout e polish
- https://github.com/miqdadbadjuber/anti-slop/blob/main/antislop.md — filtro por propósito
- https://github.com/referodesign/refero_skill/blob/master/skills/refero-design/references/anti-ai-slop.md — crítica à estética safe repetitiva
- https://www.gov.br/ds — acessibilidade e padrões públicos
- https://www.gov.uk/guidance/government-design-principles — serviços centrados em tarefa
