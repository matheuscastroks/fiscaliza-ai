# 03 — Mocks e disponibilização

**Estado:** planejada. Sem backend, banco remoto ou autenticação real.

## Arquitetura proposta
Preservar Expo/React Native e reaproveitar services/mockApi.ts, separando tipos e fixtures. Painel web separado, com modelos e dados iniciais coerentes. Proposta: AsyncStorage no app e armazenamento local do navegador no painel. Compartilhar fixtures não sincroniza alterações.

## Checklist
- [ ] Fechar D09: cenários independentes (recomendado) ou transferência manual.
- [ ] Definir fixtures determinísticas com município fictício, relatos, categorias, imagens locais, perfis e histórico.
- [ ] Especificar contratos locais assíncronos de listagem, detalhe, criação e atualização, com latência e falhas simuladas controláveis.
- [ ] Definir persistência após reinício, versão dos dados e restauração do cenário, confirmando antes de descartar alterações.
- [ ] Definir entrada demonstrativa e referência gov.br identificada como simulação, sem credenciais reais.
- [ ] Simular IA caso essa experiência permaneça; sem chaves ou chamadas externas.
- [ ] Definir mapas e sua dependência de rede; preparar alternativa para indisponibilidade.
- [ ] Escolher build móvel e hospedagem estática do painel.
- [ ] Escrever e revisar plan/specs/demonstracao-mocks-design.md antes do plano executável.

## Critério de saída
Especificação de mocks, persistência, cenários e distribuição revisada. Controles de apresentação separados da navegação normal. Login e perfis demonstram UX; não constituem segurança para operação real.
