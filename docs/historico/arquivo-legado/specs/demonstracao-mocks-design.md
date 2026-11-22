# Demonstração integrada por cenários — especificação da primeira entrega

Autorizada pelo usuário para implementação coordenada por subagentes, diretamente na main. Sem publicação, novos serviços ou backend. Cenários independentes aceitos pelo usuário.

## Objetivo

Entregar um ciclo demonstrativo reproduzível: cidadão registra e acompanha localmente; equipe municipal consulta, filtra e atualiza ocorrências no painel web separado. Os dois produtos partem das mesmas fixtures e selecionam os mesmos cenários, sem sincronização.

## Decisões técnicas

- Preservar a aplicação Expo na raiz. Painel React/Vite em municipal/, com scripts npm próprios e atalhos na raiz. Não migrar todo o repositório para monorepo.
- Tipos e regras puras compartilhados em demo/. Sem importações React Native nessa camada.
- Preservar a forma atual de Problem e User para não quebrar telas existentes; acrescentar histórico de status quando necessário.
- Cenários registered, in_progress e resolved; ocorrência principal com identificador constante nos dois produtos. Datas e dados iniciais fixos, nomes e município fictícios.
- Repositório local criado com adaptador assíncrono getItem/setItem/removeItem. Chaves distintas fiscaliza:citizen:v1 e fiscaliza:municipal:v1. Escritas serializadas, restauração explícita, erros de armazenamento comunicados e conteúdo persistido validado.
- Dados inicializados por cópia independente. Não expor referências mutáveis internas. Criação usa identificador único; filtros e estatísticas derivam do mesmo conjunto.
- A API mockada móvel delega ao repositório. Manter assinaturas públicas existentes para consumidores legados.
- Entrada do cidadão por botão de demonstração com usuário fictício. gov.br só como referência textual, sem coleta de credenciais. Desabilitar chamada externa de IA; se mantida, heurística local claramente rotulada.
- No painel: cabeçalho institucional, resumo numérico, busca/filtros, lista acessível, detalhe com histórico e formulário de atualização com justificativa, seleção/restauração de cenário com confirmação. Sem botões decorativos inativos.
- No app: melhorar entrada, listagem/acompanhamento e controles de cenário; manter registro existente funcional, com revisão antes de confirmar e localização manual quando GPS indisponível.
- Paleta inicial coerente com tema verde existente: verde #16624F, fundo #F4F7F6, texto #18332B, borda #D8E3DD, âmbar #946200 e branco #FFFFFF. Tipografia de sistema legível, sem fontes externas obrigatórias. Hierarquia por tarefas e espaço; evitar decoração que atrapalhe leitura.
- Mapas reais existentes podem depender de rede; painel terá representação esquemática local identificada e lista equivalente. Nunca prometer navegação/geocodificação real nesse esquema.

## Critérios de qualidade

Testar criação, validação, filtros combinados, transições/histórico, recarga da persistência, reset, isolamento de instâncias, payload inválido e erro de escrita. Testes devem exercitar o repositório real, usando apenas armazenamento em memória como adaptador.

Painel deve funcionar por teclado, em 1440px e 390px, mostrar estados vazios e manter filtros e dados consistentes após atualização. Verificar em navegador com fluxo de mudança de status e reload. App deve passar TypeScript/lint e export quando viável; execução nativa só pode ser declarada após teste em dispositivo/emulador disponível.

Fora desta primeira entrega: publicação nas lojas, pesquisa externa com usuários, redesign completo das telas secundárias de ranking/pontos, backend e integração real. Nenhum teste web será apresentado como prova de execução nativa.
