# Revisão de Explorar e Agir no Android

A faixa do login usa uma fotografia do Rio de Janeiro de Wilfredor, em CC0. [Fonte da fotografia](https://commons.wikimedia.org/wiki/File:Rio_de_Janeiro_skyline_and_Sugarloaf_Mountain_at_sunset,_Brazil.jpg).

No cadastro, a árvore do Samsung mostrou Confirmar senha, Criar conta e Já tenho uma conta inteiros a 135%. Ao abrir o login pelo Perfil na mesma escala e tocar em Senha, a área rolou para cima e Entrar continuou inteiro na árvore da interface. A escala foi restaurada para 100%. Nenhuma credencial foi inserida.

## Aparelho

Build de desenvolvimento no Samsung SM-S901E, via USB e Metro. Capturas avaliadas em tema escuro: Explorar recolhido e com lista em erro, Salvos sem registros, Agir, Pedir um serviço, catálogo por assunto, Perfil, Preferências, Dados do bairro, Ajuda, Sobre, Conta e privacidade e Meus lugares. O mapa base renderizou. A lista exibiu o erro com uma ação de nova tentativa. Nas primeiras capturas, a seleção de domínio mostrava zero mesmo com falha na consulta, Salvos mostrava filtros sem registros e o título do catálogo era truncado. As mudanças posteriores removem a contagem da seleção de domínio, recolhem os filtros de Salvos vazia e encurtam o título do catálogo.

## Infraestrutura

O Android resolveu o domínio público. A consulta HTTPS à API publicada retornou erro Cloudflare 1033 e HTTP 530. A porta local 43001 não respondeu na checagem inicial. Com o arquivo .env.compose, Docker confirmou API e PostgreSQL saudáveis e conector Cloudflared não saudável. Os logs do conector mostram falhas de DNS e de conexão de saída para Cloudflare na porta 7844. O conector voltou a registrar conexões após reiniciar. O PostgreSQL completou a recuperação automática após uma parada. A API foi iniciada em um contêiner recriado com a imagem e os volumes existentes. Os endpoints públicos de saúde, filtros e chamados responderam HTTP 200.

## Depois da recuperação

Metro reiniciado na porta 8081, com redirecionamento ADB por USB. No build de desenvolvimento, o mapa exibiu agrupamentos do 1746, o painel abriu uma lista com chamados reais e foi possível consultar um detalhe e reencontrar o mesmo chamado em Salvos. O Expo Go exibiu a lista como conteúdo principal e mostrou registros sem coordenadas.

## Cobertura pendente

Em Explorar, a captura no SM-S901E com fonte a 135% confirmou que o texto do painel recolhido quebra linha e os botões de localização e enquadramento ficam acima dele, sem sobreposição. A escala original de 100% foi restaurada. O aviso de linking do build de desenvolvimento cobriu parte da barra de abas, que não foi avaliada nessa captura.

Web, TalkBack e variações de tema ou ampliação de texto nas telas secundárias além das capturadas. As capturas não substituem os testes com moradores.

Uma segunda captura em Explorar, após abertura em processo novo e com fonte a 135%, mostrou os quatro rótulos da barra de abas inteiros, sem sobreposição. O aviso de linking não apareceu nos logs da nova instância no primeiro carregamento. A escala foi restaurada para 100%.

Em Agir, a captura em tema claro com fonte a 135% confirmou que Pedir um serviço no 1746 permanece inteiro no rodapé, acima das abas e separado das opções de consulta. A escala do aparelho foi restaurada após o teste.

Em Meus lugares, o teste no SM-S901E localizou Adicionar novo lugar junto à área segura inferior. O toque abriu o formulário com Nome do lugar e retirou o botão do rodapé durante a edição. Nenhum lugar foi gravado.

No detalhe do chamado, a captura em tema escuro com fonte a 135% mostrou Salvar chamado e Acessar atendimento oficial inteiros, empilhados e acima da área de gestos. A árvore de acessibilidade confirmou áreas de toque separadas. Ainda falta repetir a jornada de salvamento pelo novo rodapé e verificar a rolagem até o fim do histórico.

No formulário de mensagem para o 1746, apagar o endereço sugerido manteve o campo vazio e revelou a ação Usar local sugerido. Com o gesto de fechamento do próprio painel ativado, o Samsung confirmou que arrastar fechou o teclado. Após rolar, Abrir WhatsApp do 1746 e Compartilhar texto apareceram inteiros acima da área de gestos. Nenhuma mensagem foi enviada.

Em tema claro, o painel recolhido anunciou Ver lista e o total. Após o toque, o título exibiu o total sem repetir a ação, com o primeiro chamado e o mapa visíveis na captura. No mesmo processo novo, o log JavaScript registrou a montagem e nenhum aviso do Reanimated ao iniciar e abrir a lista.

Na versão seguinte, Ver lista abriu Resultados em tela cheia, sem abas aparentes. As capturas em 100% e 135% mostraram o cabeçalho, os filtros e as linhas compactas. Voltar do detalhe preservou o primeiro item visível e a posição de rolagem. Voltar ao mapa recuperou Explorar, e Localizar chamou a prévia do mesmo registro. Ao trocar de aba, apenas o rótulo ativo apareceu na barra. A escala original de 100% foi restaurada.

O novo APK com `fontScale` no manifesto foi instalado preservando os dados. Mudar a escala manteve a mesma MainActivity e o mesmo processo. A captura confirmou o aumento do texto na lista. No ciclo testado, o log não registrou aviso de linking nem de Reanimated.

O atalho Ver lista foi conferido em tema claro com recuo nos dois lados, superfície arredondada e espaço acima da barra de abas. O toque continuou abrindo Resultados em tela cheia. A captura de Dados do bairro para Rio de Janeiro mostrou os indicadores com dados reais, incluindo o total de 27.814 chamados.

Na tela Bairros por volume em tema claro, a captura mostrou os cinco bairros com maior contagem, os valores alinhados, a comparação por barras e a fonte Data.Rio, sem misturar contagem de prazos à comparação de volume.

Em Serviços, a lista abriu o detalhe do CIEP 1°. de Maio, em Santa Cruz. A captura final mostrou o nome da unidade, o endereço e o mapa. Como chegar e Ligar para a unidade ficaram no rodapé acima da área de gestos. Nenhum discador ou navegador externo foi aberto.

Na barra de abas, a gravação inicialmente revelou perda de contraste do rótulo durante o deslizamento. A seleção tonal corrigiu a legibilidade nos quadros intermediários em tema claro e foi conferida em repouso no tema escuro. Com a escala de transição do sistema em zero, a gravação mostrou a troca de posição diretamente para o destino. O ajuste do sistema foi restaurado para 1,0.

Os painéis de filtros de Serviços e Chamados se ajustaram à altura do conteúdo no Samsung. Em Chamados a 135%, o título, as opções e o rodapé permaneceram legíveis. Ao concluir, a busca voltou a abrir com o campo Assunto ou protocolo e o contador anunciou um filtro ativo. A escala de texto foi restaurada para 100%.

Em Trocar área, Buscar bairro aparece antes dos atalhos e de Meus lugares. No Samsung, o campo e o resultado de Santa Cruz subiram acima do teclado. A opção pôde ser selecionada com o teclado aberto e o mapa exibiu o bairro e 356 chamados no recorte testado.

No recorte testado de Santa Cruz, a busca por ilumin retornou 23 chamados. O detalhe de Reparo de cabo de iluminação pública mostrou bairro, situação Aberto e prazo estimado vencido. A busca por iluminacao retornou zero, pois a consulta atual ignora diferenças de maiúsculas e minúsculas, mas distingue acentos. O teste não alterou os chamados salvos.

Na busca do mapa, a captura em tema claro mostrou o campo, os pontos e o cartão Ver lista acima do teclado. Digitar iluminzzzqx atualizou o cartão para zero chamados e a contagem do mapa para zero. Ao apagar o sufixo, o cartão voltou a mostrar 23 chamados mantendo o teclado aberto.

Ao tocar em Ver lista com o teclado aberto, a captura mostrou a lista ocupando a tela, com a pesquisa preservada e o teclado fechado. O protocolo 24002858 apareceu em Salvos depois do salvamento de teste pelo rodapé. O chamado foi aberto a partir de Salvos e o salvamento de teste foi revertido no detalhe, que voltou a anunciar Salvar chamado para acompanhar.

Em Santa Cruz, tocar no ponto individual abriu um cartão com margens sobre o mapa e ações de detalhe e salvamento acima das abas. Depois de fechar o cartão, tocar em um marcador numérico abriu um painel com contagem e linhas verticais de chamados do agrupamento.

A rolagem no Samsung ultrapassou os 50 registros da primeira página. Nessa versão, o marcador mostrava 78 e a área consultada retornava 84.

Com a correção, o agrupamento nativo identifica as células que o compõem e a lista filtra as páginas por essas células. O teste automatizado excluiu um chamado vizinho dentro do retângulo geral. No Samsung, o marcador com 50 abriu um painel com 50 chamados, e a rolagem chegou ao rodapé de 50 de 50.

Após fixar o cabeçalho do painel, seis gestos de rolagem mantiveram o título e Fechar visíveis nas mesmas coordenadas da tela.

Ajuda e Sobre o app foram abertas pelo menu lateral e inspecionadas em tema claro. Em Sobre, os títulos ficaram mais próximos dos respectivos parágrafos na captura após o ajuste. A documentação sobre Salvos agora distingue o uso com conta e a possibilidade de sincronização.

A apresentação passou a ter três etapas curtas. No Samsung, a ordem final começa pela proposta do Fiscaliza aí, depois explica a Central 1746 e termina com Salvos e Agir. O fluxo de três etapas foi percorrido com texto a 135% antes do ajuste de ordem. A ação final retornou a Ajuda e a escala foi restaurada para 100%.

Com a aparência exclusiva do sistema, o Samsung alternou o mapa, os marcadores e os controles entre as paletas clara e escura ao trocar o modo do Android. A configuração anterior do aparelho foi restaurada ao final.

Com o TalkBack ativo no Samsung, a captura confirmou o contorno de foco no cabeçalho Resultados ao abrir Ver lista. O serviço anterior de acessibilidade foi restaurado. A leitura em voz alta e a sequência completa de gestos permanecem sem validação.

No fim da rolagem do detalhe do chamado, a atribuição à Prefeitura do Rio e ao Data.Rio ficou legível. Salvar chamado e Acessar atendimento oficial continuaram visíveis no rodapé.

A captura em tema escuro mostrou separadamente a data de referência no Data.Rio (20/09/2026) e a data da versão registrada no Fiscaliza aí (20/10/2026) para o chamado de iluminação testado. O rodapé permaneceu acima da área de gestos.

Com o Wi-Fi desligado temporariamente no Samsung, a busca por asfalto mostrou Sem conexão no mapa e na lista. A tela informou que a busca aguardava a rede. Com dados já carregados, a captura mostrou o aviso correspondente. Após reativar o Wi-Fi, a consulta retomou automaticamente e exibiu o estado de zero resultados para asfalto. O recorte sem texto voltou a exibir 356 chamados.

Com a localização do Android desligada, Minha posição mostrou um aviso para escolher um bairro ou ligar o GPS. Santa Cruz permaneceu selecionada, com os marcadores e o cartão Ver lista de 356 chamados visíveis. A localização do sistema voltou ao estado anterior. A recusa da permissão do app é coberta por teste automatizado.

Na densidade equivalente a 320 dp de largura, cabeçalho, seletor Chamados/Serviços e cartão Ver lista ficaram legíveis. Alterar a densidade no APK anterior reproduziu o aviso de linking e cobriu parte da barra de abas. O manifesto gerado na revisão inclui `density` junto de `fontScale` nas mudanças tratadas pela tela principal.

O endpoint de saúde configurado no app respondeu HTTP 200 durante a revisão.

O APK recompilado foi instalado com os dados preservados. Ao repetir a mudança para 320 dp, o mesmo processo e a mesma janela continuaram ativos. A captura mostrou mapa, resultados e as quatro abas. Os logs do processo não apontaram os avisos de linking ou de dependências do Reanimated durante a verificação. A densidade original foi restaurada.

Em Agir, a captura a 320 dp mostrou a ação principal inteira acima das abas. Em Salvos, o seletor compacto trouxe a primeira ficha para mais perto do topo. Aberto em 320 dp, o painel mostrou Todos, Em aberto e Encerrados inteiros e acima da área de gestos.

Em Perfil sem conta, Meu CEP abriu com fonte a 135%. O painel ocupou a altura do conteúdo e a ação de acesso à conta ficou inteira acima da área de gestos. A fonte do aparelho foi restaurada. A consulta autenticada requer uma conta e não foi exercitada no Samsung.

Um link de teste com rota inexistente abriu Página indisponível. A captura em tema escuro mostrou Abrir o mapa acima da área de gestos. O toque voltou a Explorar, com o mapa e 356 chamados no recorte de Santa Cruz.

Em Agir, Buscar pelo protocolo abriu o campo no mapa. O número 24002858 retornou um único chamado, Reparo de cabo de iluminação pública. A lista abriu sem o teclado e o detalhe mostrou o mesmo protocolo. Depois do ajuste de altura, o mapa passou de 2340 para 1431 px com o teclado aberto e voltou para 2340 px ao fechar a busca. O retorno também manteve a altura integral ao percorrer Agir, lista e detalhe.

Em Pedir um serviço, o montador manteve o campo Detalhes visível durante a digitação. A prévia incluiu assunto, local e o texto temporário. A captura em tema escuro mostrou Abrir WhatsApp do 1746 com a cor primária do design system, abaixo da opção de compartilhar. Nenhum canal externo foi aberto e nenhuma mensagem foi enviada.

### Catálogo de serviços em largura compacta

No Samsung SM-S901E, em tema claro e largura simulada de 320 dp, o caminho Agir → Pedir um serviço → Encontrar serviços por assunto abriu o catálogo. A captura mostrou o título inteiro em duas linhas e as descrições dos primeiros assuntos acomodadas em múltiplas linhas, com a seta alinhada à linha de ação. A densidade original de 480 dpi foi restaurada. A abertura dos canais externos ficou fora dessa verificação.

A captura seguinte confirmou que o catálogo avisa sobre a abertura do portal oficial antes da lista. A árvore nativa expôs título e descrição de cada serviço juntos. A ação de iluminação abriu Reparo de luminária no portal 1746, sem enviar uma solicitação. Com TalkBack ativo, o contorno confirmou foco em Voltar. Os gestos via ADB não confirmaram a sequência de foco depois desse botão nem a leitura falada. O serviço anterior de acessibilidade foi restaurado.

### Cadastro e CEP com conta

Na revisão do rodapé de Sua cidade, a captura mostrou Buscar minha cidade inteiro acima do teclado numérico, com o CEP preenchido e visível. O toque consultou o CEP e fechou o teclado. No resultado, Confirmar cidade ocupou o rodapé acima da área de gestos. A API isolada recebeu a confirmação e o logout. A sessão de teste foi encerrada e o redirecionamento do Metro voltou à porta original.

No Samsung, a versão de desenvolvimento usou uma API Docker isolada por USB. O cadastro com dados sintéticos abriu a etapa Sua cidade. O CEP público 20040-002 retornou Rio de Janeiro e, após a confirmação, apareceu no perfil associado ao Centro. A captura de Meu CEP mostrou o campo preenchido e a ação Consultar CEP acima da área de gestos. A consulta exibiu Centro, Avenida Rio Branco e a ação Confirmar este CEP. O teste encerrou a sessão local, confirmou a chamada de logout e restaurou a conexão original do Samsung.


### Busca vazia no mapa

Com um termo sem correspondência, a captura no Samsung mostrou o mapa sem marcadores e o cartão acima do teclado. A árvore nativa confirmou Ver lista · 0 chamados e a orientação Tente outro termo, área ou filtro. O termo de teste foi removido ao final.


### Indicadores de Santa Cruz

No Samsung, a busca por Santa Cruz encontrou a opção com o teclado aberto. A captura dos indicadores mostrou 88 escolas, 19 unidades de saúde e 78 espaços públicos em uma lista, com Chamados do 1746 visível na mesma tela. Ver fontes dos serviços revelou datas de importação e referências. O toque em Escolas abriu Serviços no mapa de Santa Cruz e o painel informou 88 resultados.


Em Indicadores do bairro, a consulta de Santa Cruz de 14/09/2026 a 20/09/2026 mostrou 609 chamados. O primeiro toque em Ver chamados deste período abriu o mapa com somente os 356 abertos. Após ajustar o filtro da rota, a repetição do recorte no Samsung exibiu os mesmos 609 chamados no mapa.


Ao consultar outro intervalo de Santa Cruz (15/09/2026 a 19/09/2026), o Samsung manteve os dois campos e Consultar período nas mesmas coordenadas antes e depois da resposta. A captura confirmou o novo período e os assuntos atualizados abaixo do formulário.


### Avisos na execução atual

Em Indicadores do bairro, a árvore do Samsung não exibiu o aviso da LogBox e o log ReactNativeJS filtrado pelo processo atual não apresentou linking, Bottom Sheet ou Reanimated. A compilação do Metro ainda emite um aviso sobre um caminho interno do Expo Router importado opcionalmente pelo Sentry. A leitura do pacote instalado confirmou a origem no módulo expoRouterStore.js. O aviso aparece no terminal e o bundle Android terminou de compilar.


Depois de filtrar Abertos no mapa (356 chamados), reabrir o mesmo recorte de Santa Cruz com uma nova solicitação de navegação recuperou os 609 chamados do período. O filtro manual continua aplicável enquanto a pessoa permanece no mapa.


Em Preferências, a captura no Samsung confirmou as seções Bairro de referência, Notificações e Dados neste celular, sem seletor de tema. Após o ajuste do estado vazio, a árvore nativa mostrou Chamados salvos e Nenhum chamado salvo neste celular como texto sem ação.


As capturas finais de Preferências em claro e escuro confirmaram a troca automática de superfícies, ícones, texto e barra de status. Chamados salvos manteve a apresentação neutra nos dois temas. O Samsung voltou ao modo claro que usava antes do teste.


A repetição da apresentação no Samsung confirmou as três etapas em ordem. A primeira apresentou o Fiscaliza aí e citou os chamados do 1746. A segunda explicou a Central. A terceira apresentou Salvos e Agir. Nas capturas, cada etapa manteve a ação principal acima da área de gestos. O bloqueio da primeira abertura é verificado separadamente pelo componente OnboardingGate e pelos testes de persistência e navegação.


Com o TalkBack ativo, o Samsung destacou a descrição da primeira etapa da apresentação. Os gestos injetados por ADB não confirmaram a ordem completa nem o áudio. O serviço de acessibilidade anterior foi restaurado.

