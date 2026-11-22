# SIURB — contratos e consultas verificadas

Verificação em 20/10/2026. Consultas HTTP reais e somente de leitura; nenhum cadastro foi importado no PostgreSQL nesta etapa. Evidência local integral em `.validation/territorial-execution/siurb-probe.json` e `siurb-terms.json` (arquivos de trabalho ignorados pelo Git). O probe reproduzível está em `backend/src/integrations/siurb/probe.ts`; comando: `npm run probe:siurb --prefix backend`.

Serviço: [Mapa Básico Híbrido 2024](https://pgeo3.rio.rj.gov.br/arcgis/rest/services/Basicos/Mapa_B%C3%A1sico_H%C3%ADbrido_2024/MapServer). Ano no nome do serviço não representa atualização dos cadastros.

| Camada | ID | Contagem / IDs únicos | OID | Geometria observada nas amostras |
| --- | --- | --- | --- | --- |
| Escolas municipais | 1 | 1.540 / 1.540 | `objectid` | Point |
| Saúde municipal | 2 | 344 / 344 | `objectid_1` | Point |
| Praças e espaços públicos | 16 | 2.387 / 2.387 | `objectid` | Polygon e MultiPolygon |
| Limites de bairros | 18 | 167 / 167 | `objectid` | Polygon e MultiPolygon |

Todas as camadas declararam paginação e GeoJSON. Foram consultados metadados, contagem, enumeração de IDs e cinco features por camada, com `outSR=4326`, seleção explícita de campos e ordenação por OID. Quantidades são do instante da consulta, incluem todo o cadastro e não comprovam que cada unidade esteja em funcionamento. Não foi validada uma extração integral de features nesta etapa.

## Identificadores e campos

- Escolas: `globalid`, nome, endereço, bairro/código, INEP, atividade e telefone; `flg_ativa` presente na fonte. A amostra inclui a Escola Municipal Rinaldo De Lamare e a Escola Municipal Rivadavia Corrêa.
- Saúde: `globalid`, CNES, nome, endereço, bairro, telefone, horários, tipo e atividade. Na amostra, diversos horários, tipos e indicadores de atividade são espaços vazios; devem permanecer não informados, sem inferir atendimento ou funcionamento.
- Praças: `globalid`, nome completo, endereço, bairro numérico e classificações. O Largo da Capela tem endereço ausente. Não classificar todo o cadastro como praça estrita: há largos e outras categorias.
- Bairros: `codbairro` textual com zeros à esquerda, `codbnum` numérico e nome. Exemplo observado: Paquetá, código `013` e número `13`.

Usar GlobalID normalizado como identidade externa de equipamentos quando presente e único no snapshot; preservar o valor original na procedência armazenada. Não assumir estabilidade do OID. Para bairros, usar código cadastral textual e registrar aliases comprovados da mesma fonte. Não foi estabelecida nesta etapa equivalência geral com os códigos do BigQuery; junções 1746 exigem validação adicional, sem associação por nome aproximado.

## Datas e condições de uso

Os metadados consultados não declararam `editingInfo.lastEditDate`; data de atualização e período de referência permanecem desconhecidos. Data de consulta/importação será armazenada separadamente.

O [item do serviço](https://pgeo3.rio.rj.gov.br/arcgis/rest/services/Basicos/Mapa_B%C3%A1sico_H%C3%ADbrido_2024/MapServer/info/iteminfo?f=json) declara **CC BY 4.0**, com atribuição ao Instituto Pereira Passos/PCRJ. Os [limites de bairros](https://pgeo3.rio.rj.gov.br/arcgis/rest/services/Basicos/Mapa_B%C3%A1sico_H%C3%ADbrido_2024/MapServer/18/iteminfo?f=json) também declaram CC BY 4.0. O [item de escolas](https://pgeo3.rio.rj.gov.br/arcgis/rest/services/Basicos/Mapa_B%C3%A1sico_H%C3%ADbrido_2024/MapServer/1/iteminfo?f=json) permite uso público com citação da fonte e preservação das informações originais. Os itens específicos de saúde e praças não acrescentam termos; aplica-se a declaração do serviço que os publica, registrando essa origem da classificação.

O catálogo identifica uso individual com base nesses metadados e mantém a URL da evidência. Preservar atributos e geometrias originais no armazenamento; normalização para busca, categorias decodificadas e ponto derivado de polígono são representações da aplicação, não alterações do cadastro oficial. A interface deve indicar a fonte e as transformações relevantes. Isso não estabelece vínculo institucional com o Fiscaliza Aí.

## Descoberta e limitações

A descoberta Orbit foi consultada e retornou candidatos de outros provedores, inadequados ao SIURB; não foram adotados nem importados. A autoridade para o contrato é o serviço oficial acima. A rede estava bloqueada no sandbox; as leituras oficiais foram realizadas com a permissão de rede concedida para os scripts de validação, sem credenciais e sem consultas Google faturadas.

Os dois testes de catálogo/probe passaram com transporte controlado, incluindo erro ArcGIS em HTTP 200 e ausência de data. Isso valida o tratamento do protocolo; as consultas reais acima validam o acesso às quatro camadas. Não há alegação de atualização operacional, extração completa ou inspeção de app nativo.

## Complemento da tarefa 5 — extração completa validada

Após implementar o importador, as quatro camadas foram extraídas, reconciliadas por IDs e publicadas integralmente no banco **isolado** `fiscaliza_territorial_utf8_preview_1020`: 167 bairros, 1.540 escolas, 344 unidades de saúde e 2.387 espaços públicos (4.271 equipamentos/espaços). Todos os runs terminaram com cobertura completa do cadastro consultado e zero rejeições. Isso não estabelece atualização operacional ou cobertura completa de serviços do município.

A camada de espaços contém **226 registros sem nome**, preservados como `NULL` no cadastro normalizado e intactos em `original_data`. Ausência de nome não torna uma geometria ou identidade cadastral inválida. A interface identificará essa ausência sem inventar um nome oficial.

A primeira tentativa no banco Windows herdado falhou com PostgreSQL `22P05`: WIN1252 não representa U+200B presente em nomes oficiais. Criamos bancos novos com UTF-8; os bancos anteriores foram mantidos. Nenhum dado do banco usado pelo aplicativo foi alterado, e nenhum caractere dos nomes foi removido para contornar o problema.

Foram aprovados 57 testes da API em PostgreSQL UTF-8, incluindo persistência de Unicode, migração aditiva de nome opcional, amostras reais, importação idempotente, contagens de atualização, exclusão lógica por snapshot, falhas no último lote, timeout, geometrias com buracos e vínculos de bairro conflitantes. Os logs de trabalho ficam em `.validation/territorial-execution/task5-*`; os comandos e fixtures versionados permitem reproduzir o comportamento.
