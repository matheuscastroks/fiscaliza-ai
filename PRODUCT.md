# Fiscaliza-AI — Documento de Produto (PRODUCT.md)

## 1. Visão Geral e Propósito
O **Fiscaliza-AI** é um protótipo acadêmico de participação cidadã e zeladoria urbana. O objetivo do sistema é permitir que cidadãos identifiquem, registrem e acompanhem problemas de infraestrutura na via pública (iluminação, buracos/pavimentação, limpeza e descarte irregular).

> **Aviso Fundamental de Escopo:**
> Este software opera como um **ambiente demonstrativo local**.
> - Não possui vínculo com órgãos públicos ou prefeituras reais.
> - O município apresentado nos dados de demonstração é o fictício **Vila Esperança**.
> - Não há backend remoto, banco de dados em nuvem, integração oficial ou autenticação GOV.BR ativa.
> - Todos os dados de demonstração são persistidos localmente no dispositivo via `AsyncStorage` através de um repositório isolado (`demo/repository.ts`).

---

## 2. Audiência e Perfis de Uso
1. **Cidadão (Aplicação Móvel):**
   - Localiza ocorrências registradas em seu bairro ou proximidade através do mapa nativo.
   - Registra novos problemas urbanos com descrição, foto opcional e ponto geográfico.
   - Acompanha o ciclo de vida do seu chamado através de uma linha do tempo documental com justificativas reais de tramitação.
   - Apoia e comenta ocorrências públicas comunitárias.
2. **Avaliador / Banca Acadêmica:**
   - Experimenta a jornada completa com cenários reproduzíveis e previsíveis (`registered`, `in_progress`, `resolved`).
   - Avalia a usabilidade, a arquitetura de informação e a consistência de interface de serviço sem fricção de infraestrutura externa.

---

## 3. Limites de Fluxo e Não-Objetivos
- **Sem falsas integrações:** A tela de entrada não simula login GOV.BR com selos oficiais governamentais ou fluxos falsos de autorização federal.
- **Sem alegações irreais de IA:** O suporte de classificação utiliza um motor heurístico local baseado em regras e padrões textuais (`demo/localAnalysis.ts`). O sistema nunca alega analisar o conteúdo de fotos nem invoca APIs de IA em nuvem pagas.
- **Sem pódios ou gamificação infantil:** A participação do cidadão é tratada como contribuição cívica objetiva, sem streaks, coroas ou benefícios de privilégio de atendimento no serviço público.

---

## 4. Vocabulário Padronizado (Microcopy)
Adota-se rigorosamente uma linguagem documental de serviço público:

| Termo Correto | Termo Banido (Slop / Marketing) |
|---|---|
| **Ocorrência** / **Registro** | "Problema incrível", "Incidente" |
| **Registrar ocorrência** | "Revolucione sua cidade", "Reporte e ganhe" |
| **Acompanhar** | "Monitore em tempo real", "Rastreie mágica" |
| **Recebida** / **Em atendimento** / **Concluída** | Status com cores de arco-íris descalibradas |
| **Sugestão automática local** | "Análise por IA inteligente ✨", "Visão computacional" |
| **Minhas contribuições** | "Meus troféus", "Minhas conquistas épicas" |
| **Ambiente demonstrativo (Vila Esperança)** | Falso órgão governamental ou prefeitura real |

---

## 5. Cenários Demonstrativos e Persistência
O sistema opera sobre cenários controlados que podem ser restaurados ou consultados a qualquer momento:
- `registered`: Cenário com relato primário (`DEMO-001`) recém-recebido, aguardando triagem pela equipe.
- `in_progress`: Cenário com equipe técnica designada e manutenção programada com justificativa documentada.
- `resolved`: Cenário com serviço concluído na via e registro fotográfico/histórico finalizado.
- **Persistência Local:** Garantida pelo `citizenDemoRepository` em chave dedicada `fiscaliza:citizen:v1`, permitindo fechar e reabrir o app sem perda de dados na sessão de testes.
