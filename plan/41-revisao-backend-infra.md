# Revisão de backend e infra — diagnóstico e execução

Data: 2026-11-10. Origem: revisão de `back/` (Fastify 5 + PostgreSQL + Drizzle) e da infra (Docker, Compose, Cloudflare Tunnel, CI), feita com o guia de boas práticas de segurança para Node e três auditorias (API, dados e importações, infra). Decisões do usuário: a produção continua no PC por ora, endurecida com um modo público; o push é corrigido e completado.

Convenção de evidência (AGENTS.md): **C** = código e testes automatizados; **L** = ambiente local (Postgres do Docker, banco `fiscaliza_test`); **P** = produção real (domínio público). Nenhum item abaixo foi verificado em **P**: não reiniciei containers nem mexi no túnel.

## O que já estava bom
Sem SQL injection (consultas parametrizadas); uploads re-codificados para WebP com checagem de assinatura; CSRF mitigado (Origin + cookie `httpOnly`/`SameSite=Lax`); sessões opacas guardadas em hash; migrações com journal, checksum e lock; CI com Postgres real; `compose.production.yaml` bem montado; sem segredo real no git.

## Achados críticos
1. Produção rodava em modo de desenvolvimento (CORS aceitava `null`, LAN e `exp://`; cookie sem `Secure`).
2. Cada requisição de notificação criava um `pg.Pool` novo e nunca o fechava.
3. Exclusão de conta falhava com 500 para quem tinha enviado foto (FK sem `ON DELETE`); arquivos nunca eram apagados.
4. Push abusável: `/notifications/test` com título e corpo livres; token de outro usuário podia ser tomado; o aviso nunca era disparado.
5. Toda escrita segurava uma conexão de um segundo pool com lock bloqueante durante o handler inteiro, upload incluso; sem `statement_timeout`.
6. Sem backup e sem sincronização agendada.

## Fase 0 — Emergência (este PR)
| Item | Estado | Evidência |
| --- | --- | --- |
| `cloudflared` só com `--profile public`, versão fixada; `compose.public.yaml` com `NODE_ENV=production`, origem única e logs limitados | feito | C (`compose config`), L |
| `back/src/config.ts`: produção exige `DATABASE_URL`, `WEB_ORIGINS`, `TRUST_PROXY` e recusa senha de exemplo e origens `*`/`null` | feito | C (testes) |
| Um pool só: notificações recebem o `db` do app | feito | C + L (conexões estáveis após 31 chamadas) |
| Pool com `statement_timeout` (10 s), `lock_timeout` e `idle_in_transaction_session_timeout`; Fastify com `requestTimeout` e `connectionTimeout` | feito | C |
| Lock por usuário: pool dedicado e advisory lock no banco trocados por fila em memória (sem segurar conexão); uploads ficam de fora | feito, com ressalva abaixo | C |
| Migração `0016`: `ON DELETE CASCADE` em `attachments.owner_id` e `records.author_id`; a API apaga os arquivos e troca de avatar apaga o anterior | feito | C + L |
| Prefixo `/api/profile` (sem barra) tratado como rota de conta | feito | C + L |
| `/api/v1/notifications/test` removido | feito | C + L (404) |
| Log de erro 500 com stack (`err`) | feito | C |

Ressalva sobre o lock: a fila em memória pressupõe uma única instância da API, que é o caso hoje (um container). Se houver mais de uma instância, a serialização por usuário volta para o banco (`pg_advisory_xact_lock` em transação curta).

### O que encontrei no ambiente local (não alterado)
O `.env.compose` do PC usa a **senha de exemplo do Postgres**, `NODE_ENV=development` e `API_BIND=0.0.0.0` (API aberta na rede local sem passar pelo túnel). Com o modo público, a API recusa subir com essa senha. Para ligar o modo público é preciso, antes: definir uma senha própria (e rodar `ALTER USER` dentro do Postgres), trocar `API_BIND` para `127.0.0.1` e subir com `compose.public.yaml`. Passos em `deploy/README.md`. Não executei isso porque reinicia a produção.

## Fases seguintes
Fase 1 push correto; Fase 2 dados, consultas e cache; Fase 3 infra (Dockerfile, backup, agendador, CI, Expo); Fase 4 endurecimento e higiene. Cada uma registra aqui o que foi feito e o que ficou de fora.
