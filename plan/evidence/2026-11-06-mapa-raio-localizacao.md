# Raio e posição no mapa — 06/11/2026

## Comportamento

O mapa desenha o raio selecionado em metros, com preenchimento discreto e contorno tracejado. A seleção de bairro ou a busca pelo retângulo visível remove esse círculo para não sugerir um filtro que não está aplicado. O enquadramento do círculo preserva espaço para os controles.

A posição capturada do aparelho aparece como ponto azul com borda branca. Um halo representa a precisão informada pelo sistema; a mensagem identifica horário e precisão. A captura continua explícita, sem rastreamento contínuo. Um endereço salvo usa seu próprio centro, identificado como “Centro do entorno”, e não substitui a posição do aparelho. O ponto capturado fica somente em memória e é eliminado na troca de usuário/município e ao reiniciar.

O enquadramento automático permite comandos posteriores de zoom em agrupamentos. Uma nova captura recentraliza mesmo quando retorna as mesmas coordenadas.

## Evidência de código

- `npm test` em `front/`: 16 testes TypeScript e 82 testes CJS aprovados, incluindo geometria geográfica dos quatro raios, separação das fontes visuais, persistência/escopo da captura e efeitos de câmera.
- TypeScript do aplicativo (`tsc --noEmit`): aprovado.
- Expo lint e ESLint dos módulos de domínio alterados: aprovados.
- Revisão independente identificou interferência do enquadramento com comandos de zoom; corrigida com `useMapCamera`, remoção do enquadramento redundante por seleção e cobertura de regressão.

## Dispositivo Android

Inspeção via ADB no aplicativo nativo `com.anonymous.fiscalizaai`, com Mapbox. Confirmados os círculos de 500 m e 2 km inteiramente visíveis, o ponto azul capturado e a mensagem de precisão, além do halo em escala aproximada de rua. A mensagem foi ajustada para deixar os botões de posição e enquadramento acessíveis. Nenhuma coordenada ou captura de tela da localização pessoal integra esta evidência versionada.

## Limites

Sem validação web ou iOS nesta alteração. O ponto indica a última captura, não acompanhamento em tempo real. Os testes de câmera usam referências e efeitos controlados; não substituem a inspeção visual nativa.
