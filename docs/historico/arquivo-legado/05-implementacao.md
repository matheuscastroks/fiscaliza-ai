# 05 — Implementação incremental

**Estado:** aguardando especificações. Este arquivo é o roteiro da fase, não um plano executável de `writing-plans`.

## Formação dos planos executáveis

- [ ] Para cada incremento abaixo, partir de uma especificação escrita e revisada pelo usuário.
- [ ] Usar `superpowers:writing-plans` para criar `plan/implementation/<subsistema>.md` com Goal, Architecture, Tech Stack, Spec, Global Constraints e Review Focus.
- [ ] Mapear os arquivos existentes afetados e os novos arquivos por responsabilidade; definir interfaces entre tarefas antes de delegar ou implementar.
- [ ] Dividir o incremento em tarefas com entrega verificável, arquivos, assinaturas e entradas/saídas exatas, sem pressupor contratos ainda não decididos.
- [ ] Para mudanças de comportamento, especificar teste que reproduz a necessidade, execução com falha esperada, implementação mínima e execução com sucesso. Não criar testes artificiais para documentação.
- [ ] Fazer autorrevisão de cobertura, coerência dos tipos, falhas relevantes e proporção do plano.
- [ ] Apresentar o plano ao usuário e definir execução direta com `executing-plans` ou por agentes com `subagent-driven-development`. O método ainda não foi escolhido.

## Disciplina de execução futura

- `using-git-worktrees`: avaliar isolamento antes de iniciar implementação, preservando alterações existentes.
- `test-driven-development`: usar para funcionalidades e correções; testes devem provar comportamento, não copiar a implementação.
- `systematic-debugging`: investigar falhas antes de propor alterações.
- `requesting-code-review` / `receiving-code-review`: revisar incrementos e verificar a pertinência de cada correção sugerida.
- `verification-before-completion`: registrar evidências atuais antes de declarar entrega pronta.
- `finishing-a-development-branch`: aplicar ao final, sem tratar aprovação de planejamento como autorização para publicar.

Os planos terão pontos de commit por entrega coesa. Esta revisão documental não inicia commits, instalação de dependências do aplicativo, migrações ou publicação.

## Pré-requisitos

Iniciar somente após fechar as decisões técnicas e os fluxos necessários nas fases anteriores. Este documento organiza trabalho futuro; não solicita alterações imediatas no aplicativo.

## Incrementos

1. **Base técnica:** compatibilizar dependências e lockfile, corrigir configuração e documentação e estabelecer uma execução reproduzível. Validar antes de combinar atualização técnica e redesenho extensivo.
2. **Domínio e mocks:** separar tipos, fixtures e serviços locais; implementar entrada demonstrativa, cenários e persistência local. Sem backend ou gov.br real.
3. **Ciclo do cidadão:** lista/mapa, criação com anexos, revisão, confirmação e acompanhamento, usando os componentes aprovados e preservando dados após falhas.
4. **Ciclo municipal:** painel web separado com fila, filtros e mapa, detalhes, triagem e atualização de status com histórico. Simular perfis na interface, sem alegar segurança de servidor.
5. **Cenários e distribuição:** manter coerência do roteiro entre perfis, calcular indicadores sobre os mocks e gerar builds reproduzíveis. Sem sincronização entre dispositivos.
6. **Complementos justificados:** reavaliar votos, comentários, ranking, pontos e IA pelo benefício ao TCC. Não torná-los dependências do ciclo essencial sem justificativa.

## Critérios por incremento

Cada entrega deve incluir comportamento verificável, tratamento de falhas relevante, documentação de configuração e evidência de teste. Alterações de contratos e estados precisam atualizar os consumidores e prever a transição dos dados existentes, usando apenas dados fictícios, com restauração dos cenários.

A entrega estará completa quando as jornadas locais de registro/acompanhamento e atendimento municipal forem interativas e reproduzíveis. A passagem entre interfaces seguirá D09, sem exigir propagação automática.
