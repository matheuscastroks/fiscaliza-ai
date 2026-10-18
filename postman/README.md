# Contrato e regressão

`fiscaliza.collection.json` é uma coleção Postman 2.1 importável, com assertions de comportamento para a API real. Ela cria dados: execute em banco exclusivo de validação. Não contém credenciais ou tokens persistidos.

Gere o OpenAPI a partir dos schemas Fastify com `npm run openapi --prefix backend`. Os DTOs públicos ficam em `shared/contracts.ts`; mudanças de contrato devem atualizar os exemplos desta coleção.

Execute: `postman collection run postman/fiscaliza.collection.json --env-var baseUrl=http://localhost:3001/api --env-var password=<senha-do-seed> --no-report-events`. A senha é fornecida pelo ambiente de apresentação; nunca grave credenciais reais na coleção. Não há workspace remoto vinculado nem publicação automática.


Municipal onboarding: the collection resolves CEP `20010000` (Rio de Janeiro), confirms municipality `3304557`, repeats confirmation idempotently and rejects a mismatched IBGE code before creating a Rio occurrence. The first CEP resolution needs ViaCEP unless already cached in the API database; subsequent calls use the database cache. Staff municipality comes from the account. Presentation reset remains Rio-only; other municipalities receive 409.

A origem dos requests é `{{webOrigin}}` (padrão `http://localhost:5173`). Para outra origem autorizada no servidor, acrescente `--env-var webOrigin=http://localhost:8085` ao comando. Mantenha `WEB_ORIGINS` coerente; não desative a validação de origem para executar a coleção.
