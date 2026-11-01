# Paginação, índices de busca e cache de navegação

Data: 20/10/2026. Base: auditoria de desempenho e commits `fefaa0c`/`da19ae6`.

## Mudanças

- Território carrega 50 chamados por página e acrescenta a continuação. Não baixa novamente as páginas anteriores ao carregar mais.
- Cursor por data e protocolo, preservando os microssegundos do PostgreSQL. Vinculado aos filtros; valores incompatíveis ou inválidos retornam 400. A API mantém suporte a `page`.
- Total calculado na primeira página; continuações usam uma linha adicional para descobrir `hasMore`, sem COUNT. O cliente conserva o total inicial e elimina IDs repetidos.
- Índice GIN multicoluna para as seis alternativas ILIKE e B-tree composto para município/data/protocolo. Busca textual mantém os campos e a semântica existentes.
- Home respeita cache de 30 segundos no foco. Território alterna `enabled` com o foco e consulta novamente se o cache venceu. Atualização manual permanece disponível. Atualizar uma camada de equipamentos não dispara a consulta de chamados desativada.

## Medição isolada

Cópia somente dos 27.811 chamados públicos para um banco UTF-8 separado. Migrações anteriores, importação, ANALYZE, EXPLAIN ANALYZE antes; migração 0012, ANALYZE e EXPLAIN depois. Nenhuma escrita no banco de origem durante esse benchmark.

| Consulta | Antes / OFFSET | Depois / cursor |
| --- | ---: | ---: |
| COUNT da busca `ilumina`, seis campos | 189,146 ms | 16,204 ms |
| Página após 25.001 registros | 66,507 ms | 0,414 ms |

Construção dos índices: aproximadamente 3,16 s nessa cópia. São observações únicas, sem teste de carga ou distribuição P95. Não demonstram FPS ou latência no celular.

## Verificação

- Backend completo: 61/61, sem skips, banco novo e senha exclusiva de testes. A primeira tentativa reutilizou um banco com contas anteriores e falhou por configuração de credenciais; foi substituída por essa execução isolada.
- Cursor após a validação adicional de calendário: 2/2.
- App: 74/74, incluindo teste com QueryClient real de cache fresco, invalidação, filtros distintos e tela desativada.
- TypeScript app/backend, lint dos arquivos alterados e exportação web: passaram.
- Chrome com API real isolada, largura 390 px: primeira página 50, continuação 50, 100 IDs distintos, `total=null` na continuação. Voltar do detalhe não repetiu a consulta; posição da lista 700 → 674 px, sem erros JavaScript.
- Revisão independente somente leitura: sem problemas importantes; validação de datas inexistentes reforçada e retestada.
- API Docker local recompilada e atualizada após backup: health 200, migração 0012 registrada, busca `ilumina` com 2.034 resultados e duas páginas de 50 IDs distintos. Comparação antes/depois preservou hashes de usuários e registros, 27 contas, 27.811 chamados, 4.271 equipamentos e 167 limites territoriais.

Artefatos locais ignorados: `.validation/filter-performance/index-benchmark.json`, `pagination-browser.json`, `backend-performance-clean.log`, `root-performance-tests.log`. Backup privado antes da atualização da API: `before-search-index.dump` (5.292.640 bytes). Não versionar esses dados.

## Limites e continuidade

DTOs compactos, cache de servidor com revisão de publicação e simplificação das agregações de bairro permanecem nas próximas entregas. O Android/Expo Go ainda precisa de medição durante interação real. A migração transacional pode bloquear escritas em bases maiores; não extrapolar os 3,16 s para produção.
