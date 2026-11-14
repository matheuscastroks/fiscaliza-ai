# Proposta: resultados de chamados sem rolagem infinita

Revisão solicitada pelo usuário em 13/11/2026, feita por subagente em leitura. Proposta ainda não implementada.

## Diagnóstico

A API limita cada página a 50 registros por cursor. O drawer chama fetchNextPage em onEndReached e concatena páginas, permitindo milhares de linhas. A busca e os filtros não aparecem dentro do drawer; estão atrás do backdrop. O card de um ponto do mapa já oferece uma prévia individual adequada.

## Direção recomendada

- Preservar a prévia individual ao tocar no mapa.
- Ver em lista abre uma tela própria em /calls/index, com área, busca e filtros visíveis.
- Mostrar 25 itens por página; Anterior e Próxima substituem os itens, sem carregamento por rolagem.
- Exibir intervalo e total; manter histórico de cursores para voltar, sem offset arbitrário.
- Resultado abre /calls/[id]; No mapa volta à mesma prévia com o chamado selecionado.
- Voltar do detalhe preserva página, filtros e posição; mudar consulta volta à primeira página.
- Oferecer escolher bairro, filtrar e buscar protocolo em consultas grandes, sem bloquear resultados.
- Área visível continua uma escolha explícita; chamados sem coordenadas continuam acessíveis.
- Agregados completos do mapa independem da página da lista.

Não reutilizar ResultsScreen.tsx, que é Dados do bairro. Não substituir milhares de linhas por um carrossel de milhares de cards.

## Implementação e aceitação

Arquivos principais: TerritoryScreen, TerritoryListView, useTerritoryQueries, useOfficialCalls, useTerritoryView e nova rota calls/index. Atualizar PRODUCT.md e front/DESIGN.md que hoje prescrevem bottom sheet. Corrigir contagem de sem local para usar o total da consulta, não só páginas carregadas.

Aceitação: rolar não busca páginas; no máximo 25 registros na página; filtros acessíveis; falha da próxima página preserva a atual; voltar restaura contexto; sem coordenadas continuam acessíveis; paginação não altera totais do mapa. Validar no S22 além dos testes de comportamento.
