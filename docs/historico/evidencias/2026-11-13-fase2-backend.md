# Fase 2 da revisão geral — backend: contratos, robustez e consistência (13/11/2026)

Evidência: **C** = código e testes automatizados; **L** = ambiente local (banco `fiscaliza_test`).

| Item | O que mudou | Evidência |
| --- | --- | --- |
| Datas por dia | `startDate`/`endDate` sem hora valem como dia no Rio (UTC-3): "2026-10-01" começa às 03:00 UTC. Antes, o filtro deslocava 3 horas | C (teste do intervalo) |
| Merge de salvos | Perto do limite de 500, o merge contava IDs já salvos e podia descartar o novo; agora só os novos contam, na ordem do pedido | C + L (teste com 499 salvos) |
| Filtro duplicado | `situacao` entrava duas vezes na consulta da lista | C |
| Índices (`0020`) | `call_notification_followers(push_token)` e `(user_id)`; removido o índice de `municipality_id`, coberto pelo prefixo do índice do cursor | C + L (migração aplicada nos testes) |
| Contorno do Rio | Lido uma vez e mantido em memória, em vez de a cada `/territory/resolve` e busca por raio | C |
| Validação | Query de `/rio1746/calls` e `/overview` recusa parâmetro desconhecido; `calls/:id`, `postal-code/:cep` e `attachments/:id` ganham schema de parâmetro | C (o app envia só parâmetros conhecidos) |
| Erros | Erro de validação e limite de requisições respondem em português; erro 500 vai ao log com o contexto da requisição (`req.log`) | C |
| Id de requisição | `cf-ray` da Cloudflare quando houver, senão UUID | C |
| Pool | Erro em conexão ociosa aparece no log em vez de ser engolido | C |
| Encerramento da API | Prazo de 10 s; segundo sinal sai na hora | C |
| SIURB | Mudança de URL, atribuição ou uso permitido no catálogo chega ao banco (antes, só na primeira inserção) | C + L |
| Contratos | Tipos dos chamados salvos (`SavedCallItem`, `SavedCallsList`, `SavedCallsMergePayload`) no `shared/`, usados pelo app e pela API; `platform` do push só `android`/`ios`, como o servidor; removido `TestNotificationPayload` | C (typecheck dos dois) |
| Testes | No CI, a suíte recusa rodar sem `DATABASE_URL` (antes, ~30 testes pulavam e o CI ficava verde); o build limpa `dist/`, para teste removido não rodar de novo | C |
| `engines` | `node >= 22.13` (mínimo do Expo SDK 58 e do Dockerfile) | C |

## Desvios do plano
- **TypeBox não foi adotado.** As rotas já usam JSON Schema; trocar para TypeBox em todas seria reescrita sem mudança de comportamento. O que importava (validar o que faltava e alinhar os tipos de app e API pelo `shared/`) foi feito sem a dependência nova.
- **Plugins `fastify-plugin` e autorização por rota não foram feitos.** A lista de rotas públicas em `app.ts` continua por caminho; mudar a forma de registro tocaria todas as rotas e fica para quando houver rota nova que precise disso.
- **Prefixo `/api` × `/api/v1` não foi unificado.** Exige aliases no app instalado; sem build de loja publicado, o custo não se paga agora.
- **`count(*)` opcional e cursor em `/calls`** já existiam (`includeTotal`, `cursor`); não houve mudança.
