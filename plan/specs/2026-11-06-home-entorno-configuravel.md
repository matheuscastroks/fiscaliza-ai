# Home territorial e entorno configurável

Status: implementação autorizada em 06/11/2026; código e validações registrados nas [evidências](../evidence/2026-11-06-home-entorno-configuravel.md).

## Intenção e escopo

O usuário quer uma Home orientada aos chamados do 1746 perto de onde está e dos endereços que acompanha. Confirmou que o entorno deve ser configurável, pediu o plano e autorizou sua implementação. Esta especificação registra os padrões e detalhes adotados nessa autorização.

Sucesso: partir da Home, escolher um lugar e uma abrangência, entender os chamados encontrados, abrir o mapa ou lista com o mesmo recorte e salvar um chamado. A jornada continua pública e sem conta, conforme PRODUCT.md.

## Experiência proposta

### Entrada e localização

- Na primeira entrada na Home, apresentar “Veja os chamados próximos de você”, com “Usar minha localização”, “Escolher bairro” e “Agora não”. Somente a primeira ação solicita a permissão do sistema.
- Não abrir a permissão automaticamente no carregamento nem insistir após recusa. Registrar localmente que a apresentação foi vista; manter acesso posterior pelo seletor de lugar.
- Pedir localização apenas em primeiro plano e por ação explícita. Não criar rastreamento contínuo. A ação “Atualizar localização” solicita uma nova posição.
- Ao retornar à Home, preservar a seleção. Se a origem for localização atual, mostrar o horário da captura e permitir atualizá-la; após reiniciar o app, obter nova posição por ação explícita, sem apresentar coordenadas antigas como atuais.
- Permissão negada, GPS indisponível, demora ou localização fora do Rio oferecem escolha de bairro ou lugar salvo. Nunca substituir silenciosamente o local ativo.
- Mostrar a precisão informada pelo dispositivo. Quando ela exceder o raio selecionado, avisar que a posição é aproximada e permitir confirmar um ponto ou ampliar o raio.

### Local ativo e abrangência

- Topo: nome do lugar, bairro quando confirmado e controle de abrangência.
- Origens: localização atual, lugar salvo, bairro manual ou município inteiro como fallback.
- Raios propostos: 500 m, 1 km, 2 km e 5 km; padrão de 1 km para um novo lugar/localização.
- Cada lugar salvo conserva seu próprio raio; a localização atual conserva uma preferência de raio sem persistir suas coordenadas.
- “Bairro inteiro” é modo alternativo ao raio. Ele só fica disponível quando houver bairro confirmado ou escolhido manualmente.
- O raio pode atravessar bairros; o nome do bairro do centro é informativo e não vira filtro adicional.
- Distância é geográfica em linha reta, aproximada, não distância de caminhada.
- Não ampliar raio, trocar bairro ou relaxar filtros automaticamente quando não houver resultado.

### Home

Ordem: local e abrangência; filtros; chamados do recorte; “Estou acompanhando”; atendimento oficial.

- A lista principal apresenta até cinco chamados recentes, ordenados por abertura decrescente, com desempate pelo protocolo, como na API atual. “Recentes” não significa “mais próximos”.
- Mostrar categoria/problema, situação publicada, bairro, data de abertura e distância quando houver centro e coordenadas válidas. Não inventar rua: o contrato atual não traz endereço de logradouro do chamado.
- Ação principal “Explorar no mapa”, com alternativa “Ver lista”, preserva local, abrangência, categoria, situação, busca e período.
- Filtros iniciais: todas as categorias, situação “Não Encerrado” e todo o período disponível. Tornar a situação selecionada visível e permitir “Todas as situações”. Preservar ajustes durante a sessão ao navegar entre Home e Território.
- Períodos disponíveis: todo o período, 30 e 90 dias da base. Os atalhos mantêm a semântica atual de periodDays, ancorada na maior data de abertura disponível na base, e precisam explicitar essa referência. Não usar “últimos 30 dias” como se fosse relativo ao relógio atual. A referência temporal vem da API, não de inferência dos cinco itens.
- Mostrar atualização da fonte separadamente da data de abertura. Falha de metadados não elimina a lista; referência indisponível recebe rótulo textual.
- Substituir os carrosséis por categoria da Home por essa lista; categorias tornam-se filtros. Não criar dashboard ou ranking.
- Salvos continuam sendo interesse pessoal, sem serem filtrados pelo entorno ativo. Corrigir “Salvos na sua conta” para “Salvos neste aparelho”.

### Lugares salvos

- Gerenciar pelo seletor de lugar e por Preferências. Criar, editar, selecionar e excluir; confirmar exclusão.
- Campos: nome obrigatório (1–40 caracteres após trim), endereço/referência opcional (até 160), ponto obrigatório confirmado no mapa e raio. Casa e Trabalho são sugestões de nome, não endereços inferidos.
- Primeira versão: preencher endereço/referência e marcar o ponto no mapa, ou usar localização atual e confirmá-la. Explicar que digitar o endereço não posiciona o marcador. Não apresentar campo como busca automática de endereço.
- Oferecer alternativa acessível ao mapa: latitude e longitude com validação e ação de confirmar. É um caminho secundário; explorar por bairro permanece disponível sem coordenadas.
- Não há provedor de geocodificação contratado no fluxo atual. Autocomplete e conversão automática de endereço/CEP em ponto ficam fora desta entrega, não são simulados.
- Dados ficam no aparelho, sem sincronização. Usar chave por usuário anônimo/autenticado e município IBGE, sem misturar escopos.
- Salvar só confirma após AsyncStorage concluir. Falha conserva formulário e informa nova tentativa. Excluir o lugar ativo retorna ao bairro confirmado associado, ou ao município se não houver bairro, com mensagem explícita.
- Reabertura restaura lugar salvo/bairro selecionado. Seleção de localização atual restaura apenas o modo e o raio, aguardando nova captura para fazer consulta radial.

