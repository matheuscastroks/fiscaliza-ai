# Abertura do mapa: experimento reproduzível

## Estado e decisão

Baseline continua padrão. A investigação nativa identificou e corrigiu trabalho de localização
de bairros que bloqueava a navegação em JavaScript; detalhes e medidas abaixo.
Instrumentação opt-in, sem usuário, coordenadas, filtros, payloads ou mensagens de erro.
O buffer tem limite de 1.000 eventos; callbacks de frames nativos só são habilitados com diagnóstico.

O Android conectado passou a usar o Metro correto por USB (`localhost:8081`). Os eventos
confirmaram a variante de cada bundle. As variantes isoladas `visible-surface` e `unfrozen`
não eliminaram o atraso de aproximadamente três segundos até o foco.

## Causa e correção medidas em 2026-11-02

Dispositivo A6EUS4QKMZMRFQ59, Android, build de desenvolvimento instalado, Metro local,
cache de dados e tiles preservado. Não representa medição de release nem FPS.

O Profiler do React localizou aproximadamente 2,5 s na renderização da Home ao sair para o
mapa. A ordenação de 167 bairros consumiu 1,9–3,1 s: `localeCompare('pt-BR')` era executado
em cada comparação e um `options={[]}` invalidava a memoização em cada renderização.
Um `Intl.Collator` reutilizado e uma lista vazia estável eliminaram essa repetição.

Outro custo recorrente, de aproximadamente 400 ms, vinha de `useTerritorySelection`:
resolvia o bairro percorrendo todos os nomes a cada renderização, inclusive sem seleção.
Agora retorna imediatamente para seleção vazia, normaliza a busca uma vez, usa conversão
de caixa Unicode compatível com português e memoiza pelo nome e pela lista de bairros.
Identidades ambíguas continuam sem resolução. Os profilers temporários foram removidos.

Antes: retornos aquecidos registrados de 2,7–3,1 s até foco e 5,9–6,7 s até frame completo.
Após as correções, com baseline e código final: primeira sequência de 12 retornos com
p95 de 152,35 ms até foco e 377,08 ms até frame completo. Uma sessão após reiniciar o
processo registrou a primeira montagem em 459,33 ms até foco e 1.141,30 ms até frame.
Não misturar primeira montagem com retornos aquecidos nem atribuir o ganho à rede.

Repetição final no mesmo processo, sem profilers: 21 visitas (primeira montagem e 20
retornos), p50/p95 até foco de 149,86/192,97 ms e até frame de 390,57/455,75 ms.
O ganho foi obtido mantendo `freezeOnBlur`, superfície e montagem de mapa/lista do baseline.
A lista exibiu os chamados com seus controles de detalhe e retorno ao mapa no Android.
Memória PSS após 8 visitas: 965.715 KB; após 21: 1.011.125 KB. Esses dois pontos de um
build de desenvolvimento não estabelecem vazamento nem estabilidade de memória em release.

Cinco reinícios de processo com cache preservado: primeira abertura do mapa com p50/p95
até foco de 568,12/596,45 ms e até frame de 1.259,52/1.289,26 ms. Esses tempos começam no
toque em Explorar, depois de carregar a Home; não medem o lançamento completo do aplicativo.
Arquivo: `.validation/map-fixed-cold-final.log`.

Logs e perfis locais em `.validation/map-*-profile.log`, `.validation/map-fixed-final.log`;
o diretório é ignorado pelo Git. Os arquivos não incluem coordenadas ou dados de usuários.
O parser aceita os formatos de log Android com o JSON na mesma linha ou na seguinte.
`npm test`: 38 testes de domínio e 53 testes de componentes/infraestrutura aprovados;
inclui seleção territorial, normalização, identidade ambígua, escopo vazio sem varredura,
mapa e parser de logs. `npx tsc --noEmit`, `npm run lint` e `git diff --check` aprovados.

## Executar uma variante por vez

No PowerShell, iniciar o servidor com ambiente explícito (reiniciar Metro e recarregar completamente
o app ao mudar de variante; Fast Refresh não é uma nova abertura fria):

```powershell
$env:EXPO_PUBLIC_MAP_PERF='1'
$env:EXPO_PUBLIC_MAP_PERF_VARIANT='baseline'
npm start -- --dev-client --localhost
```

Conectar o build ao servidor correto antes de coletar. Confirmar eventos `[map-perf]` no log.
`baseline` preserva o comportamento; `visible-surface` remove apenas display:none por foco;
`unfrozen` desabilita apenas freezeOnBlur de Explorar; `retained-map` conserva a instância
após a primeira abertura ao alternar mapa/lista, usando opacity e pointerEvents para ocultá-la.
Não mudar globalmente as outras abas. Reverter experimento que regressar memória ou navegação.

Para cada variante: cinco aberturas após encerrar o processo, vinte retornos de outras abas
com cache aquecido, vinte lista→mapa e retornos dos detalhes. Não limpar cache de dados/tiles
sem identificar esse cenário separadamente. Registrar aparelho, build, rede e cache da sessão.
Comparar dev e release no mesmo aparelho; a instrumentação pode ser habilitada no bundle release.

```powershell
adb logcat -d -s ReactNativeJS > .validation/map-baseline.log
node scripts/summarize-map-performance.cjs .validation/map-baseline.log
adb shell dumpsys meminfo com.anonymous.fiscalizaai
```

Guardar meminfo antes/depois das vinte alternâncias e após um período de repouso.
Usar React Native DevTools para JS/commits; Android Studio System Trace/Perfetto para frames
e superfície nativa. Instrumentação de eventos não substitui esses perfis.

## Interpretação

Toque inicia trace; foco e primeiro commit são únicos por trace. Mudanças de frame posteriores
são ignoradas; primeira página registra duração e número de registros. Uma requisição antiga
não é atribuída à visita seguinte. Eventos de frame indicam renderização completa do Mapbox,
não prova de que todos os chamados ou tiles futuros chegaram nem de resposta aos gestos.
A inscrição de frame é desligada depois do primeiro frame da visita e rearmada em nova visita.
Eventos de módulo e GeoJSON são emitidos no efeito após commit, evitando logs durante render.

O resumo separa variantes/origens/sessões, mostra p50/p95 e número de amostras.
Sem frame, reporta null; não classificar visita incompleta como rápida. Evento direct inclui
entrada pelo botão da Home. `focus-only` começa no efeito quando não houve um toque instrumentado;
excluí-lo do tempo de navegação: não inclui o custo de montagem inicial. Rotular cenários manualmente em logs separados.

Meta proposta: p95 de retorno aquecido ≤500ms; medir interação junto com primeiro frame.
Preservar câmera, recorte, seleção, clusters, detalhes, erros e modo offline.
Não promover uma variante sem ganho reproduzível e memória estável. Não alterar SQL, migração,
provedor ou cache por suposição; API só entra na otimização se a trilha demonstrar contribuição.

## Verificação de código

Testes cobrem opt-in, variante inválida, tempos, deduplicação, isolamento entre visitas,
buffer limitado e resumo sem dados. Rodar npm test, npx tsc --noEmit e npm run lint.
Isso não comprova latência, memória ou fluidez Android.
