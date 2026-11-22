# Diagnóstico inicial da implementação

Auditorias independentes de base técnica e UX realizadas antes de implementar a primeira entrega. Estado observado em 29/09/2026, antes dos commits de código.

## Base técnica

- Node 24.19.0; dependências locais instaladas. npm ls --depth=0: saída 0.
- TypeScript: 5 erros relacionados ao esquema de cores (unspecified) e tipo de nome do SymbolView em ParallaxScrollView, useThemeColor e IconSymbol.
- Lint: 9 erros de set-state-in-effect nas telas de mapa, histórico, detalhes e ranking; 1 aviso require-import.
- Expo 57 instalado; README ainda descrevia Expo 53.
- Sem adb, emulator ou xcodebuild no PATH. Nenhuma execução nativa comprovada.

## Estado e dados

- Relatos eram mutados diretamente em arrays e não sobreviviam ao reinício.
- Identificador baseado no tamanho do array podia colidir.
- ProfileScreen lia fixtures diretamente, fora do store.
- O serviço de IA podia fazer chamadas externas quando houvesse chave configurada, incompatível com o escopo confirmado.

## Jornada

- Entrada gov.br sugeria autenticação real, mas preenchia credenciais fictícias.
- Análise por IA era obrigatória para avançar; envio tinha controles com condições divergentes.
- Região inicial do formulário era São Paulo, enquanto fixtures usavam Rio de Janeiro.
- Falta de localização manual tornava a permissão/GPS dependência do registro.
- Botões de filtros/edição sem ação e pouca semântica acessível.
- Painel municipal separado ainda não existia.

## Priorização

Primeiro corrigir domínio/persistência e remover integrações reais; depois painel municipal; depois jornada móvel e verificação integrada. Evitar atualizar versões por idade aparente quando a instalação já é consistente. Redesign integral de telas secundárias fica fora desta primeira entrega.
