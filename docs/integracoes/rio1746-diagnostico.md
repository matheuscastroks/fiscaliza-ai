# Diagnóstico e Validação da Base Central 1746 (DATA.RIO)

Este documento registra a inspeção técnica, empírica e segura realizada diretamente sobre o Google BigQuery da Prefeitura do Rio de Janeiro / DATA.RIO em **20/10/2026**.

---

## 1. Fonte Oficial e Ambiente

* **Projeto e Dataset**: `datario.adm_central_atendimento_1746`
* **Tabela inspecionada**: `chamado`
* **Dataset auxiliar**: `datario.dados_mestres.bairro` (167 bairros com nomes e subprefeituras oficiais)
* **Localização geográfica dos dados**: `US` (multirregião BigQuery)
* **Frequência de atualização declarada**: Diária
* **Cobertura temporal identificada**:
  * Primeira partição: `2010-06-01`
  * Última partição publicada: `2026-09-20`
* **Total de registros históricos**: `20.263.797` (~20,2 milhões de chamados)
* **Tamanho total físico/lógico**: `6,77 GB` (lógico) / `608 MB` (físico compactado)
* **Particionamento**: `data_particao` (tipo `DATE`, granularidade mensal)
* **Mecanismo de Autenticação utilizado**: Google Cloud SDK (`gcloud` / Application Default Credentials - ADC) via `@google-cloud/bigquery` v9.3.0 sem chaves privadas versionadas.

---

## 2. Esquema Real da Tabela `chamado`

| Campo | Tipo BigQuery | Descrição Oficial / Análise de Conteúdo |
|---|---|---|
| `id_chamado` | `STRING` | **Identificador único estável** do chamado no banco da Prefeitura (chave primária natural). Ex: `"24002827"`. |
| `id_origem_ocorrencia` | `STRING` | Canal de entrada (telefone 1746, app, web, etc.). |
| `data_inicio` | `DATETIME` | Data e hora exata em que o operador registrou o chamado. |
| `data_fim` | `DATETIME` | Data e hora em que o chamado foi encerrado (nulo enquanto aberto). |
| `id_bairro` | `STRING` | ID numérico do bairro (chave estrangeira para `dados_mestres.bairro.id_bairro`). |
| `id_territorialidade` | `STRING` | Identificador de região especial (ex: CDURP - Porto Maravilha). |
| `id_logradouro` | `STRING` | ID único do logradouro. |
| `numero_logradouro` | `INTEGER` | Número da porta no logradouro onde ocorreu o evento. |
| `id_unidade_organizacional` | `STRING` | ID do órgão executor no sistema municipal. |
| `nome_unidade_organizacional`| `STRING` | Nome do órgão executor responsável (ex: `COMLURB`, `CET-RIO`, `RIOLUZ`, `SECONSERVA`). |
| `id_unidade_organizacional_mae`| `STRING` | ID do órgão superior / secretaria controladora. |
| `unidade_organizacional_ouvidoria`| `STRING` | Indicador se passou por canal de Ouvidoria (`"1"` ou `"0"`). |
| `categoria` | `STRING` | Categoria de atendimento (ex: `Serviço`, `Informação`, `Sugestão`, `Elogio`, `Reclamação`). |
| `id_tipo` | `STRING` | ID do tipo de chamado. |
| `tipo` | `STRING` | Nome do tipo do chamado (ex: `Iluminação Pública`, `Estacionamento irregular`, `Drenagem e Saneamento`, `Pavimentação`). |
| `id_subtipo` | `STRING` | ID do subtipo. |
| `subtipo` | `STRING` | Nome detalhado do serviço (ex: `Reparo de lâmpada apagada`, `Manutenção/Desobstrução de ramais de águas pluviais`). |
| `status` | `STRING` | Estado operacional detalhado (ex: `Aberto`, `Em Andamento`, `Fechado com providências`, `Não constatado`, `Fechado com solução`). |
| `situacao` | `STRING` | Situação macro: `"Não Encerrado"` vs. `"Encerrado"`. |
| `tipo_situacao` | `STRING` | Classificação padronizada: `Andamento`, `Atendido`, `Atendido parcialmente`, `Não constatado`, `Não atendido`. |
| `justificativa_status` | `STRING` | Motivo registrado pelo órgão técnico (quando aplicável). |
| `data_alvo_finalizacao` | `DATETIME` | Data estipulada pela Carta de Serviços da Prefeitura para conclusão. |
| `data_alvo_diagnostico` | `DATETIME` | Data prevista para vistoria/diagnóstico técnico preliminar. |
| `data_real_diagnostico` | `DATETIME` | Data real em que o laudo/diagnóstico foi realizado. |
| `tempo_prazo` | `INTEGER` | Quantidade de tempo do prazo. |
| `prazo_unidade` | `STRING` | Unidade do prazo: `"D"` (Dias) ou `"H"` (Horas). |
| `prazo_tipo` | `STRING` | `"D"` (Diagnóstico prévio) ou `"F"` (Finalização direta). |
| `dentro_prazo` | `STRING` | Indicador textual oficial: `A Vencer (No Prazo)`, `No Prazo`, `Fora do Prazo`. |
| `latitude` | `FLOAT` | Coordenada geográfica (WGS84). |
| `longitude` | `FLOAT` | Coordenada geográfica (WGS84). |
| `reclamacoes` | `INTEGER` | Quantidade de reiterações registradas para a mesma demanda. |
| `extracted_at` | `TIMESTAMP` | Timestamp da extração no pipeline da prefeitura. |
| `updated_at` | `STRING` | Data de atualização informada na origem. |
| `data_particao` | `DATE` | Coluna de particionamento da tabela (`Trunc(data_inicio)`). |

