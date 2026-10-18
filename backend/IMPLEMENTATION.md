# API persistente Fiscaliza-AI

Requer Node 22 e PostgreSQL 17. Nenhum banco em memória é usado pelo servidor.

## Executar

Na raiz, defina `DEMO_PASSWORD` no ambiente e execute `docker compose up --build`. O Compose sobe PostgreSQL, aplica a migração idempotente, cria os registros iniciais e inicia a API em `http://localhost:3001`. Os volumes `fiscaliza_postgres` e `fiscaliza_uploads` preservam banco e imagens. A porta PostgreSQL fica limitada ao loopback. Para hospedar, configure TLS, `WEB_ORIGINS`, senha forte do banco e senha própria de apresentação.

Sem Docker, aponte `DATABASE_URL` a PostgreSQL e, dentro de `backend`, execute `npm install`, `npm run migrate`, `npm run seed`, `npm start`. As variáveis são lidas do ambiente do processo; `.env.example` é um modelo e não é carregado automaticamente. `npm run typecheck`, `npm test` e `npm run openapi` validam tipos, executam testes e geram a especificação OpenAPI, respectivamente.

Contas iniciais: `ana@vilaesperanca.exemplo` (cidadã), `gestao@vilaesperanca.exemplo` (gestão) e `admin@vilaesperanca.exemplo` (admin). Fora de produção, a senha inicial padrão é `Fiscaliza123!`. Em produção, `DEMO_PASSWORD` é obrigatória. Seed é idempotente: não troca senhas existentes nem apaga dados. O reset pela API exige sessão de administrador e repõe o cenário inicial; ele mantém usuários, remove os anexos e restaura os registros do cenário escolhido.

## Contrato e persistência

DTOs: `shared/contracts.ts`. Base `/api`, com envelopes `{success,data?,error?}`. As exceções de transporte são arquivos binários de `/api/attachments/:id` e o preflight CORS. Login fornece token para app nativo e cookie HttpOnly/SameSite para navegador. O cidadão envia X-Fiscaliza-Client: citizen e usa citizen_session; o painel usa session. Assim, ambos podem funcionar no mesmo navegador sem substituir a sessão um do outro. O cabeçalho apenas seleciona o cookie; permissões continuam derivadas da sessão. Nunca envie `userId` em mutações: o servidor usa a sessão autenticada. Em requisições com cookie, envie `credentials: include`; escritas com cookie exigem `Origin` na lista `WEB_ORIGINS`.

O banco armazena usuários e hashes scrypt, hashes de tokens com validade de sete dias, documentos de domínio em JSONB, relações de apoio/acompanhamento e respostas com chaves compostas únicas. Mutações de domínio usam transações e bloqueio da linha para impedir perda de comentários, histórico e avaliações concorrentes. Migração é separada do reset e usa bloqueio consultivo PostgreSQL. Leituras públicas não retornam e-mails; `/auth/me` e login retornam somente o usuário da sessão.

Listagens aceitam `limit` (até 100) e `offset`; `/activity` devolve no máximo 500 registros relacionados. Apoio não altera prioridade. Ocorrências entram pendentes, com prioridade média, e transições exigem gestão e justificativa. Avaliação insatisfeita registra solicitação de revisão, mantendo a conclusão até decisão da gestão. Consultas rejeitam respostas após prazo/fechamento e mantêm uma resposta por usuário. Gestão deve publicar decisão de proposta e resultado de consulta para concluir esses fluxos.

Anexos aceitam um arquivo multipart JPEG/PNG/WebP de até 5 MB, com validação de assinatura e MIME, UUID gerado e gravação em volume local. A API somente aceita URLs relativas emitidas pelo upload, verificando a existência dos anexos antes de vinculá-los. Não recebe URIs locais ou URLs arbitrárias para buscar imagens.

