# Backend, Fase 2 — evidência

Tipos de evidência: **C** código e testes (banco `fiscaliza_test`), **L** medição local (Postgres do Docker, base de desenvolvimento com 27.814 chamados). Nada foi medido em produção.

## Painel `/overview` (consulta principal)
Medição de `queryOfficialOverview` sobre toda a base de desenvolvimento, 7 repetições após aquecimento, antes (commit `089aa4d`: 10 consultas em série) e depois (5 consultas em paralelo, duas fundidas, ranking servindo o top 10):

| Versão | mínimo | mediana |
| --- | --- | --- |
| antes | 137 ms | 183 ms |
| depois | 56 ms | 89 ms |

Medição em um computador só, sem concorrência de outras requisições; é indicativa, não garante o mesmo ganho sob carga. O cache em memória elimina a consulta nas repetições com os mesmos filtros (chave = filtros + versão dos dados; uma sincronização muda a versão). O ganho do cache não foi medido separadamente; a correção da invalidação é coberta por teste.

## Resultado do que foi feito
- Rotas 1746: parâmetros escalares com tamanho máximo (repetir parâmetro dá 400), `page` com teto (500; depois use cursor), `%` e `_` escapados em `bairro` e `search`, montador de filtros único entre lista e painel — C.
- `Cache-Control: public, max-age=60, stale-while-revalidate=300` nas leituras públicas; cache em memória para `/overview`, `/filters` e o panorama de bairro — C.
- Panorama de bairro não calcula mais o painel completo só para achar o primeiro e o último dia — C.
- Geometrias dos bairros ficam em memória por versão de dados (ponto no polígono) — C. `hydrate` seleciona só `data` do município (sem a geometria).
- Migração `0018`: índices em `sessions(user_id)`, `attachments(owner_id)`, `records(author_id)`; remove índice duplicado de `external_id`; vínculo `official_calls.municipality_id → municipalities` — C + L.
- Importação: uma transação por **página** de 2.500 (e não por partição inteira, que seguraria uma transação aberta durante as consultas ao BigQuery); linha sem `data_inicio` é rejeitada e contada em `rejectedCount` (antes recebia a data de hoje); linha igual à existente não é reescrita (contador `updated` passa a significar "mudou de fato"); paginação por chave (`CAST(id_chamado AS STRING) > @afterId`) em vez de `OFFSET`; repetição com espera crescente (3 vezes no CLI) só quando o job nem foi criado, porque job criado consome a reserva inteira por segurança de custo — C + L.
- Testes: `npm test` recusa banco cujo nome não termine em `_test`; testes limpam o que criam — C.

## Limites
- A paginação por chave e a repetição não foram executadas contra o BigQuery real (sem credencial neste ambiente); a consulta é conferida por testes de texto e parâmetros e a repetição com BigQuery simulado. A chave usa texto (`CAST ... AS STRING`) para funcionar com id numérico ou texto, e a ordem é lexicográfica.
- PostGIS ficou fora do escopo (ponto no polígono segue em memória).
