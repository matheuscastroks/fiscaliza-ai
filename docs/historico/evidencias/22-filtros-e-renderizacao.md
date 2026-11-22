# Filtros e renderização — correção

Data: 20/10/2026. Base: 5ee07dd. Relato: travamentos ao filtrar na Home e Território, pelo Expo Go Android conectado por USB.

## Causas reproduzidas

As abas retidas continuavam observando os filtros globais. Após visitar Território, escolher Centro na Home disparava quatro consultas do 1746: resumo e 15 chamados da Home, mais resumo e 300 chamados da aba oculta. Seu iframe permanecia montado. Reprodução Chrome com API e banco isolados, sem escrita no banco do app.

A função real de atualização do mapa removia a camada inteira a cada atualização, inclusive ao selecionar um marcador ou receber os mesmos dados. Testes executam essa função extraída do componente com um adaptador Leaflet controlado: duas atualizações de 300 registros criavam 600 marcadores.

A busca usava cada tecla como chave de consulta; os transportes não recebiam o sinal de cancelamento do React Query. A lista renderizava todos os cards em ScrollView, com o mapa ativo ao fundo.

## Correções

Consultas de Home/Território respeitam foco da aba. Território não mantém sua UI e mapa ativos quando está oculto; o mapa também sai da árvore no modo Lista. Foi removido o resumo territorial usado apenas para reordenar opções de serviço; todas as opções continuam disponíveis no filtro.

O mapa atualiza marcadores por ID, preservando instâncias e alterando somente posição, ícone e rótulo necessários. Inclusões são divididas em lotes de até 50, com intervalo entre lotes; filtros novos removem inclusões pendentes obsoletas. Nomes continuam como texto e a serialização permanece protegida.

A busca textual aguarda 300 ms sem digitação. Filtros de seleção continuam imediatos. HTTP recebe o sinal de cancelamento; mudanças de consulta podem interromper solicitações abandonadas sem apresentar cancelamento como falha de conexão. Cache e isolamento territorial existentes são preservados. Nenhuma dependência nova.

FlatList virtualiza as linhas; o recorte de registros localizados é memoizado. Registros sem ponto continuam na lista, sem duplicação no rodapé.

## Evidências

- Mesmo cenário da Home: quatro consultas viraram duas (somente resumo e 15 chamados da Home); iframe oculto deixou de existir. Isso mede trabalho eliminado, não latência da API.
- Dez caracteres digitados em intervalos de 40 ms resultaram em uma única consulta com a busca completa, após a pausa.
- Com 300 registros controlados, o navegador montou 13 cards na janela observada. Mapa/Lista retornaram sem erros de execução; mapa desmontado atrás da lista.
- Selecionar um marcador entre 300 não recria os demais. Trocar um ID remove um e cria um; atualizações idênticas não alteram ícones ou conteúdo do cluster. Teste também cobre descarte de inclusões pendentes após novo filtro.
- Regressões web aprovadas: paginação 100→200, falha isolada em saúde, resposta atrasada entre bairros, bairro inexistente e datas explícitas na consulta de chamados.
- npm test: 63 testes aprovados (38 puros e 25 compatibilidade/regressão), sem skips. Tipos, lint e exportação Expo web aprovados. Backend/contratos HTTP não foram alterados.

Testes novos: scripts/map-updates.test.cjs, scripts/search-debounce.test.cjs e scripts/http-cancellation.test.cjs. Observaram a falha antes da correção. Logs e capturas em .validation/filter-performance, ignorados no Git.

## Limite nativo

ADB identificou o aparelho e o processo Expo Go. A amostra inicial do processo registrou 217 frames, sete classificados como janky e percentil 99 de 200 ms, sem uma sequência de filtros controlada. Não é comparação de desempenho antes/depois. Na tentativa posterior, o Expo Go não estava em primeiro plano; a inspeção não capturou nem operou outro aplicativo.

A fluidez da sequência de filtros no aparelho após a correção ainda precisa ser confirmada com o Fiscaliza em primeiro plano. Não há alegação de FPS ou percentual de melhora nativa baseada nos testes web.
