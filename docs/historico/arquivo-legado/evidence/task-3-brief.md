# Task 3 — Jornada móvel da demonstração

Ler Global Constraints de plan/implementation/demo-v1.md e o contrato final no relatório Task 1. Main apenas; sem branches, backend, publicação ou subagentes. Relatório em plan/evidence/task-3-report.md.

## Entrega

- LoginScreen: entrada por botão “Entrar na demonstração”, sem formulário gov.br real. Informar dados fictícios e ausência de integração oficial. Preservar saída da sessão.
- RootLayout/authStore: aguardar hidratação antes de redirecionar; evitar perder rota autenticada no reinício. Safe areas sem padding duplicado.
- ProblemsListScreen: listagem legível, busca e filtros funcionais, vazio com ação para limpar, abertura de detalhes. Remover botões sem ação e bairro fixo incoerente.
- ReportScreen: formulário menor, localização manual suficiente, foto opcional e IA local opcional. Não pedir permissão de GPS automaticamente. Validar descrição/categoria/local antes de revisão e confirmação; impedir envio duplo e preservar campos após erro. Feedback com identificador e menção a salvamento local, sem prometer recebimento real da prefeitura.
- ProblemDetailsScreen: status, local e histórico legíveis; remover edição sem função. Atualizar dados ao voltar à tela; registro inexistente tem estado explícito.
- ProfileScreen: dados do repositório, sem leituras de arrays de fixtures; controles de cenário registrados/em atendimento/resolvidos e reset com confirmação. Após mudança, refresh das listas e estatísticas. Rótulos explicam independência entre dispositivos.
- Entrada principal/mapa: não obrigar GPS; lista ou mapa esquemático identificado como demonstração é suficiente para cenário offline. Não acrescentar chaves Maps.
- HistoryScreen: dados atualizados e vazio coerente. Corrigir os erros lint existentes de effects em mapa/histórico/detalhes/ranking com refatoração apropriada, sem desabilitar a regra globalmente.
- Textos de permissões em português e finalidade correta em app.json. Manter telas secundárias acessíveis, sem redesenho amplo de ranking/pontos.

## Qualidade

Achado menor da revisão Task 1: em demo/repository.ts, validar também resolvedAt e comment.createdAt nos dados persistidos. Adicionar teste de snapshot com datas inválidas e corrigir como parte do acabamento de integração.

Seguir paleta do spec e componentes reutilizáveis pequenos. Rótulos acessíveis, alvos de toque adequados, texto escalável, sem animações de entrada obrigatórias. Componentes podem ser extraídos para components/demo/; não concentrar nova UI em arquivos de milhares de linhas.

Testar a lógica nova de sessão/hidratação, formulário/validação e atualização de listas com testes comportamentais. Rodar suíte, tsc e lint; registrar RED/GREEN e limitações. Export web é verificação adicional, não comprova execução nativa. Atualizar README com comandos reais para app e painel, cenário/restauração e limites conhecidos.
