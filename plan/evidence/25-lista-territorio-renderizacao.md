# Renderização da lista de Explorar

Data: 20/10/2026. Correção local, sem commit ou push.

## Diagnóstico

O usuário confirmou que os avisos VirtualizedList aparecem em Explorar/Território. Na versão instalada, `node_modules/@react-native/virtualized-lists/Lists/VirtualizedList.js:1717` calcula `dt` pela diferença entre timestamps de eventos de rolagem. O aviso combina dois intervalos maiores que 500 ms com conteúdo maior que cinco vezes a área visível. Esses valores não representam, isoladamente, duração de renderização de um card ou FPS.

A tela já memorizava seus dados, mas recriava `renderItem`, `openEntry` e as linhas a cada renderização do pai. Mudanças sem alteração dos registros podiam reconstruir cards de demandas e equipamentos. Não foi estabelecido que isso explica todos os avisos nativos relatados.

## Correção

`TerritoryListRow` memoriza a linha pela identidade do modelo, tipo e ação de abertura. Reconstruir o objeto intermediário de uma camada não invalida cards cujo modelo permaneceu igual. `renderItem`, abertura de detalhes e extração de chaves ficaram estáveis. Conteúdo novo e ações novas continuam invalidando a linha; atualizações de tema nos descendentes continuam funcionando.

Nenhuma alteração em Acompanhar, desenho dos cards, altura de texto, virtualização ou API foi feita para esta correção. As alterações anteriores da jornada sem login permanecem no checkout.

## Medição controlada de React

Harness local com React e ReactDOM instalados, dez linhas e dez atualizações externas sem alteração dos modelos. O baseline usa o corpo do renderizador anterior, extraído antes da mudança; o teste novo executa `TerritoryListRow`. As folhas dos cards são contadores instrumentados. Não utiliza renderizador nativo nem o compilador Metro.

- Baseline: 10 renderizações iniciais e 100 renderizações adicionais, total 110.
- Correção: 10 renderizações iniciais e nenhuma adicional nesse mesmo cenário.
- Alterar um modelo renderiza somente sua linha.
- Trocar a ação de abertura não mantém callback antigo; mudança de tema chega aos descendentes.

Resultados: `.validation/filter-performance/list-render-baseline.json` e `list-render-fixed.json`. Harness: `list-render-harness.cjs` no mesmo diretório ignorado.

## Verificação

- `npm test`: 73 aprovados, zero falhas.
- TypeScript e lint aprovados; lint também executado diretamente nos dois arquivos modificados.
- Exportação web concluída. Metro precisou reconstruir seu cache após falha de desserialização; o fallback terminou com sucesso. Nenhuma limpeza de dados ou mudança do ambiente do Expo Go.
- Navegador com API local por proxy de leitura: abrir um registro e voltar preserva o registro visível e a posição de leitura. Log: `list-navigation.log`.

Sem nova medição controlada no Android. Não há alegação de ganho de FPS nem confirmação de desaparecimento do aviso no aparelho. O próximo teste é repetir a rolagem e a troca de filtros no Expo Go com a atualização carregada.
