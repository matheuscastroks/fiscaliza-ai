# Inteligência territorial — primeira entrega

Data: 20/10/2026. Base inspecionada: `3dd8a10`, branch `main` limpa.
Estado: direção de produto aprovada na conversa; especificação técnica para revisão. Nenhuma integração nova foi implementada nesta etapa.

## Resultado esperado

O cidadão escolhe um bairro do Rio, encontra escolas, unidades de saúde e praças no mapa, consulta seus detalhes e entende quais demandas do 1746 estão presentes na base disponível para aquele território. Cada resultado informa origem, período e cobertura conhecida.

O Fiscaliza Aí é uma plataforma independente de inteligência urbana e participação cidadã. O território organiza a experiência; o 1746 é uma das fontes. A jornada é pergunta → evidências → exploração territorial → acompanhamento ou participação.

## Recorte e escolhas

Adotar importação pelo backend para PostgreSQL, reutilizando Fastify e Expo. Consumir ArcGIS diretamente no aplicativo reduziria o trabalho inicial, mas espalharia tratamento de indisponibilidade, normalização e proveniência pelos clientes. Um catálogo genérico de todos os datasets ampliaria demais o escopo. A entrega terá quatro camadas e adaptadores específicos.

Preservar a identidade visual e a navegação existentes. Evoluir o mapa e acrescentar uma página de bairro antes de reorganizar todas as abas. Não implementar neste ciclo IPS, obras, transporte em tempo real, meteorologia, notificações de risco ou respostas por IA. Registrar essas frentes como continuidade, condicionadas à validação de fontes.

Propostas e discussões comunitárias continuam distintas de consultas oficiais e decisões municipais. Proximidade geográfica não estabelece causalidade, responsabilidade, área de atendimento ou qualidade de serviço.

## Diagnóstico confirmado no código

- `backend/src/seed.ts` já não apaga registros. Ainda atualiza nome, e-mail e município da conta de exemplo; testar preservação de contas alteradas e dados existentes antes de reutilizar em instalação ocupada.
- `backend/src/clean-demo.ts` é uma limpeza explícita separada. Não executar sobre o banco do usuário durante esta entrega.
- `backend/src/official-calls.ts` já exige administrador para sincronizar. Validar respostas de acesso e concorrência em testes; não presumir ausência de proteção.
- `integrations/rio1746/importer.ts` limita faturamento a 500 MB por consulta de página. Isso não é orçamento total da execução. O checkpoint registra `success` mesmo quando `maxRecords` interrompe a importação; distinguir cobertura parcial de completa.
- `integrations/rio1746/sync.ts` permite intervalos com várias partições. Definir orçamento de execução e exclusão mútua compartilhada entre API e CLI antes de ampliar sincronizações.
- `.github/workflows/release.yml` chama `validate.yml` na `main`. A validação já inclui tipos do app e build/testes do backend. Ler YAML não comprova execução remota bem-sucedida.
- `PRODUCT.md` ainda organiza o produto principalmente em torno do 1746. Atualizá-lo com a direção aprovada na implementação.

## Fontes e evidências externas

Metadados públicos consultados em 20/10/2026, sem importação ou consulta faturada ao BigQuery:

