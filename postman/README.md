# Contrato e regressão

`fiscaliza.collection.json` é uma coleção Postman 2.1 importável, com assertions de comportamento para a API real. Ela cria dados: execute em banco exclusivo de validação. Não contém credenciais ou tokens persistidos.

Gere o OpenAPI a partir dos schemas Fastify com `npm run openapi --prefix backend`. Os DTOs públicos ficam em `shared/contracts.ts`; mudanças de contrato devem atualizar os exemplos desta coleção.

Execute: `postman collection run postman/fiscaliza.collection.json --env-var baseUrl=http://localhost:3001/api --env-var password=<senha-do-seed> --no-report-events`. A senha é fornecida pelo ambiente de apresentação; nunca grave credenciais reais na coleção. Não há workspace remoto vinculado nem publicação automática.


Municipal onboarding: the collection resolves CEP `20010000` (Rio de Janeiro), confirms municipality `3304557`, repeats confirmation idempotently and rejects a mismatched IBGE code before creating a Rio occurrence. The first CEP resolution needs ViaCEP unless already cached in the API database; subsequent calls use the database cache. Staff municipality comes from the account. Presentation reset remains Rio-only; other municipalities receive 409.

A origem dos requests é `{{webOrigin}}` (padrão `http://localhost:5173`). Para outra origem autorizada no servidor, acrescente `--env-var webOrigin=http://localhost:8085` ao comando. Mantenha `WEB_ORIGINS` coerente; não desative a validação de origem para executar a coleção.

A regressão também abre uma imagem de exemplo local, envia `demoPhoto` por multipart, cria uma proposta com a URL recebida e confirma a foto após reabrir. O padrão `demoPhoto=backend/data/demo-media/benches.jpg` é um arquivo ilustrativo CC0 versionado; execute a coleção a partir da raiz ou forneça o caminho efetivo via `--env-var demoPhoto=<arquivo>`. O teste cria dados apenas na base de validação escolhida.

Views são registradas por `PUT /occurrences/:id/view` e `PUT /civic-items/:id/view`, apenas para ocorrência/proposta. Uma conta conta uma vez por registro; repetir não duplica. Consultas e ações não recebem views. O ato de visualizar não cria participação nem acompanhamento.

Ocorrências novas exigem pelo menos uma foto enviada pelo próprio cidadão no município. Avaliação admite `rating` inteiro de 1 a 5, comentário opcional e um único encerramento pelo autor de ocorrência concluída; o payload legado `satisfied/reason` permanece compatível. A coleção valida também visualizações idempotentes e nota persistida.

Números dos cenários vêm de `demo_engagement` somados às relações reais. Não representam usuários reais, não marcam a conta ativa como apoiadora e não são usados para priorização técnica.

## Análise de foto

`POST /analysis` recebe `description` (pode ser vazia quando há foto) e `imageUrl` de `/api/attachments/<uuid>`. O anexo precisa pertencer à conta e ao município. Sem chave ou em falha do modelo, `imageAnalyzed=false`; somente retorno visual válido do Gemini usa `true`.

A simulação local segue o contrato GenerateContent documentado pelo Google: https://ai.google.dev/gemini-api/docs/generate-content/image-understanding . O mock é uma fixture de transporte, não um classificador. A busca por mock do proprietário foi omitida porque o CLI está sem login. Nenhuma configuração foi publicada.

Execute `postman simulation run postman/simulations/photo-analysis.sim.yaml --port 4900 --output ndjson` e, em outro terminal, `npm run build --prefix backend` seguido de `node postman/verify-photo-analysis.mjs`. O verificador usa HTTP real contra o serviço local, confere imagem normalizada como inline WebP e exercita fallback 503 e ausência de chave. A chamada externa real depende de `GEMINI_API_KEY` exclusivamente no servidor.