---

## 3. Diagnóstico e Métricas Reais da Amostra

Inspecionando a partição mais recente publicada (**`data_particao = '2026-09-20'`**):

* **Total de chamados no dia**: `870`
* **Unicidade de chaves**: 870 chamados com 870 `id_chamado` distintos (0% duplicidade).
* **Qualidade de Geolocalização**:
  * Com coordenadas preenchidas: **499 chamados (57,4%)**
  * Sem coordenadas (nulo): **371 chamados (42,6%)**
  * Coordenadas zeradas `(0, 0)`: **0 registros**
  * Todos os 499 chamados geolocalizados caem rigorosamente dentro do polígono municipal do Rio de Janeiro (`lat: -23.018 a -22.900`, `lng: -43.457 a -43.231`).
  * *Conclusão de produto*: Quase 60% dos chamados são mapeáveis com precisão de pino. Os outros 40% (pedidos institucionais, informações ou sem endereço geocodificado) devem ser navegáveis via visualização em lista territorial por bairro.
* **Diversidade de Serviços e Bairros**:
  * `75` tipos distintos e `126` subtipos em um único dia.
  * `123` bairros distintos contemplados (em um universo de 167 bairros da cidade).
* **Top 5 Tipos com maior demanda**:
  1. Estacionamento irregular (22,5%)
  2. Remoção Gratuita (11,7%)
  3. Perturbação do sossego (11,6%)
  4. Limpeza de logradouros (6,5%)
  5. Iluminação Pública (6,2%)
* **Volume nos 7 dias anteriores**:
  * 2026-09-20: 870 chamados
  * 2026-09-19: 2.509 chamados
  * 2026-09-18: 4.599 chamados
  * 2026-09-17: 6.282 chamados
  * 2026-09-16: 4.529 chamados
  * 2026-09-15: 4.672 chamados
  * 2026-09-14: 4.350 chamados
  * Média diária em dias úteis: **~4.500 a 6.000 chamados/dia**.

---

## 4. Privacidade, Governança e Regras de Exposição Pública

1. **Ausência de PII Direta**: A tabela pública do 1746 no DATA.RIO **não contém** nome, CPF, e-mail, telefone ou dados bancários do cidadão que abriu a solicitação.
2. **Dados Sensíveis Indiretos**:
   - `numero_logradouro`: Embora presente, expor o número exato da porta de residências privadas (ex: para chamados de perturbação do sossego ou vigilância sanitária) pode criar constrangimento entre vizinhos.
   - *Decisão de Engenharia*: A API pública do Fiscaliza aí expõe o `logradouro` e o `bairro`, mantendo o `numero_logradouro` truncado/omitido na camada pública para preservar a privacidade domiciliar.
3. **Isolamento de Origem**:
   - Todo registro carrega obrigatoriamente a identificação `source: 'rio1746'`.
   - O identificador público é mantido estritamente como `id_chamado` original do 1746 (ex: `"24002827"`).
   - O aplicativo declara explicitamente na UI: *"Dados públicos oficiais da Central 1746 / Prefeitura da Cidade do Rio de Janeiro via DATA.RIO"*.

---

## 5. Estratégia de Custos e Sincronização

* **Controle de Bytes**:
  - Uma consulta na coluna de partição (`data_particao`) processa apenas ~160 MB.
  - Uma consulta filtrada pela partição de um único dia processa **menos de 8 MB** (`7.932.854 bytes`).
  - O limite padrão `maximumBytesBilled` do sincronizador foi fixado em **500 MB** (`500.000.000 bytes`), garantindo que consultas acidentais sejam canceladas sem gerar faturas.
* **Pipeline de Ingestão**:
  - `DATA.RIO (BigQuery)` ➔ `Sincronizador Bounded (Fastify/Node.js)` ➔ `PostgreSQL (Tabela official_calls)` ➔ `API Fastify /api/rio1746/*` ➔ `App Expo`.
  - **Fase 1 de Importação**: Ingestão de uma amostra real representativa do período mais recente (`data_particao >= '2026-09-14'`), totalizando ~27.000 chamados reais com upsert idempotente por `id_chamado`.
