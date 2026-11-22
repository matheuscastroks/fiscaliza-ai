# Fase 4 — refatoração estrutural e testes (evidência de código)

Data: 2026-11-10. Tipo de evidência: **código, testes automatizados e bundle Android de JavaScript**. Nada foi validado em dispositivo ou na web. Nenhuma alegação de desempenho: as mudanças de "performance" abaixo reduzem trabalho óbvio (seletores, tamanho de arquivo), mas não foram medidas.

## O que mudou

- **Código morto removido:** `AppBottomSheet`, `AppDivider`, `ProgressiveList`, `Engagement`, `CitizenAction`, `CityCarousel`, `municipalContext`, `features/home/*`. Dependências sem uso removidas: `mapbox-gl`, `react-native-webview`, `expo-blur`, `expo-symbols`, `@expo/ui` (nenhuma aparece em `app.config.js`; o bundle Android continua exportando). Dependências que parecem soltas mas são pares do Expo Router/Reanimated (`@react-navigation/*`, `react-native-screens`, `react-native-worklets`, `expo-linking`, `expo-font`, `expo-web-browser`) foram mantidas.
- **Arquivos grandes:** `TerritoryScreen` caiu de ~900 para ~350 linhas, com a lógica em `features/territory/useTerritoryController.ts` (~700 linhas, ainda grande); `TerritoryFilterBar` (~1460 linhas) virou `TerritoryFilterBar` (~540) + `TerritoryFilterModal` (~820), com 16 estilos mortos apagados.
- **Persistência:** `stores/scopedPersistence.ts` (chave com escopo, fila de escrita serial, geração de escopo) usado por `territoryStore` e `placesStore`. `followStore` e `themeStore` ainda têm suas próprias filas.
- **Estado:** filtros do território saíram de dentro de um hook para `stores/territoryFilterStore.ts` e são zerados ao trocar de usuário ou município. A seleção de bairro continua com `placesStore.selection` como fonte ativa e `territoryStore.preferredNeighborhood` como preferência.
- **Duplicatas:** `OPEN_STATUS`/`CLOSED_STATUS`, `formatRadius`/`getPlaceIcon` (`features/places/placeDisplay.ts`), `officialStatusColor` único, `TerritoryLayer` único, serviço e hook de CEP únicos.
- **Seletores:** 10 usos de `useXStore()` inteiro viraram `useShallow`; `renderItem` de Salvos com `useCallback`; `mutation()` só invalida as chaves informadas.
- **Imagens:** fotos do onboarding de ~2,3 MB (JPEG) para ~540 KB (WebP). Peso de arquivo medido; efeito em tempo de abertura não medido.
- **Tipos:** ícone de categoria tipado como nome do Ionicons; removidos dois `as 'school'`; imports sem uso do projeto inteiro removidos (lint: 13 → 2 avisos, 0 erros).

## Testes

- 146 testes do app passam; typecheck do app e da API passam.
- Novos testes de comportamento: `scopedPersistence` (ordem da fila, falha não trava, geração, chaves), reset dos filtros, idade relativa, CEP.
- Testes que liam texto de código (ex.: `borderRadius: 12`, caixa alta) foram trocados por checagem de tokens ou de comportamento onde havia lógica; ainda restam testes de texto de código-fonte para a estrutura das telas.
- `back/`: 9 arquivos de teste falham nesta máquina porque o binário nativo do `sharp` não carrega no Windows (o mesmo resultado vale para `main` antes das mudanças); nada em `back/` foi alterado.

## Não feito

- `@testing-library/react-native` e testes de render: o runner é `node --test` sem Babel/Jest; adotar exige configurar um ambiente de teste de componentes. Fica como decisão da equipe.
- Quebrar `PlaceSelector`, `ProfileScreen`, `ResultsScreen` e `TerritoryFilterModal` (800+ linhas cada).
- Restringir a prop `color` de `AppText` a chaves do tema (há usos com cor calculada).
- Reduzir `useTerritoryController` em hooks menores.
