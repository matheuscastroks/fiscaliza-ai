# Abertura do mapa: experimento reproduzível

## Estado e decisão

Baseline continua padrão. Nenhuma redução dos ~2 segundos foi comprovada no dispositivo.
Instrumentação opt-in, sem usuário, coordenadas, filtros, payloads ou mensagens de erro.
O buffer tem limite de 1.000 eventos; callbacks de frames nativos só são habilitados com diagnóstico.

Ruling: manter comportamento normal até haver comparação nativa válida, conforme plano aprovado.
O Android conectado foi identificado, mas o aplicativo instalado continuou procurando o Metro
antigo em 192.168.1.42:8081. O servidor de diagnóstico em 8082 não recebeu um bundle confirmado.
Não usar esses testes como baseline nem inferir causa de FPS, rede ou CPU.

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
