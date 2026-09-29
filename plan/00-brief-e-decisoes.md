# Brief e decisões — Fiscaliza AI

## Escopo confirmado
TCC sobre cidades inteligentes. Aplicativo Android/iOS do cidadão e painel web separado da prefeitura, ambos com dados mockados. O usuário excluiu backend e implementação real das integrações: o objetivo é apresentar a experiência.

gov.br permanece como conceito do produto, representado por uma entrada demonstrativa, sem coletar CPF ou senha reais. A proposta anterior de Supabase/backend compartilhado foi descartada.

## Princípios de UX
- Necessidades das pessoas e contexto municipal antes da aparência.
- Convenções familiares, causa e efeito visíveis e consistência.
- Revisão, correção e reversão quando aplicáveis.
- Estratégia → escopo → arquitetura da informação → wireframes → protótipo → validação → acabamento.
- Personalidade visual subordinada à execução das tarefas.

## Decisões
| ID | Definição | Estado |
| --- | --- | --- |
| D01 | TCC demonstrativo, aplicativo Android/iOS | Confirmada |
| D02 | Jornadas do cidadão e da equipe gestora | Confirmada |
| D03 | Prefeitura em painel web separado | Confirmada |
| D04 | Prazo e critérios da banca | Pendente |
| D05 | Participantes disponíveis para avaliação | Pendente; município parceiro não é requisito para os mocks |
| D06 | Dispositivos e forma de distribuição | Pendente |
| D07 | Sem autenticação ou gov.br reais | Fora do escopo de implementação |
| D08 | Dados mockados, sem backend | Confirmada |
| D09 | Continuidade da apresentação entre interfaces | Confirmada: cenários preparados, independentes e coerentes |

## Proposta de demonstração
Compartilhar definições e dados iniciais no código, mantendo alterações locais independentes. Cenários “registrado”, “em atendimento” e “resolvido” representam o mesmo relato em etapas diferentes.

Criar um relato no celular não o faz aparecer no navegador. Se a banca precisar acompanhar exatamente o relato digitado ao vivo, considerar transferência manual de dados, mediante definição explícita. Não construir um serviço oculto de sincronização.

## Próximas definições
D09 foi aceita junto à autorização de começar a implementação com coordenação de subagentes. Refinar jornadas e direção visual a partir dos princípios já definidos; dispositivos e distribuição externa permanecem pendentes. Execução local está autorizada, sem publicação ou contratação de serviços.