- [Escolas municipais, camada 1](https://pgeo3.rio.rj.gov.br/arcgis/rest/services/Basicos/Mapa_B%C3%A1sico_H%C3%ADbrido_2024/MapServer/1?f=pjson): geometria pontual; nome, endereço, bairro, INEP e domínios cadastrais.
- [Saúde municipal, camada 2](https://pgeo3.rio.rj.gov.br/arcgis/rest/services/Basicos/Mapa_B%C3%A1sico_H%C3%ADbrido_2024/MapServer/2): geometria pontual; CNES, nome, endereço, telefone, horários e atividade. O campo OID anunciado é `objectid_1`, não `objectid`.
- [Praças, camada 16](https://pgeo3.rio.rj.gov.br/arcgis/rest/services/Basicos/Mapa_B%C3%A1sico_H%C3%ADbrido_2024/MapServer/16): polígonos, classificação de espaços e bairro numérico. Não tratar como pontos nem presumir que o código de bairro seja equivalente ao do BigQuery.
- [Bairros, camada 18](https://pgeo3.rio.rj.gov.br/arcgis/rest/services/Basicos/Mapa_B%C3%A1sico_H%C3%ADbrido_2024/MapServer/18?f=pjson): delimitação territorial para normalização e exploração.

Saúde e praças anunciam GeoJSON, paginação e até 2.000 registros por resposta. Os metadados utilizam referência espacial 31983. Solicitar saída em WGS84 (`outSR=4326`) e validar coordenadas; não reinterpretar metros como latitude/longitude.

A consulta de metadados não comprova atualidade, licença de redistribuição, estabilidade de identificadores ou integridade de uma extração. O nome “2024” do serviço também não comprova a data de cada cadastro. Esses pontos são critérios da validação inicial, não fatos assumidos.

## Modelo e proveniência

- Manter `official_calls` exclusivamente para a Central 1746.
- Criar `data_sources`: identificador estável, provedor, URL oficial, camada, atribuição, evidência de condições de uso, restrição individual/agregada/desconhecida, data de referência e atualização declarada quando disponíveis.
- Criar `source_sync_runs`: origem, início/fim, estado, contagens recebidas/válidas/rejeitadas, completude, erro sanitizado e versão do mapeamento. A data da última tentativa não substitui a última publicação bem-sucedida.
- Criar `public_facilities`: origem + ID externo único, categoria, nome, endereço, contatos públicos permitidos, situação cadastral, bairro canônico ou vínculo não resolvido, geometria e ponto de exibição derivado quando necessário. Não exigir imagem nem fabricar descrição, horários ou serviços ausentes.
- Criar `territorial_boundaries`: identificador canônico, município IBGE, origem, código externo, nome e geometria Polygon/MultiPolygon. Manter correspondências explícitas para os códigos das diferentes fontes; não unir somente por texto aproximado.
- Indicadores sociais e obras terão domínios próprios em outra entrega; não criar tabelas vazias agora.

Usar JSONB para geometrias nesta primeira escala, com validação e índices nos filtros realmente usados. Não introduzir PostGIS sem necessidade demonstrada. Preservar polígonos originais; usar ponto interno validado para selecionar praças no mapa, sem prometer distância exata até a entrada.

## Importação e recuperação

Endpoints upstream fixos e permitidos no servidor. Sem URL arbitrária recebida do cliente. Consultas com lista explícita de campos, timeout, limite de páginas/registros, ordenação pelo OID declarado e tratamento de erros ArcGIS mesmo em HTTP 200.

Validar primeiro metadados, contagem, amostras, domínios codificados, paginação, geometrias e condições de consumo. Preferir enumeração de IDs e lotes delimitados quando a camada permitir; reconciliar quantidade e unicidade para detectar extração incompleta.

Publicar por camada somente após validar o lote completo, usando staging/transação. Falha ou contagem inesperada preserva a versão anterior. Reexecuções fazem upsert idempotente; desaparecimento de registro na origem só o torna ausente após snapshot completo confirmado. Não apagar chamados, propostas ou dados pessoais.

Sincronizações devem ser administrativas, auditáveis e mutuamente exclusivas por fonte no banco, incluindo API e CLI. O app consulta apenas a API local. Nenhuma sincronização pública implícita ao abrir a Home.

## Contratos propostos

Evoluir `shared/contracts.ts` e `backend/src/openapi.ts`; respostas seguem o envelope já existente.

- `GET /api/data-sources`: proveniência pública, cobertura e última publicação válida; sem segredos, caminhos locais ou erros internos.
- `GET /api/public-facilities`: categoria, bairro canônico, área visível, busca e paginação delimitada; total e cobertura explícitos.
- `GET /api/public-facilities/:id`: cadastro, geometria e proveniência; campos ausentes permanecem ausentes.
- `GET /api/territorial-boundaries`: bairros canônicos; geometria carregada separadamente por bairro para evitar payload municipal inteiro.
- `GET /api/neighborhoods/:id/overview`: equipamentos por categoria e resumo 1746 com intervalo solicitado, intervalo efetivamente disponível e completude. Não apresentar comparação de bairros ou tendência sem cobertura comparável.

Leituras territoriais podem ser públicas como as leituras 1746 atuais. Toda mutação mantém autenticação, autorização e município. Filtros inválidos retornam 400; vazio válido retorna 200; fonte indisponível nunca vira contagem zero de equipamentos.

## Experiência

Evoluir `app/(tabs)/TerritoryScreen.tsx` e os componentes de mapa existentes. Seletor compacto permite combinar chamados, escolas, saúde e praças; bairros aparecem como delimitação selecionável. Aplicar bairro e área visível a todas as camadas compatíveis. Filtros de situação/período do 1746 não devem esconder equipamentos cadastrais.

Equipamentos usam símbolos por categoria; chamados preservam sua linguagem atual. Mapa e lista compartilham seleção e filtros, carregamento, erro recuperável e estado vazio. Mostrar quando os pontos exibidos são apenas parte do resultado, evitando falsa impressão de cobertura integral.

Detalhes de equipamento abrem no padrão de drawer existente, com nome, tipo, endereço, contatos e proveniência. Não reutilizar botões de apoiar, resolver ou avaliar atendimento em um cadastro de escola/saúde. Sem fotos genéricas que sugiram retratar a unidade real.

Nova página de bairro reúne delimitação, equipamentos, tipos de chamados e acesso à exploração filtrada. Informar o período junto às métricas e oferecer acesso aos registros que as compõem. Lacunas cadastrais não significam ausência de serviços; volume de chamados não mede sozinho qualidade de vida.

## Ordem e critérios de aceite

1. Regressões da fundação: seed preserva dados; sincronização nega acesso indevido, impede execução concorrente e distingue parcial/completa; orçamento agregado delimitado. CI reproduzível sem credenciais Google ou chamadas faturadas.
2. Contratos upstream: salvar exemplos mínimos e evidências de consultas reais das quatro camadas, data, campos, IDs, contagem, formatos e limitações. Esclarecer condições de uso antes de publicar cadastros individuais.
3. Persistência/API: migrações aditivas, importação idempotente, metadados, contratos públicos e recuperação sem perda. Testes com servidor HTTP de fonte controlada cobrem erro ArcGIS 200, timeout, paginação, códigos divergentes e geometria inválida.
4. Mapa/detalhes: múltiplas camadas, bairro coerente, paginação, proveniência e comportamento em falha; preservar busca, clustering e fluxos existentes.
5. Página do bairro: resumo reproduzível com mesmos filtros da lista, período e cobertura visíveis; links levam às evidências corretas. Atualizar produto, documentação e onboarding para explicar o escopo entregue.

Commits por responsabilidade, seguindo `fix`, `feat` e `docs`, sem prefixo de ferramenta. Validar tipos, testes apropriados e lint; executar build/export web e inspeção responsiva. Registrar separadamente evidências locais, upstream, CI remoto e dispositivo Expo Go. Não alegar validação nativa baseada em exportação.

## Continuidade

Após essa entrega: validar importação do IPS com ano e metodologia; investigar registros estruturados de obras; só depois avaliar mobilidade e medições meteorológicas. A IA futura consultará contratos delimitados e citará origem, período e limitações; não executará SQL livre nem inferirá causalidade entre bases.
