# Passagem — redesenho do Fiscaliza aí

O redesenho das telas do Fiscaliza aí adota hierarquia clara, menos ícones decorativos e ações principais ao alcance do polegar. A revisão usou as orientações de tipografia, layout, navegação, cor e ícones do Apple HIG. O aplicativo consulta dados oficiais e encaminha a pessoa ao canal oficial, sem registrar pedidos.

## Implementado

- **Explorar:** mapa como entrada, cartão flutuante de resultados, prévia flutuante para um marcador e lista segmentada para agrupamentos. Ver lista abre Resultados em tela cheia e preserva o retorno ao mapa. Busca, contagem e marcadores se atualizam juntos durante a digitação. Os filtros explícitos preservam a área escolhida e a busca ao mover o mapa é acionada por Buscar nesta área. Erros de rede e de mapa têm tratamento distinto, e a lista funciona quando o Mapbox está indisponível.
- **Agir:** pedir um serviço separado de consultar protocolo e explorar o mapa. A ação principal fica em rodapé acima das abas. Canais oficiais, montador de mensagem e catálogo por assunto ficam no fluxo de serviços. A consulta externa abre a página de acompanhamento do 1746.
- **Salvos, Perfil e Preferências:** filtros ocultos quando Salvos está vazio, seletores adaptáveis, ações de conta empilhadas, listas e seções com menos ícones. Cabeçalhos compartilhados, nome, e-mail, endereço e rótulos longos podem quebrar linha. O tema acompanha a aparência do sistema, sem seletor dentro do app.
- **Meus lugares:** adicionar lugar no rodapé, com retirada desse botão ao abrir o editor. Endereço e raio aparecem junto ao nome.
- **Detalhe do chamado:** problema, local, situação e prazo antes do protocolo e histórico. Salvar e atendimento oficial ficam no rodapé. O botão de salvar mostra texto e expõe seu estado acessível.
- **Dados do bairro e volume:** títulos orientados por perguntas, indicadores empilhados quando necessário e menos ornamentos.
- **Apresentação e autenticação:** a primeira abertura exige três etapas curtas. A primeira apresenta o Fiscaliza aí e menciona o 1746, a segunda explica a Central e a terceira mostra Salvos e Agir. O login usa uma foto do Rio e espaçamento reduzido.
- **CEP e indicadores:** Buscar minha cidade acompanha o teclado e dá lugar a Confirmar cidade no mesmo rodapé. Indicadores do bairro agrupa serviços em uma lista e oferece detalhes das fontes sob demanda. A atualização por período mantém a posição da leitura e o atalho para o mapa inclui todas as situações no intervalo.
- **Movimento e navegação:** a barra de abas mostra o rótulo ativo. Abas, painéis e avisos usam tempos compartilhados, adaptados das referências de Transitions.dev. A redução de movimento do sistema foi testada na troca de abas.

## Evidência e limites

- A tentativa de exportar para web falhou na resolução de `react-native-web/dist/index`. O produto documenta Android e iOS e a dependência web está ausente. A exportação não fornece evidência de renderização web.

- A API local agora normaliza os acentos dos campos textuais na busca de chamados. A migração `0021_official_search_accents.sql` adiciona uma função e um índice. O teste SQL isolado no PostgreSQL 17 encontrou iluminação ao buscar ILUMINACAO. A API em uso no Samsung ainda depende da aplicação da migração e do deploy para esse teste de ponta a ponta.

