# Jornada cidadã sem login

Status: proposta para revisão; sem implementação nesta etapa.
Data: 20/10/2026.

## Objetivo

Permitir descobrir o entorno, fiscalizar informações publicadas e encontrar como agir sem cadastro. Salvos, região e aparência pertencem à instalação/navegador. A identidade visual existente continua: Instrument Sans, superfícies neutras, controles arredondados, modo escuro e drawer.

O cidadão não precisa fornecer nome, e-mail, foto, CEP ou localização para consultar informações e salvar chamados. O recorte disponível continua sendo o município do Rio de Janeiro. A autenticação da gestão permanece separada e obrigatória.

## Diagnóstico no checkout

- `app/_layout.tsx` já libera Home, Território, chamados e equipamentos, mas aguarda inicialização de sessão e não inclui `SettingsScreen` entre as rotas públicas.
- `stores/followStore.ts` conserva objetos `OfficialCall` apenas em memória. Os salvos não sobrevivem ao reinício.
- `stores/territoryStore.ts` depende da sessão e não persiste a região. Onboarding e aparência já usam AsyncStorage independentemente da conta.
- A Home prioriza panorama numérico e bairros com mais chamados. O detalhe já oferece salvar e acessar o portal oficial.
- Acompanhar começa na consulta geral de chamados abertos; a atualização por gesto não atualiza os salvos.
- Menu e cabeçalho ainda têm identidade de usuário, atalhos de perfil e login. Participar conserva uma jornada legada de contribuições vinculadas à sessão.

## Alternativas e escolha recomendada

1. **Experiência cidadã local, sem conta:** menor atrito e coerência com as capacidades atuais. Perde sincronização entre aparelhos. Recomendada.
2. **Conta opcional desde já:** permitiria futura sincronização, mas mantém duas experiências, conflitos de dados e complexidade sem benefício entregue.
3. **Conta obrigatória:** adequada a operações que exigem identidade, porém desnecessária para leitura pública e favoritos locais.

Adotar a primeira alternativa. Preservar dados e serviços autenticados existentes; nenhuma conta ou registro será apagado. Publicações futuras, comentários, votos e integrações de atendimento terão decisão própria de identidade e autorização. Armazenamento local não autentica essas operações.

## Navegação proposta

| Área | Tarefa principal | Conteúdo e ação |
| --- | --- | --- |
| Início | Escolher por onde começar | Região, busca, explorar, retomar salvos, demandas recentes e acesso ao atendimento |
| Explorar | Encontrar uma demanda ou serviço | Mapa/lista equivalentes, filtros, demandas por padrão e camadas opcionais |
| Acompanhar | Retomar escolhas pessoais | Somente chamados salvos, filtros Todos/Em aberto/Encerrados no 1746 |
| Agir | Encontrar como solicitar atendimento | Orientações curtas e caminhos oficiais verificados, sem formulário interno de chamado |

As quatro abas preservam a barra flutuante e seus rótulos acessíveis. Detalhes, equipamentos, bairro, preferências, ajuda e onboarding são rotas públicas. Rotas legadas de escrita continuam protegidas e saem da navegação cidadã principal; links antigos não devem liberar mutações nem cair em loops de redirecionamento.

## Primeira abertura e região

Reaproveitar as ilustrações SVG locais no onboarding: descobrir no mapa, acompanhar salvos e acessar atendimento oficial. Permitir pular e reabrir pelo menu. Evitar slides sobre infraestrutura ou catálogos de dados.

Depois, abrir a Home no município inteiro, sem solicitar permissões. Oferecer seleção opcional de bairro canônico. Separar “Minha região”, persistida, do filtro temporário de exploração; alterar um filtro não redefine o bairro preferido. O bairro preferido aparece como atalho junto ao município. CEP e GPS não são obrigatórios neste ciclo.

“Perto de mim” só pode usar distância quando houver uma localização válida, solicitada por ação explícita, com alternativa em caso de recusa. Sem isso, usar “Explorar minha região”.

## Home

Ordem de leitura:

1. Cabeçalho com região e controle de menu acessível, sem avatar fictício ou saudação nominal obrigatória.
2. Busca que abre Explorar, mantendo o texto/recorte esperado.
3. Acesso principal “Explorar minha região”.
4. Até três salvos recentes, quando existirem, com acesso a Acompanhar.
5. Pequena seleção de demandas recentes do recorte, com situação e referência temporal; acesso à lista completa.
6. “Precisa solicitar um serviço?” leva a Agir.

Retirar panorama numérico e comparação de bairros da composição principal, mantendo aprofundamentos no menu. Não preencher a ausência de salvos com dados inventados. Separar erro de consulta, base sem publicação e resultado vazio.

## Explorar e detalhes

Preservar debounce, cancelamento, consultas apenas nas telas ativas, mapa incremental e lista virtualizada. Mapa e lista compartilham filtros; voltar do detalhe conserva busca, camadas e posição de leitura. Serviços públicos são opcionais e possuem fichas próprias de endereço e contato.

No chamado: problema e local primeiro; depois situação publicada, protocolo, datas e prazo quando disponíveis. Usar “Encerrado no 1746”, sem representar confirmação de solução. Situação e idade do registro não permitem inferir atraso sem um prazo publicado.

