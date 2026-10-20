# Fiscaliza Aí — Produto

## Posicionamento

Fiscaliza Aí ajuda moradores do Rio a descobrir o que está acontecendo no seu bairro, acompanhar a atuação da prefeitura e saber como agir para melhorar sua região.

**Regra de produto:** o Fiscaliza Aí utiliza dados públicos para tornar a fiscalização e a participação cidadã mais acessíveis. Cada funcionalidade deve ajudar o morador a descobrir, fiscalizar ou agir. A disponibilidade de um dataset, sozinha, não justifica uma funcionalidade.

O território organiza a experiência. Demandas do 1746 e equipamentos públicos dão contexto às necessidades dos moradores. A aplicação é independente, não representa a prefeitura e não encaminha contribuições ao 1746.

## Três pilares

- **Descobrir — o que acontece perto de mim?** Encontrar demandas publicadas e serviços do bairro no mapa, com alternativa em lista. Proximidade só é afirmada quando há localização suficiente.
- **Fiscalizar — o que a prefeitura publicou sobre o atendimento?** Consultar protocolo, situação, datas, prazo e desfecho quando disponíveis; salvar o chamado para voltar a ele. Encerramento administrativo não comprova resolução efetiva.
- **Agir — o que posso fazer depois?** Encontrar o canal oficial de atendimento, acompanhar um registro ou consultar um serviço público. Abrir um canal externo não significa enviar uma solicitação.

Exemplo orientador: diante de uma rua sem iluminação, o morador procura relatos próximos, consulta o andamento de um chamado existente e o salva. Se não encontrar um registro, consegue acessar o atendimento oficial. Ausência na base sincronizada não prova ausência de chamado no 1746.

## Jornada prioritária da próxima entrega

Esta seção define a direção do redesenho; não descreve telas já entregues.

1. **Home:** acesso principal à exploração territorial, retorno aos chamados salvos, demandas recentes do recorte e acesso ao atendimento oficial. Mostrar bairro ou município selecionado e referência temporal. Panorama numérico e comparações ficam no aprofundamento.
2. **Território:** mapa como ferramenta de descoberta, lista equivalente e camadas opcionais de serviços. Preservar o recorte ao abrir e fechar um item. Oferecer busca e caminho de recuperação quando não houver resultados.
3. **Detalhe do chamado:** priorizar problema, local, situação publicada, protocolo e datas; depois origem e limitações. Oferecer salvar/retirar dos salvos e acesso ao canal oficial, sem prometer integração de envio ou atualização em tempo real.
4. **Acompanhar:** facilitar o retorno aos registros que a pessoa escolheu salvar. Distinguir interesses pessoais da consulta geral aos chamados do município.

Equipamentos públicos servem à descoberta de serviços: endereço, contato e horário apenas quando publicados. Gráficos respondem a perguntas específicas em uma camada de aprofundamento. Novos dashboards e integrações ficam fora da prioridade deste redesenho.

## Capacidades atuais e limites de participação

Já existem consulta de chamados, salvamento, mapa/lista multicamadas, fichas de equipamentos e panorama de bairro. A Home ainda dá destaque ao panorama numérico; sua hierarquia precisa ser revista conforme a jornada acima.

Não existe integração de abertura de solicitações no 1746. Propostas, mobilizações e outras contribuições comunitárias são uma frente futura a validar; sua existência em módulos legados não comprova uma jornada atual disponível. Interações internas nunca representam decisões ou respostas oficiais.

## Critérios de aceitação de produto

- Uma pessoa consegue sair da Home, encontrar um chamado, entender seu estado e salvá-lo sem interpretar gráficos.
- Quando não encontra um registro, há um próximo passo para o canal oficial; a interface não afirma que nenhum chamado existe.
- Situação, prazo, período dos dados e atualização são apresentados sem inventar informação ausente.
- Cada tela oferece uma tarefa identificável e uma continuação útil, com estados de carregamento, erro e vazio recuperáveis.
- Validar essas jornadas no cidadão web e no Expo Go; build e testes automatizados não substituem a avaliação de uso.

## Fontes e responsabilidades

SIURB/IPP: escolas (1), saúde (2), espaços públicos (16) e limites de bairros (18). Central 1746/DATA.RIO: demandas via BigQuery. A evidência de uso e atribuição está em plan/evidence/20-siurb-fontes.md.

O backend importa e valida; PostgreSQL conserva cadastros e proveniência; Fastify serve contratos públicos; Expo apresenta as evidências em Android/iOS/web. O cliente não consulta os provedores de importação diretamente. O mapa utiliza tiles OpenStreetMap e Leaflet.

Importações administrativas são limitadas, auditadas e protegidas por trava por fonte. Publicações cadastrais são atômicas; falhas preservam a versão anterior. Builds e abertura de telas não sincronizam dados.

## Limites do significado

Quantidade de equipamentos não mede vagas, capacidade, funcionamento ou qualidade. Ponto derivado de polígono não indica entrada. Bairro ambíguo continua sem vínculo. Muitos chamados próximos a uma escola não estabelecem causalidade ou responsabilidade. Extração completa de um cadastro não confirma atualização na origem nem cobertura histórica contínua do 1746.

Não completar campos ausentes com nomes, horários, imagens ou indicadores inventados. Nenhuma foto genérica representa uma unidade real.

## Continuidade

IPS, obras, orçamento, transporte em tempo real, meteorologia e explicações por IA dependem de contratos, uso permitido e cobertura verificáveis. Não são capacidades desta entrega. Preservar navegação, identidade visual, acessibilidade e distinção entre leitura pública e participação autenticada.
