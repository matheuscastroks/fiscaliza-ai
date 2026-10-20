# Módulo de Integração DATA.RIO / Central 1746

Este módulo implementa a ingestão segura, idempotente e delimitada de chamados públicos da Central 1746 da Prefeitura do Rio de Janeiro a partir do Google BigQuery (`datario.adm_central_atendimento_1746.chamado`).

## Arquitetura de Dados

```text
DATA.RIO (BigQuery)
    │  (Query particionada + limite bytes faturados: 500 MB)
    ▼
backend/src/integrations/rio1746/
  ├── client.ts    (Conexão BigQuery via ADC)
  ├── queries.ts   (Consultas particionadas com JOIN em dados_mestres.bairro)
  ├── mapper.ts    (Validação de coordenadas no polígono do Rio e normalização)
  ├── importer.ts  (Batch upsert idempotente no PostgreSQL)
  └── sync.ts      (Controle de checkpoints e recuperação de falhas)
    │
    ▼
PostgreSQL (tabela official_calls + sync_checkpoints)
    │
    ▼
Fastify API (/api/rio1746/*)
    │
    ▼
App Expo (TerritoryScreen, Home, Detalhes)
```

## Regras de Segurança e Custo

1. **Nunca executar `SELECT *`**: Sempre selecionar colunas nominais estritas.
2. **Filtragem obrigatória por partição**: Toda extração inclui `WHERE data_particao = 'YYYY-MM-DD'`.
3. **Orçamento por execução**: `RIO1746_MAX_RUN_BYTES=500000000` limita o conjunto de páginas e partições. Cada query tem dry run e `maximumBytesBilled` limitado ao saldo e ao teto de 500 MB. Faturamento não confirmado consome todo o valor reservado; a execução pode encerrar parcialmente.
4. **Privacidade**: O número residencial é omitido na exposição pública; nomes e dados de contato do cidadão não existem no dataset público.
5. **Idempotência**: O upsert utiliza `ON CONFLICT (external_id) DO UPDATE SET ...` baseado no `id_chamado` oficial.

6. **Concorrência**: API e CLI usam a mesma trava PostgreSQL por fonte; uma segunda execução recebe conflito, sem iniciar consulta paga.
7. **Cobertura**: `source_sync_runs` registra intervalo solicitado, tentativas e cobertura. Limite de registros/orçamento não equivale a carga completa; não avança a data do último sucesso completo. O status público omite mensagens internas do provedor.

8. **Projeto e credenciais**: configurar `GCP_PROJECT_ID` (ou `BIGQUERY_PROJECT_ID`) explicitamente. A autenticação usa ADC padrão ou `GOOGLE_APPLICATION_CREDENTIALS`; o cliente não escolhe o primeiro perfil legado encontrado no computador. Não inclua credenciais nas imagens ou no Git.

Informe explicitamente a partição ou intervalo no CLI: `npm run sync:rio1746 -- 2026-09-20 1000` ou `npm run sync:rio1746 -- 2026-09-20 2026-09-22`. Não há partição histórica padrão. Os testes usam um adaptador controlado do SDK e PostgreSQL isolado, sem consultas Google faturadas.
