# API local e camadas territoriais

Data: 20/10/2026. O celular utiliza a API Docker na porta 3001; a API isolada de validação utiliza a porta 3003.

## Falha confirmada

As rotas /api/data-sources e /api/public-facilities retornavam 401 no serviço antigo da porta 3001, enquanto a versão atualizada de validação respondia 200. A imagem Docker em execução não continha a entrega territorial. O banco operacional era UTF-8 e seu journal terminava em 0006_official_calls.sql.

O Metro não recompila esse container. O serviço correto foi identificado pelas portas publicadas do Docker, sem substituir a configuração do celular por uma API de validação.

## Atualização realizada

Backup pg_dump em formato custom salvo em .validation/filter-performance/local-api-before-territorial.dump (1.231.631 bytes, privado e ignorado no Git). Somente o serviço api foi reconstruído e recriado, preservando configuração existente e volumes. PostgreSQL e os outros containers não foram recriados.

A inicialização aplicou migrações aditivas até 0011. Contagens e hashes das contas e registros foram comparados antes/depois: preservação confirmada. Permanecem 27 contas, zero registros comunitários e 27.811 chamados 1746; nenhum chamado foi apagado ou substituído.

Após a atualização, pelo endereço de rede configurado no celular, school, health e square responderam HTTP 200 sem login. Antes da importação, o total era null e a fonte unavailable: ausência de publicação nesse banco, não zero equipamentos no município.

## Publicação dos cadastros

Foi executada a CLI do próprio container: `docker exec fiscaliza-ai-api-1 node dist/backend/src/siurb-cli.js all`. Ela publicou limites de bairros antes de escolas, saúde e espaços públicos.

A importação operacional começou somente após autorização explícita do usuário: “Sim, importar no banco atual”. As quatro execuções terminaram com sucesso e cobertura completa, sem registros rejeitados:

| Camada | Registros publicados |
| --- | ---: |
| Bairros | 167 |
| Escolas | 1.540 |
| Saúde | 344 |
| Espaços públicos | 2.387 |

## Verificação após a importação

Pela API `192.168.1.38:3001` configurada no celular, as três categorias responderam HTTP 200 com os totais acima e fontes available. `/api/territorial-boundaries` retornou 167 bairros; `/api/data-sources` confirmou as quatro fontes SIURB com coverage complete. O panorama do Centro respondeu HTTP 200 com 11 escolas, sete unidades de saúde e 61 espaços públicos.

A comparação de contagens e hashes das contas e registros continuou idêntica ao backup anterior: 27 contas, zero registros comunitários e 27.811 chamados 1746 preservados. O log integral da importação está em `.validation/filter-performance/local-siurb-import.log`, ignorado no Git. A data da importação não representa a data de atualização dos cadastros oficiais.

Estas verificações comprovam publicação e acesso HTTP pelo endereço usado no dispositivo; não substituem inspeção visual nem medição de fluidez no Expo Go.
