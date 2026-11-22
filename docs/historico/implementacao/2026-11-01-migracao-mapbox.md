# Plano de Implementação: Migração Completa para Mapbox

## 1. Diagnóstico e Erros Identificados

1. **Variáveis de ambiente (`.env`, `.env.example`, `app.config.js`)**:
   - A chave do Mapbox foi adicionada no `.env` como `MAPBOX=pk.eyJ...`. No Expo/Metro, variáveis sem o prefixo `EXPO_PUBLIC_` não são injetadas diretamente no bundle do cliente a menos que sejam mapeadas em `app.config.js` (`extra.mapboxAccessToken`) ou renomeadas para `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`.
   - O `.env` da raiz continha `EXPO_PUBLIC_GEMINI_API_KEY`, violando a diretriz de segurança do repositório (`AGENTS.md`: *"Gemini somente no servidor"*), pois variáveis `EXPO_PUBLIC_*` são expostas no bundle público do cliente.
   - Resquícios de `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` e `googleMaps` permaneciam em `.env`, `.env.example` e `app.config.js`.
2. **Resquícios de implementações anteriores de mapas**:
   - `expo-maps` ainda constava em `package.json`, `app.json` e `tests/expo-maps.test.cjs`.
   - `components/ui/OsmMapView.tsx` carregava Leaflet + OpenStreetMap + `leaflet.markercluster` criando elementos DOM/SVG individuais por marcador e aplicando filtros CSS pesados (`invert`/`hue-rotate`) no modo escuro.
3. **Gargalos de renderização na `TerritoryScreen.tsx`**:
   - `if (!isFocused) return null;` destruía e recriava toda a árvore da tela e a instância do mapa a cada troca de aba.
   - `onRegionChange` disparava `setRegion` continuamente durante o arrasto/zoom, forçando re-renderizações completas da `TerritoryScreen` e recalculando seletores a cada movimento da câmera.

---

## 2. Arquitetura Oficial com Mapbox

1. **Dependências e Configuração (`package.json`, `app.json`, `app.config.js`)**:
   - Remover `expo-maps` e registrar `@rnmapbox/maps` e `mapbox-gl`.
   - Configurar o plugin `@rnmapbox/maps` em `app.json` e expor `mapboxAccessToken` (`process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.MAPBOX`) via `app.config.js`.
   - Padronizar `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` em `.env` e `.env.example`, removendo `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` e `EXPO_PUBLIC_GEMINI_API_KEY` do cliente.
2. **Componente Unificado (`components/ui/MapboxMapView.tsx`)**:
   - Substituir `OsmMapView.tsx` por `MapboxMapView.tsx` como única fonte de mapa do projeto.
   - **Estilos Vetoriais Oficiais**: `mapbox://styles/mapbox/light-v11` (modo claro) e `mapbox://styles/mapbox/dark-v11` (modo escuro nativo, sem filtros CSS de inversão).
   - **Renderização GPU/WebGL por GeoJSON (`ShapeSource` / `GeoJSONSource`)**:
     - Todos os pontos (até 14.000+ chamados e equipamentos) são convertidos em uma única `FeatureCollection` GeoJSON com `cluster: true`, `clusterRadius: 48` e `clusterMaxZoom: 15`.
     - Camadas nativas/WebGL (`CircleLayer` / `SymbolLayer` para clusters e pontos, `FillLayer` / `LineLayer` para polígonos de bairros e praças) renderizam diretamente na GPU.
     - Seleção de cluster com `getClusterLeaves` / `getClusterExpansionZoom`: para até 10 itens exibe o carrossel de seleção; para mais de 10 itens aplica zoom suave de expansão.
   - **Execução Multiplataforma Mapbox**:
     - Em builds nativas (`npx expo run:android` / `run:ios`), utiliza o SDK nativo `@rnmapbox/maps` (C++ Metal/Vulkan).
     - Na Web (`npm run web`), renderiza diretamente via `mapbox-gl` WebGL no DOM.
     - No cliente genérico Expo Go (onde o binário C++ de `@rnmapbox/maps` não está embutido), aciona automaticamente o motor WebGL do `mapbox-gl` com os mesmos estilos, token e camadas GeoJSON do Mapbox, garantindo funcionamento universal sem crashes.
3. **Otimizações de Estado em `TerritoryScreen.tsx`**:
   - Substituir a atualização de estado em `onRegionChange` por `viewportRef` (`useRef`), eliminando re-renderizações da tela durante o pan/zoom do usuário e lendo `viewportRef.current` ao acionar *"Buscar nesta área"*.
   - Manter a tela montada ao alternar abas (ocultando com `display: 'none'` quando fora de foco em vez de desmontar a árvore com `return null`), preservando a instância do Mapbox pronta na memória.
4. **Limpeza de Consumidores, Documentação e Testes**:
   - Atualizar `TerritoryScreen.tsx`, `FacilityDetails.tsx`, `ItemLocationMap.tsx` e `LocationStep.tsx` para usar `MapboxMapView`.
   - Atualizar `AboutScreen.tsx`, `PRODUCT.md` e `docs/decisoes.md` para refletir o uso exclusivo do Mapbox.
   - Substituir `tests/expo-maps.test.cjs` e `tests/map-updates.test.cjs` por testes automatizados da configuração e construção de GeoJSON/camadas do Mapbox (`tests/mapbox-maps.test.cjs` e `tests/map-updates.test.cjs`).