Oferecer “Salvar para acompanhar” e “Acessar atendimento oficial” como ações distintas. Ao sair para o 1746, explicar apenas que o atendimento ocorre no canal oficial. Validar os destinos antes de publicar; não inventar links de serviço ou transmitir automaticamente dados do usuário. Falha ao abrir o canal oferece nova tentativa e alternativa de copiar o endereço verificado.

Um resultado vazio informa ausência no recorte sincronizado e oferece ajustar filtros ou ir a Agir. Nunca afirma que não há problemas ou chamados na região.

## Salvos locais e atualização

Usar o AsyncStorage já instalado como interface de persistência em Android/iOS/web; no navegador, os dados ficam no armazenamento da origem. Não criar banco de usuários anônimos, identificador de rastreamento ou dependência nova para favoritos.

Persistir um documento versionado com chave do aplicativo, fonte e município. Cada salvo contém identificador estável, data de salvamento, resumo mínimo e data da última consulta bem-sucedida. Resumo é cache de leitura; a API continua sendo a autoridade do estado publicado. Não armazenar anexos, credenciais ou objetos completos desnecessários.

- Hidratar uma vez, validar formato e deduplicar IDs antes de exibir o contador definitivo. Leituras tardias não sobrescrevem ações recentes.
- Serializar gravações para impedir que salvar/remover rapidamente ressuscite dados antigos. Falha de escrita deve aparecer e permitir tentar novamente; não afirmar persistência concluída.
- Aproveitar salvos ainda presentes em memória na atualização da sessão atual. Itens perdidos antes desta mudança não podem ser recuperados automaticamente.
- Salvar/remover sem internet é possível quando o resumo já está disponível. Marcar o resumo offline como última informação consultada; dados locais não tornam o mapa e todo o catálogo disponíveis offline.
- Ao entrar em Acompanhar e ao arrastar para atualizar, buscar novamente apenas os IDs salvos, com concorrência limitada, cache e cancelamento. Não importar a lista municipal inteira nem iniciar polling contínuo.
- Em erro ou registro indisponível, manter o salvo e a última informação, diferenciando indisponibilidade de remoção. Nova resposta atualiza o resumo, nunca a ordem/data de salvamento.
- Não aplicar o filtro global do bairro aos salvos silenciosamente. Filtros próprios mostram claramente o que está oculto.

## Menu e preferências

Trocar a área de perfil por “Minha região”. Exibir região, aparência, dados deste aparelho, como funciona, ajuda, fontes e sobre. Resultados estatísticos ficam em aprofundamento secundário. Manter gesto do drawer e controle visível para teclado, leitor de tela e usuários que não descobrem o gesto.

Remover login, cadastro e sair do fluxo cidadão principal. Administração não migra para acesso anônimo. Não remover APIs, credenciais ou dados existentes como efeito colateral do redesenho.

Em preferências, explicar uma vez: “Seus salvos ficam neste aparelho e não são sincronizados”. Navegadores/origens diferentes não compartilham os dados; limpar dados do aplicativo ou site pode removê-los. Oferecer “Apagar salvos deste aparelho” em drawer de confirmação, sem apagar outras preferências implicitamente. Exportação, importação e sincronização ficam para outra entrega.

## Sequência de entregas revisáveis

1. **Base pública e persistência:** separar inicialização cidadã da sessão, liberar preferências, persistir salvos/região e preservar autenticação administrativa. Verificar reinício, erro de armazenamento e navegação por links.
2. **Home e menu:** nova hierarquia, identidade sem conta e acesso a salvos/região. Reusar componentes e temas existentes.
3. **Acompanhar e detalhe:** lista pessoal como padrão, atualização real dos resumos, estados offline e ações claras de salvar/atendimento.
4. **Agir e onboarding:** substituir os atalhos legados de Participar por caminhos oficiais verificados e explicar a experiência com os SVGs locais.
5. **Consolidação de Explorar:** retorno ao recorte, vazios acionáveis, equivalência mapa/lista e revisão responsiva.

Executar tarefa por tarefa, com commits por responsabilidade. Um plano de implementação com passos e testes por arquivo deve ser escrito depois da revisão desta proposta.

## Critérios de validação

- Instalação sem sessão abre onboarding/Home; nenhuma jornada pública exige login ou consulta `/auth/me` para poder aparecer.
- Salvar, fechar e reabrir preserva os itens; remoção rápida, hidratação lenta, armazenamento inválido e escrita recusada não silenciam perda de dados.
- Uma pessoa encontra um chamado, interpreta a situação, salva e reencontra sem gráfico, conta ou GPS.
- Sem rede, os resumos salvos continuam legíveis com indicação de desatualização; atualizar não apaga os itens em caso de falha.
- Login administrativo e autorizações de escrita continuam funcionando; nenhuma rota de mutação é tornada pública.
- Menu, modo escuro, texto ampliado, teclado, retorno de links externos e pull-to-refresh são verificados no cidadão web e em dispositivo com Expo Go.
- Medir chamadas de rede e comportamento das telas inativas para evitar regressão dos filtros. Registrar separadamente testes automatizados, evidência web e inspeção nativa.

## Fora deste ciclo

Novas fontes, dashboards, IA, notificações push, abertura integrada no 1746, participação comunitária anônima, sincronização entre aparelhos e exclusão do backend de contas. O foco é completar a jornada com as capacidades existentes.