## Semântica e arquitetura

### Consulta por raio

Estender GET /api/rio1746/calls com centerLatitude, centerLongitude e radiusMeters. Os três são obrigatórios em conjunto; latitude/longitude finitas nos limites geográficos e raio em {500, 1000, 2000, 5000}. Entrada incompleta/inválida retorna 400. Ponto fora do polígono municipal retorna 422; polígono municipal indisponível retorna 503. O município continua sendo o Rio, IBGE 3304557; cliente não define município arbitrário.

O modo radial rejeita bairro/neighborhoodId e bbox simultâneos (400); filtros de tipo, situação, busca e período continuam combináveis. Usar bbox calculada no servidor como pré-filtro e distância esférica em SQL como filtro inclusivo (distância <= raio), antes de COUNT, ordenação e paginação. Não filtrar somente a página recebida no cliente. Não exigir PostGIS nesta entrega.

Usar raio terrestre de 6.371.000 m e Haversine com argumento limitado a [0,1], tanto no SQL quanto na apresentação. Sem coordenadas válidas, um chamado não participa da consulta radial. Consulta por bairro continua incluindo chamados sem ponto. Vazio informa “Nenhum chamado encontrado neste recorte da base” e oferece ampliar raio, alterar filtros, consultar bairro e atendimento oficial.

Preservar paginação por cursor e ordenação atuais. Centro, raio e demais filtros fazem parte do escopo do cursor; mudança de seleção inicia uma consulta nova. Resposta pública OfficialCall permanece compatível; distância exibida é calculada no cliente para cada item retornado, sem ordenar uma página por distância.

### Identificação de bairro

Criar GET /api/territory/resolve?latitude=...&longitude=..., público e somente leitura, para validar município e resolver bairro por ponto usando os polígonos publicados. Retorno: municipalityId, insideMunicipality e neighborhood (id/name ou null). Fora do município retorna insideMunicipality=false; bairro ausente ou ambíguo retorna null, sem escolher pelo nome aproximado. Polígono municipal indisponível retorna 503. Falta de limites de bairro não impede consulta por raio se município estiver validado.

Reutilizar containsPoint e a fonte territorial existente, sem buscar geocodificação em serviços externos. Centro validado não garante qualidade das coordenadas publicadas dos chamados. Nas fronteiras com múltiplos bairros possíveis, não atribuir bairro automaticamente.

### Estado e transporte

- Criar modelo discriminado de recorte compartilhado por Home e Território: município, bairro ou raio. Centro só existe em raio; bairro resolvido é metadado do centro.
- Separar preferências persistidas dos filtros transitórios e da captura de localização em memória. Atualização de escopo invalida respostas pendentes do escopo anterior.
- TanStack Query inclui escopo de usuário, município e recorte completo nas chaves das listas novas/alteradas. Não reutilizar resultados de raio diferente nem manter páginas anteriores ao trocar recorte.
- Derivar consultas em um único adaptador para evitar divergência entre Home, mapa e lista. O modo “área visível” do mapa é alternativo ao raio, com troca explícita; arrastar o mapa não muda o centro salvo.
- Camadas de equipamentos mantêm seus contratos atuais. O controle de raio é identificado como filtro de chamados 1746; não sugerir que equipamentos estão filtrados pelo círculo quando não estiverem.
- Não enviar nome Casa/Trabalho/endereço textual à API; somente ponto necessário à leitura. Não adicionar logs de coordenadas; revisar redaction dos novos parâmetros em observabilidade. Reutilizar configuração Mapbox existente, sem prometer ausência de comunicação com o provedor do mapa.

## UI, falhas e validação

Preservar Instrument Sans, tokens, tema escuro, alvos de 48, fonte ampliada e estados acessíveis. Usar controles nativos compatíveis com o Expo instalado após consulta às skills locais expo-ui e expo-native-ui. Consulta e lugares têm loading, erro recuperável, vazio e sucesso separados. Se uma atualização falhar, conservar dados do mesmo recorte; ao trocar recorte não rotular itens antigos como se pertencessem ao novo.

Testes devem cobrir limites do círculo versus cantos da bbox, paginação, ausência de coordenadas, entradas inválidas, ponto externo, fronteiras/ambiguidade de bairro, falhas de permissão/persistência, troca rápida de lugares/escopos e preservação do recorte na navegação. Testes web e dispositivo nativo são evidências separadas. Medições de consulta SQL são evidência de consulta, não de desempenho do app.

Fora do escopo: envio ao 1746, contas obrigatórias, sincronização de endereços, notificações/geofencing, localização em segundo plano, rotas de caminhada e ordenação por distância.
