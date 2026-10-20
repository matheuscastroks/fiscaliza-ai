# Fiscaliza aí — Produto

## Posicionamento

Plataforma inteligente de exploração e análise de dados públicos urbanos com foco exclusivo no município do Rio de Janeiro (IBGE `3304557`). A aplicação agrega dados oficiais da Central 1746 (DATA.RIO via Google BigQuery), democratizando o acesso a informações públicas sobre chamados, serviços, prazos de atendimento, secretarias e distribuição territorial na cidade.

A plataforma integra os registros oficiais com as camadas participativas existentes (propostas cidadãs, consultas e ações públicas), permitindo ao cidadão compreender profundamente a infraestrutura da cidade sem a pretensão de abrir novos chamados no 1746 neste estágio inicial.

## Fonte de dados primária

- **DATA.RIO / Central 1746 (BigQuery)**: tabela `datario.adm_central_atendimento_1746.chamado` e tabela mestre `datario.dados_mestres.bairro`.
- **Arquitetura de sincronização**: Pipeline desacoplado `DATA.RIO (BigQuery) -> Sincronizador Backend -> PostgreSQL -> Fastify API -> Expo Client`. O frontend jamais acessa o BigQuery diretamente.
- **Transparência e privacidade**: Dados públicos sem informações pessoais identificáveis (PII) de cidadãos. Número de logradouro não é exposto.

## Plataformas

Adaptive — aplicativo Expo (Android/iOS) e web cidadão. O mapa territorial conta com suporte a agrupamento dinâmico (clustering) e alternância integrada com visualização em lista.

## Contexto de uso e escopo

Foco exclusivo no município do Rio de Janeiro (`3304557`). Leitura, sincronização periódica, organização, visualização no mapa e interpretação de dados urbanos oficiais.

## Públicos e responsabilidades

- **Cidadão / Pesquisador urbano**: explora problemas oficiais registrados, visualiza no mapa e em lista com filtros de bairro, tipo de serviço, situação e período; acompanha indicadores públicos e propõe iniciativas.
- **Gestão / Monitoramento**: visualiza a distribuição territorial de chamados por secretaria (COMLURB, CET-RIO, RIOLUZ, etc.) e taxas de resolução dentro do prazo.

## Jornadas

1. **Inteligência 1746**: visão geral de chamados → métricas da cidade → filtros por bairro e tipo de serviço → detalhamento oficial de prazo e órgão executor.
2. **Exploração Territorial**: mapa interativo com pins oficiais e clustering inteligente → alternância fluida entre mapa e lista → consulta detalhada de despacho oficial.
3. **Participação Cidadã**: propostas comunitárias e consultas públicas que complementam o entendimento urbano da comunidade.

## Princípios

- **Transparência e fidedignidade**: distinção explícita entre dados oficiais municipais (DATA.RIO/1746) e propostas da comunidade.
- **Proteção orçamentária de dados**: consultas em BigQuery utilizam dry runs, particionamento diário/mensal e `maximumBytesBilled` estrito.
- **API como autoridade**: o banco PostgreSQL local armazena os dados sincronizados para consultas de baixa latência e resiliência offline.
- **RITO**: razão, informação, tarefa e originalidade funcional em todas as telas. Sem cards aninhados desnecessários ou marketing vazio.
