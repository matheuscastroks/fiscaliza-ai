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
3. **Trava de faturamento**: Todas as queries definem `maximumBytesBilled: '500000000'` (500 MB).
4. **Privacidade**: O número residencial é omitido na exposição pública; nomes e dados de contato do cidadão não existem no dataset público.
5. **Idempotência**: O upsert utiliza `ON CONFLICT (external_id) DO UPDATE SET ...` baseado no `id_chamado` oficial.
