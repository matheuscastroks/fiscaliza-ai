# Fase 0 da revisão geral — produção (13/11/2026)

Plano: revisão geral do projeto (backend, app, infra), Fase 0. Evidência: **C** = código e testes automatizados; **L** = ambiente local (Docker do PC, banco `fiscaliza_test`); **P** = produção (domínio público).

## Encontrado em produção antes da correção
- **API fora do ar (P):** `https://fiscalizaai.matheuscastroks.com.br/api/health` respondia 502. O container `api` estava parado desde 11/11 22h25 e a recriação da stack não o subiu: a porta 3001 do host está ocupada por outro serviço local. A API foi religada em `127.0.0.1:43001` (a pedido do usuário); o túnel continua em `http://api:3001` dentro da rede do Compose. Depois disso, `/api/health` local e público responderam 200.
- **Limpeza de fotos falhando todo dia (P):** log do agendador: `fotos-orfas falhou: Configuração incompleta para produção: defina WEB_ORIGINS, TRUST_PROXY.`
- **Sync do 1746 parado desde 08/11 (P):** `rio1746 falhou: Configure GCP_PROJECT_ID`. Falta a credencial do BigQuery (ação do usuário). A base tem chamados de apenas 7 partições, de 14/09 a 20/09/2026.

## Correções
| Item | O que mudou | Evidência |
| --- | --- | --- |
| Limpeza de fotos | O agendador lê só `UPLOAD_DIR` (`uploadDirFrom`), sem exigir a configuração HTTP da API | C (teste com `NODE_ENV=production` sem `WEB_ORIGINS`/`TRUST_PROXY`) |
| Situação de chamados antigos | A partição do 1746 é a data de abertura, e a sincronização diária só relia os dois últimos dias, então um chamado salvo nunca tinha a situação atualizada. Agora cada execução também relê os chamados abertos que alguém salvou ou acompanha (até 2.000), pela partição de abertura e pelo id, em lotes de 500 | C + L (teste: chamado salvo de setembro, fechado na fonte, é atualizado numa sincronização de novembro; o não salvo não é consultado) |
| Push que falhou | Caixa de saída `notifyPendingFollowers`: depois de cada sincronização (mesmo falha), avisa todo seguidor cuja última situação avisada difere da gravada. Chamada à Expo com prazo de 15 s | C + L (teste: Expo fora na sincronização → aviso sai na rodada seguinte, uma vez só) |
| Agendador ao reiniciar | Só dá por feita a tarefa que o banco confirma ter rodado no dia (`source_sync_runs`). Execuções presas em `running` há mais de 1 h viram `failed`. Ao parar, espera a tarefa em curso (até 25 s) | C + L |
| Backup | `set -e` era ignorado dentro do `if run_backup`: um `pg_dump` falho publicava cópia parcial e mandava sucesso ao monitor. Agora roda num subshell com `set -e` próprio, valida o dump com `pg_restore --list` e apaga o temporário na falha | L (falha simulada com `pg_dump` sem servidor → "FALHOU", nada publicado; sucesso real no container de backup → dump de 5,3 MB com 20 tabelas, apagado em seguida) |
| Pacote do release | O tarball não levava `backup.sh`, que é montado no Compose de produção: o primeiro deploy na VPS falharia. A lista vive em `deploy/release-files.txt`, e o CI valida o Compose a partir do pacote extraído e confere cada arquivo montado | L (pacote extraído e montagens listadas) |
| Porta da API | `API_PORT=43001` no exemplo; README, `front/.env.example`, `eas.json` (development), Postman e o padrão do app em 43001 | C |

## Não verificado
- Sincronização real com o BigQuery: sem credencial. O custo da revisita (bytes por execução) só pode ser medido quando a credencial existir; o orçamento por execução (`RIO1746_MAX_RUN_BYTES`, 500 MB) continua valendo.
- Push real no celular: sem `projectId` do EAS.
- CI no GitHub: os passos novos do workflow foram simulados localmente, não executados no GitHub.
