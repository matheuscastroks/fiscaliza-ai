# Fiscaliza Aí — Produto

## Posicionamento

Uma plataforma independente de inteligência urbana e participação cidadã que transforma dados públicos do Rio em informações acessíveis, territorializadas e úteis para entender, acompanhar e participar da vida da cidade.

O território organiza a experiência. O 1746 é uma camada de demandas, ao lado dos cadastros de equipamentos públicos. A aplicação não representa a prefeitura e não encaminha contribuições ao 1746.

## Experiências desta entrega

- **Conhecer o bairro:** escolher um bairro canônico do Rio (IBGE 3304557), consultar escolas, saúde e espaços públicos, e examinar demandas em datas explícitas.
- **Explorar:** combinar camadas no mapa com agrupamento ou em lista; buscar no território e abrir fichas de equipamentos com endereço, contato, horário e origem quando disponíveis.
- **Entender as evidências:** distinguir período solicitado, extensão disponível, última importação e data de referência. Ausência de publicação é desconhecimento, nunca zero.
- **Participar e acompanhar:** preservar os espaços comunitários e chamados salvos, distinguindo contribuições internas, dados oficiais e decisões municipais. Nenhuma nova integração operacional de atendimento foi entregue neste ciclo.

## Fontes e responsabilidades

SIURB/IPP: escolas (1), saúde (2), espaços públicos (16) e limites de bairros (18). Central 1746/DATA.RIO: demandas via BigQuery. A evidência de uso e atribuição está em plan/evidence/20-siurb-fontes.md.

O backend importa e valida; PostgreSQL conserva cadastros e proveniência; Fastify serve contratos públicos; Expo apresenta as evidências em Android/iOS/web. O cliente não consulta os provedores de importação diretamente. O mapa utiliza tiles OpenStreetMap e Leaflet.

Importações administrativas são limitadas, auditadas e protegidas por trava por fonte. Publicações cadastrais são atômicas; falhas preservam a versão anterior. Builds e abertura de telas não sincronizam dados.

## Limites do significado

Quantidade de equipamentos não mede vagas, capacidade, funcionamento ou qualidade. Ponto derivado de polígono não indica entrada. Bairro ambíguo continua sem vínculo. Muitos chamados próximos a uma escola não estabelecem causalidade ou responsabilidade. Extração completa de um cadastro não confirma atualização na origem nem cobertura histórica contínua do 1746.

Não completar campos ausentes com nomes, horários, imagens ou indicadores inventados. Nenhuma foto genérica representa uma unidade real.

## Continuidade

IPS, obras, orçamento, transporte em tempo real, meteorologia e explicações por IA dependem de contratos, uso permitido e cobertura verificáveis. Não são capacidades desta entrega. Preservar navegação, identidade visual, acessibilidade e distinção entre leitura pública e participação autenticada.
