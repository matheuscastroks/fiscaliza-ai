# Fontes de Dados Oficiais e Limites de Interpretação

Consolidação das fontes integradas ao Fiscaliza aí, seus contratos de acesso, licenciamento e restrições semânticas. Detalhes técnicos de inspeção constam em [rio1746-diagnostico.md](integracoes/rio1746-diagnostico.md), [back/src/integrations/siurb/README.md](../back/src/integrations/siurb/README.md) e [20-siurb-fontes.md](historico/evidencias/20-siurb-fontes.md).

## 1. Central 1746 / DATA.RIO (Google BigQuery)

- **Tabelas oficiais:** `datario.adm_central_atendimento_1746.chamado` e `datario.dados_mestres.bairro` (167 bairros).
- **Volumetria observada (diagnóstico de 20/10/2026):** ~20,26 milhões de registros históricos (desde `2010-06-01`), média de ~4.500 a 6.000 chamados/dia útil.
- **Cobertura geográfica observada:** na partição amostrada (`2026-09-20`, 870 registros), 57,4% (499) possuíam coordenadas válidas dentro do polígono do Rio de Janeiro e 42,6% (371) estavam sem coordenadas. Registros sem ponto permanecem acessíveis pela consulta por bairro.
- **Controle de custo e privacidade:**
  - Consultas filtradas por `data_particao` com orçamento compartilhado (`maximumBytesBilled` padrão de `500 MB`).
  - Omissão de `numero_logradouro` na exposição pública da API para preservar privacidade domiciliar; a tabela pública não contém PII direta (CPF, nome, telefone).
  - A sincronização diária relê partições recentes e revisita chamados abertos salvos ou seguidos por usuários.

## 2. Cadastros Territoriais SIURB / IPP (ArcGIS REST)

- **Serviço:** [Mapa Básico Híbrido 2024](https://pgeo3.rio.rj.gov.br/arcgis/rest/services/Basicos/Mapa_B%C3%A1sico_H%C3%ADbrido_2024/MapServer) (Instituto Pereira Passos / Prefeitura da Cidade do Rio de Janeiro).
- **Licença e atribuição:** **CC BY 4.0** (com atribuição ao Instituto Pereira Passos/PCRJ; item de escolas autoriza uso público com citação da fonte e preservação das informações originais).
- **Camadas e contagens verificadas (extração integral em banco UTF-8 isolado):**
  - Limites de bairros (`18`): 167 polígonos (`Polygon` / `MultiPolygon`).
  - Escolas municipais (`1`): 1.540 pontos.
  - Saúde municipal (`2`): 344 pontos.
  - Praças e espaços públicos (`16`): 2.387 polígonos (226 sem nome preservados como `NULL`, sem invenção de rótulo).
- **Requisitos técnicos:** banco PostgreSQL em codificação `UTF8` (nomes oficiais contêm caracteres Unicode como `U+200B`), publicação atômica por snapshot com preservação do `original_data` em GeoJSON e derivação de ponto interno apenas para marcador (sem indicar entrada ou endereço exato).

## 3. Limites Explícitos de Interpretação

1. **Encerramento administrativo não comprova resolução efetiva** do problema urbano no local.
2. **Ausência na base sincronizada não prova ausência no 1746:** o sincronizador mantém um recorte temporal recente e chamados acompanhados, não o histórico integral de ~20,2 milhões de registros.
3. **Quantidade de equipamentos não mede capacidade, qualidade ou funcionamento:** cadastros ausentes ou desatualizados na origem permanecem como publicados (`null` / não informado).
4. **Proximidade espacial não estabelece causalidade:** concentração de chamados próxima a uma escola ou unidade de saúde não implica responsabilidade da unidade.
5. **Independência institucional:** o Fiscaliza aí não representa a Prefeitura do Rio de Janeiro nem protocola demandas no 1746.
