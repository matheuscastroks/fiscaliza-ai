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

## Fase 1 — Push correto e completo
| Item | Estado | Evidência |
| --- | --- | --- |
| O aparelho (token) pertence a uma conta: seguir e deixar de seguir exigem ser o dono (403 para outra conta); registrar o token em outra conta o transfere e apaga os avisos da conta anterior | feito | C + L (testes) |
| Validação: `additionalProperties: false`, token Expo válido, tamanhos máximos, no máximo 200 chamados com aviso por aparelho; plataforma só `android`/`ios` | feito | C + L |
| O município do token vem da conta, não do corpo | feito | C |
| A sincronização do 1746 detecta chamados que mudaram de status ou situação (compara com o valor anterior) e avisa quem segue, em lotes de até 100 por requisição à Expo; `DeviceNotRegistered` apaga o token; atualização de estado em um único `UPDATE`; falha de envio não derruba a sincronização | feito | C + L (testes com Expo simulada) |
| Mensagem factual: "A Prefeitura publicou nova situação: X" | feito | C |
| App: avisos só para quem tem conta (anônimo vê "Entre na sua conta"); botão e rota de teste removidos | feito | C (testes do app); não visto em aparelho |

Limite conhecido: o envio real à Expo e o recebimento no celular não foram exercitados (sem `projectId` do EAS); a evidência é com a Expo simulada.

### Pedido adicional: chamados salvos na conta
- Backend: tabela `saved_calls` (migração `0017`, apaga com a conta), rotas `GET /api/v1/saved-calls`, `PUT`/`DELETE /api/v1/saved-calls/:id`, `POST .../merge` (até 200) e `DELETE` da lista inteira; limite de 500 por conta; só para quem tem conta e município. Teste: outra sessão da mesma conta enxerga a lista, outra conta não.
- App: com conta, a lista vem do servidor e o aparelho guarda uma cópia para abrir sem internet. O que muda sem rede fica pendente (`pending`) e é enviado depois; a lista salva antes do login é adotada pela conta uma vez e então removida do armazenamento anônimo. Sem conta, tudo continua só no aparelho. Lugares, bairro preferido e aparência continuam por aparelho. C (testes de adoção, outro aparelho e pendência offline); **não verificado em dois aparelhos reais**.

## Fase 2 — Dados, consultas e desempenho
Detalhes e medição em [`evidence/2026-11-10-backend-fase2.md`](evidence/2026-11-10-backend-fase2.md). Resumo: validação e escape nas rotas 1746, teto de página, filtros unificados, cache em memória invalidado pela sincronização e `Cache-Control` nas leituras públicas, painel 183 → 89 ms de mediana (medição local), geometrias dos bairros em memória, migração `0018` (índices e vínculo), importação mais segura (rejeita linha sem data, não reescreve linha igual, paginação por chave, repetição) e testes que recusam banco que não termine em `_test`.

Desvio do plano: transação por página (2.500 linhas) e não por partição inteira, para não manter uma transação aberta durante as consultas ao BigQuery.

## Fase 3 — Infra
| Item | Estado | Evidência |
| --- | --- | --- |
| Dockerfile em dois estágios, base por digest, `HEALTHCHECK`, `CMD` direto em Node, `init: true`; imagem 625 MB → 348 MB; sem testes na imagem | feito | L (build, subida contra o Postgres local: saudável; `docker stop` em 0,6 s) |
| Migração como serviço de uma execução no Compose local; na produção, antes do Node no `command` (com `exec`) para funcionar com `up --wait` | feito (desvio do plano na produção) | C (`compose config`); L só no Compose local |
| Backup diário (`pg_dump -Fc` + tar dos uploads), 7 diários e 4 semanais, escrita atômica; `deploy/restore.sh`; teste de restauração | feito | L: restauração em banco descartável com as mesmas contagens; **não testado na VPS nem copiado para fora da máquina** |
| Agendador em Node (`scheduler.ts`): 1746 às 4h, SIURB aos domingos, limpeza de sessões; ping de sucesso/falha; credencial do BigQuery como secret | feito (desvio: Node em vez de supercronic, sem binário externo a manter) | C (testes de horário de Brasília, execução diária única, ping); **não executado contra o BigQuery real** |
| Compose: limites de memória e CPU, rotação de logs, `restart` em todos os serviços, healthcheck do `cloudflared`, versão do `cloudflared` fixada, `scheduler` e `backup` também na produção | feito | C (`compose config`) |
| Log de erro com stack | feito na Fase 0 | C |
| Monitores externos (UptimeRobot, Healthchecks.io) | **pendente, depende da sua conta**; o código já faz o ping | — |
| CI: `docker build` da imagem (e checagem de que não leva testes), `npm audit --omit=dev --audit-level=high` nos dois projetos, Dependabot (npm, actions, docker), actions fixadas por SHA | feito | C (não rodado no GitHub; o CI roda ao subir a branch) |
| Teste de "drift" do OpenAPI | adaptado: o `openapi.json` não é versionado (é gerado), então o teste confere que o contrato gerado documenta conta, avisos e chamados salvos e não tem `/notifications/test` | C |
| Expo: `eas.json` (development/preview/production, URL da API por perfil); o build de preview/production **falha** se `EXPO_PUBLIC_API_URL` não for https público; um só nome para o token do Mapbox (`EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`, nomes antigos aceitos com aviso) | feito | C (teste do guard; `app.config.js` recusa a URL de desenvolvimento num perfil de release). Build do EAS não executado |
| Trocar o package `com.anonymous.fiscalizaai` | **não feito, decisão sua**: o `google-services.json` (Firebase) e o app instalado dependem desse id; trocar exige registrar o app novo no Firebase e baixar outro arquivo, e quem já instalou teria de reinstalar | — |

### Incidente durante a execução
Num momento o Docker Desktop reiniciou (códigos 255) e a API e o Postgres do PC não voltaram sozinhos, porque o Compose antigo não tinha `restart`. Religuei os dois containers como estavam (`docker start`), sem alterar configuração. O novo `compose.yaml` já define `restart: unless-stopped`, mas só vale depois de recriar os containers.

## Fases seguintes
Fase 4 endurecimento e higiene. Cada uma registra aqui o que foi feito e o que ficou de fora.
