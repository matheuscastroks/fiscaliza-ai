# Integração SIURB

`npm run probe:siurb --prefix backend` verifica metadados e cinco amostras de cada camada, sem banco. `npm run sync:siurb --prefix backend -- all` importa limites (18), escolas (1), saúde (2) e espaços públicos (16), nessa ordem. Para uma camada, substitua `all` pelo ID; equipamentos exigem limites já publicados.

Use `DATABASE_URL` explícita e migrações aplicadas. A sincronização é uma operação administrativa no servidor; o aplicativo nunca recebe URL upstream nem dispara a importação ao abrir uma tela. Não execute em banco pessoal para validar testes.

O banco deve usar **UTF-8**. Valide com `SHOW server_encoding`; uma instalação Windows pode herdar WIN1252, que não representa todos os caracteres presentes nos nomes oficiais. Para um banco novo, use `CREATE DATABASE nome WITH TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C'`. Bancos existentes exigem um procedimento próprio de backup/restauração; o importador não altera codificação ou remove caracteres dos cadastros.

O catálogo fixa URLs, campos, licenças e atribuições verificadas. Uma trava PostgreSQL por fonte impede execuções concorrentes da mesma camada. Respostas têm limite de 8 MB, timeout de 15 segundos, até 50.000 features/100 lotes e deadline de leitura de cinco minutos. OIDs enumerados e reconciliados ao final impedem publicar lotes incompletos. IDs estáveis usam GlobalID quando presente; OID de fallback permanece identificado como tal.

O staging fica em memória dentro desses limites; somente um snapshot validado é publicado em transação. Cadastros retirados deixam de pertencer ao snapshot atual, sem apagar os dados históricos. Erros, códigos/IDs inválidos e queda inesperada a zero mantêm a publicação anterior. Falhas ficam no journal com contagens e erro sanitizado; mensagens internas do provedor não são contratos públicos.

Preservamos o GeoJSON recebido em `original_data`. Marcadores derivados de polígonos usam ponto interno validado, sem representar entrada ou endereço exato. Ambiguidades de bairro, divisas e códigos conflitantes ficam sem vínculo, em vez de receber uma aproximação por nome. Campos vazios permanecem ausentes. Data de importação não substitui uma data de referência desconhecida.

Testes usam servidor HTTP local e PostgreSQL dedicado; há também uma amostra real por camada em `test/fixtures/siurb`, com proveniência. Consulte `plan/evidence/20-siurb-fontes.md` para as consultas reais. Aprovação dos testes não significa importação no banco do aplicativo ou validação nativa.