- Explorar usa o mapa como visualização principal e abre a lista pelo painel de resultados. O modo de lista independente foi retirado do estado de navegação. Se o mapa estiver indisponível, a lista aparece automaticamente.
- O menu lateral agrupa cidade e chamados, conta e preferências, ajuda e informações. Dados do bairro fica junto de Explorar, Salvos e Agir. A entrada de conta aparece uma vez para visitantes. A tela atual é marcada por fundo elevado e seleção acessível.
- A profundidade foi aplicada à marca no cabeçalho de autenticação, aos indicadores de perfil e de situação do chamado e aos controles do detalhe. A aparência acompanha o sistema.
- A revisão de cores neutralizou as superfícies claras e adotou uma escala de grafite no escuro, com superfícies elevadas mais claras. Azul-petróleo indica ação, amarelo compõe a marca e os estados usam cores semânticas acompanhadas de texto ou ícone. Foram medidos 27 pares por tema, todos com contraste de ao menos 4,5:1. [Color](https://developer.apple.com/design/human-interface-guidelines/color) · [Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode) · [Icons](https://developer.apple.com/design/human-interface-guidelines/icons)
- A primeira captura do menu reagrupado mostrou a marca incompleta e os atalhos de ajuda abaixo da área visível. As capturas seguintes mostraram a marca inteira, o item atual destacado e os três grupos em claro e escuro no Samsung a 100%. Também foram inspeccionados o mapa, o painel de resultados, o login escuro e Preferências no escuro. A preferência clara foi restaurada.

- A tela Pedir um serviço agrupa os canais oficiais e as opções de ajuda. No Samsung em tema claro e escala de 100%, os rótulos e descrições ficaram inteiros e o toque em Encontrar serviços por assunto abriu o catálogo. Após recarregar o app, a árvore do Android confirmou o título Serviços por assunto inteiro, em duas linhas.
- Os três testes de filtros passaram isoladamente com `--testTimeout=30000`. A execução padrão havia excedido o limite de cinco segundos no primeiro teste. O limite do repositório permanece como estava.
- O APK de desenvolvimento foi instalado preservando os dados. A repetição do teste de densidade manteve o mesmo processo e a mesma janela. Os logs daquele cenário não mostraram os avisos de linking ou de dependências do Reanimated.

- No Samsung SM-S901E, o mapa carregou agrupamentos reais, a lista abriu, foi possível consultar e salvar um chamado e reencontrá-lo em Salvos. O salvamento de teste foi revertido. No Expo Go, a lista funcionou sem Mapbox.
- Em 135%, o painel recolhido e as quatro abas ficaram legíveis. O botão de Agir ficou acima das abas e separado das opções. Meus lugares abriu o formulário pelo rodapé sem salvar um lugar. A escala do aparelho foi restaurada após os testes concluídos.
- A API publicada chegou a retornar HTTP 530 / Cloudflare 1033. À época, o túnel foi recuperado, PostgreSQL voltou a ficar saudável e a API foi recriada com a imagem e volumes existentes. Saúde, filtros e chamados retornaram HTTP 200. Reconfira a disponibilidade antes de testar novos fluxos.
- A execução integral com `npm test -- --runInBand --testTimeout=30000` passou pelas etapas Node e pelas 10 suítes Jest, com 32 testes de componentes. `npm run typecheck` e `npm run lint` também passaram no frontend.
- Evidências detalhadas em [evidencia-ux-android.md](evidencia-ux-android.md). Regras de tipografia, hierarquia e ícones em [DESIGN.md](../front/DESIGN.md).

## Próximos passos, em ordem

1. **Ampliar a validação com conta.** O Samsung validou cadastro, confirmação da cidade, visualização do CEP no perfil, consulta autenticada e saída com uma API local isolada. As demais alterações de conta e jornadas autenticadas permanecem sem teste de ponta a ponta.
2. **Completar a acessibilidade em dispositivo.** O TalkBack recebeu foco no título da lista. A leitura e a sequência de gestos precisam de teste adicional. Dynamic Type e VoiceOver dependem de um ambiente iOS. O documento de evidências registra as telas já observadas em 320 dp e com texto a 135%.

Há alterações anteriores e desta revisão no mesmo worktree. Comece com `git status --short` e `git diff` e preserve o trabalho em andamento. Nenhum commit foi criado nesta passagem.
