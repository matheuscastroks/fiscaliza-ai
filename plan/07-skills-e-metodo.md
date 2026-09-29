# Skills avaliadas e método de trabalho

## Instalações verificadas em 29/09/2026

Instalação pessoal em `C:/Users/Matheus/.codex/skills`, reutilizável em outros projetos. Foram examinados os arquivos SKILL.md das cinco candidatas e o catálogo curado; isso é revisão de finalidade e instruções, não auditoria integral de todos os arquivos dos repositórios.

| Skill | Origem e revisão instalada | Uso e limite |
| --- | --- | --- |
| grill-me | [Matt Pocock](https://github.com/mattpocock/skills/tree/d81f3a183412e71a5b1e84ca21bc1a35eea03a60/skills/productivity/grill-me) | Atalho de entrevista; delega para grilling |
| grilling | [Matt Pocock](https://github.com/mattpocock/skills/tree/d81f3a183412e71a5b1e84ca21bc1a35eea03a60/skills/productivity/grilling) | Dependência de grill-me; explora decisões e seus pré-requisitos |
| frontend-design | [Anthropic](https://github.com/anthropics/skills/tree/8a1541c4a3ffa5a20a5a91de0dcf3f0bab1d1ef4/skills/frontend-design) | Direção visual contextual; adaptar ao aplicativo móvel e ao brief de UX |
| security-best-practices | [OpenAI](https://github.com/openai/skills/tree/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-best-practices) | Revisão de segurança quando solicitada; referências web não substituem orientação específica de React Native |
| security-threat-model | [OpenAI](https://github.com/openai/skills/tree/49f948faa9258a0c61caceaf225e179651397431/skills/.curated/security-threat-model) | Modelagem de ameaças quando solicitada, pertinente a identidade, anexos e acesso municipal |

O atalho grill-me menciona uma ferramenta chamada Skill. No ambiente Codex, resolver a chamada lendo e aplicando a skill instalada `grilling` pelo mecanismo disponível; não assumir que existe uma ferramenta com aquele nome. As originais foram preservadas. A descoberta automática das instalações deve ocorrer no próximo turno.

## Superpowers já disponível pelo plugin

| Skills | Aplicação no projeto |
| --- | --- |
| using-superpowers, brainstorming | Seleção do processo e descoberta do produto |
| writing-plans | Planos executáveis somente a partir de especificações revisadas |
| executing-plans, subagent-driven-development | Alternativas de execução; escolher uma por plano |
| dispatching-parallel-agents | Somente tarefas independentes que justifiquem coordenação; não obrigatório |
| using-git-worktrees | Isolamento quando começar a implementação |
| test-driven-development, systematic-debugging | Mudanças verificáveis e diagnóstico antes de correções |
| requesting-code-review, receiving-code-review | Revisão dos incrementos e tratamento crítico do feedback |
| verification-before-completion, finishing-a-development-branch | Evidência de conclusão e encerramento do trabalho |
| diagnosing-superpowers | Investigar problemas no próprio processo se ocorrerem |
| writing-skills | Somente se houver necessidade real de criar ou alterar uma skill |

Nesta revisão foram lidas e aplicadas as instruções de using-superpowers, brainstorming, writing-plans e verification-before-completion, além de skill-installer. As outras foram classificadas pelo escopo descrito no catálogo e devem ser lidas integralmente quando acionadas. Nenhuma implementação ou revisão de segurança foi executada.

## Capacidades existentes e escolhas adiadas

- **Figma:** plugins já disponíveis para protótipos e biblioteca visual, caso essa ferramenta seja escolhida. Não duplicar instalação pelo catálogo curado.
- **Supabase e segurança de backend:** fora do escopo atual de demonstração mockada. Não configurar backend.
- **PDF, documentos, apresentações e planilhas:** já disponíveis para evidências e entrega do TCC, quando necessárias.
- **Firecrawl:** pesquisa de fontes quando a tarefa requerer; fontes oficiais para gov.br e compatibilidade técnica.
- **Playwright:** candidato a testar o painel web confirmado; não testa a interface nativa Android/iOS.
- **Deploy de provedores e Sentry:** adiar até definir hospedagem e observabilidade.
- **Skills de linguagens ou produtos não usados, mascotes, Canva e automações de conteúdo:** sem necessidade no ciclo essencial atual.

## Regras de combinação

1. O pedido do usuário e os princípios de UX prevalecem sobre padrões genéricos de uma skill.
2. Superpowers coordena o processo; grill-me é opção de aprofundamento, sem duplicar entrevistas.
3. Não exigir instalação duplicada de skills já fornecidas por plugins.
4. Uma skill instalada não cria conta externa, autoriza publicação ou escolhe fornecedor.
5. Artefatos ficam em `plan`, substituindo o caminho padrão `docs/superpowers` por preferência explícita do usuário.
6. Registrar decisões pendentes como pendentes; não apresentar um roteiro de descoberta como plano técnico executável aprovado.
