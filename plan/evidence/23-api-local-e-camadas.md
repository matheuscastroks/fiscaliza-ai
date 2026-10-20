# API local e camadas territoriais

Data: 20/10/2026. O celular utiliza a API Docker na porta 3001; a API isolada de validação utiliza a porta 3003.

## Falha confirmada

As rotas /api/data-sources e /api/public-facilities retornavam 401 no serviço antigo da porta 3001, enquanto a versão atualizada de validação respondia 200. A imagem Docker em execução não continha a entrega territorial. O banco operacional era UTF-8 e seu journal terminava em 0006_official_calls.sql.

O Metro não recompila esse container. O serviço correto foi identificado pelas portas publicadas do Docker, sem substituir a configuração do celular por uma API de validação.

## Atualização realizada

Backup pg_dump em formato custom salvo em .validation/filter-performance/local-api-before-territorial.dump (1.231.631 bytes, privado e ignorado no Git). Somente o serviço api foi reconstruído e recriado, preservando configuração existente e volumes. PostgreSQL e os outros containers não foram recriados.

A inicialização aplicou migrações aditivas até 0011. Contagens e hashes das contas e registros foram comparados antes/depois: preservação confirmada. Permanecem 27 contas, zero registros comunitários e 27.811 chamados 1746; nenhum chamado foi apagado ou substituído.

Após a atualização, pelo endereço de rede configurado no celular, school, health e square responderam HTTP200 sem login. O total é null e a fonte unavailable porque os cadastros ainda não foram publicados nesse banco. Isso representa ausência de importação, não falha HTTP nem zero equipamentos no município.

## Publicação dos cadastros

O comando preparado é a CLI do próprio container: docker exec fiscaliza-ai-api-1 node dist/backend/src/siurb-cli.js all. Ela publica limites de bairros antes de escolas, saúde e espaços públicos, com validação e recuperação já testadas.

A revisão automática rejeitou essa importação por considerá-la mutação material no banco operacional fora da validação isolada anterior. Foi solicitada autorização explícita ao usuário. Nenhuma importação operacional foi executada enquanto essa aprovação permanece pendente. Os dados reais continuam disponíveis no banco isolado descrito na evidência 21.