Gemini recebe apenas texto, com chave exclusiva do servidor, limite por endpoint e prazo de 10 segundos. Imagens permanecem no armazenamento local e não são enviadas ao provedor externo. O endpoint aceita apenas a descrição textual. A revisão automática rejeitou o envio externo de conteúdo das imagens; a análise multimodal depende de autorização explícita para esse envio ao Google Gemini. Modelo configurável por `GEMINI_MODEL`, padrão `gemini-3.8-flash`. Ausência de chave, falha, timeout ou resposta inválida retornam sugestão heurística determinística. A sugestão não é aplicada automaticamente a um registro. Referência REST: https://ai.google.dev/api/generate-content.

## Verificação

`test/api.test.ts` verifica hash de senha, autenticação, validação, CSRF, health, OpenAPI e fallback IA sem exigir banco. `test/postgres.test.ts` executa o ciclo real de login, criação, apoios idempotentes, permissões, resolução, revisão, consulta e encerramento. Sem `DATABASE_URL`, esse teste aparece explicitamente como **skipped**. Com a variável definida, falha de conexão ou migração ausente deve falhar o teste; não há substituição por mock. Execute migração antes da integração e use banco de teste dedicado, pois ela cria registros de teste persistentes.

Limites operacionais: o armazenamento local exige volume e backup; a coleta de anexos órfãos e expiração de sessões não possui agendador. O `/health` comprova que o processo responde; `/api/health` também verifica PostgreSQL. Arquivos enviados são públicos por URL opaca para exibição das evidências urbanas; não envie dados pessoais ou anexos privados.

Proxy: TRUST_PROXY aceita uma lista explícita de IPs/CIDRs confiáveis; por padrão nenhum cabeçalho encaminhado é confiável. O Compose reserva a rede 172.30.97.0/24 para seus proxies. Se alterar a sub-rede, ajuste também essa variável. Não use confiança global em proxies com a API exposta diretamente.


## Municipal onboarding

The additive `0002_municipalities.sql` migration assigns existing demonstration records and attachments to Rio de Janeiro (3304557), loads its official IBGE polygon and binds only unassigned staff/admin users. Citizens retain their current binding or start unassigned. Migration reruns never change an existing residence. `migrate` applies sorted SQL files once, recording filename and SHA-256 in a transactional migration journal under the existing advisory lock. A changed applied migration is rejected; restart never repeats the legacy backfill. Docker includes the official geometry in `backend/data` for offline seeding.

Authenticated citizens query `GET /api/profile/postal-code/:cep` and confirm `PUT /api/profile/municipality` with `{postalCode, municipalityId}`. The server resolves ViaCEP, validates the confirmed IBGE code, caches the lookup for 30 days and stores municipality geometry from IBGE. External calls have an eight-second timeout; malformed, missing and unavailable results fail without changing the profile. Municipal boundaries use Polygon/MultiPolygon rings, holes and boundary points, never display bounding boxes.

All civic reads/writes, duplicate detection, indicators, links and attachment references use the authenticated municipality. New occurrence coordinates must be inside the official polygon. Request-supplied municipality fields are rejected. Citizens without a binding receive a useful 403 until confirmation. Auth/profile and binary attachment retrieval remain available. Staff cannot select another municipality through onboarding. Each authenticated mutation acquires its PostgreSQL advisory user lock inside a handler wrapper after body parsing/validation, refreshes the profile and releases in finally only after the handler completes. Requests disconnected while waiting are rejected after acquisition; multipart read aborts reject the read and reach finally without relying on onResponse. Residence changes and creates cannot use a stale concurrent profile.

Activity preserves records a user authored, supported, followed or answered in previous municipalities as read-only history. Direct detail and mutations outside the current municipality return 404. Binary images retain their existing public UUID URLs for native/web image compatibility; image metadata is not exposed. New references require an attachment owned by the actor in the current municipality.

Presentation scenarios are Rio fixtures: an admin in another municipality receives 409 before any changes. Rio reset deletes only Rio records and attachments; cascaded relations refer only to those deleted records. Other municipalities, their attachments, relations, answers and user residence remain untouched.

`backend/test/municipality.test.ts` covers holes/boundaries, onboarding, lookup errors/cache, municipality mismatch, staff restrictions, outside points, read/mutation/link/attachment isolation, overview, historical activity and preservation of another municipality during reset. Upstream fetch is injected in PostgreSQL tests, so integration tests make no external requests.
