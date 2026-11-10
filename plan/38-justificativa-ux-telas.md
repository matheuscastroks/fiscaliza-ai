# Justificativa de UX por tela

Diretriz (do usuário, 2026-11-10): ao projetar ou modificar interfaces, reduzir a carga cognitiva e a complexidade desnecessária. Identificar a tarefa principal de cada tela, priorizar conteúdos e ações, aplicar revelação progressiva e cortar o que não contribui. Não sacrificar acessibilidade, descoberta de funcionalidades nem eficiência de navegação só por minimalismo. Antes de implementar, justificar os elementos principais e identificar fontes de sobrecarga.

Teste de cada tela: onde estou? o que posso fazer aqui? para onde vou depois?

Este documento descreve o estado atual do código e o que foi observado no aparelho em 2026-11-10. Não é validação com usuários.

## Explorar (mapa)

- **Tarefa:** descobrir o que o 1746 publicou perto de mim e abrir um chamado.
- **Elementos justificados:** mapa (é a tarefa); recorte atual no topo (responde "onde estou"); busca (achar um chamado conhecido); botão de resultados na base (acesso à lista equivalente, necessário para acessibilidade e para chamados sem ponto); prévia do marcador (próximo passo); abas.
- **Revelação progressiva:** filtros ficam num sheet; a lista fica atrás do botão de resultados; o detalhe completo só abre ao tocar.
- **Fontes de sobrecarga:** o topo empilha menu, recorte, busca, filtros e uma faixa de chips (domínio, situação, filtros) mais o botão "Buscar nesta área"; na base há ainda dois controles de mapa e o botão de resultados. São cinco camadas de controle em volta do mapa.
- **Decisão pendente:** avaliar juntar os chips de domínio e situação dentro do sheet de filtros e deixar na faixa só o domínio. Não fiz isso sem validar em aparelho, porque a faixa de chips é o atalho mais usado de filtro.

## Salvos

- **Tarefa:** reencontrar os chamados que escolhi acompanhar e ver se mudaram.
- **Justificado:** contagem e atualização; filtro Todos/Em aberto/Encerrados; lista de `CallSummary`; aviso de que encerrado não prova resolução.
- **Sobrecarga:** aviso reduzido a uma linha (antes eram três). Resta o botão de atualização e a contagem, que dividem a mesma linha.

## Agir

- **Tarefa:** achar o canal oficial certo para o problema.
- **Ordem justificada:** 1) já existe chamado? (evita duplicar e é o caminho de menor esforço); 2) canais oficiais; 3) montador de mensagem recolhido (revelação progressiva); 4) serviços frequentes.
- **Sobrecarga cortada:** o cartão "Verifique o mapa" repetia o atalho do topo e saiu.

## Perfil

- **Tarefa:** conferir quem sou, meus números e chegar a configurações.
- **Justificado:** identidade, duas métricas que levam a Salvos e Lugares, domicílio (define o município), menu de cinco linhas.
- **Cortado:** últimos chamados salvos (duplicavam a aba Salvos) e as ações destrutivas, que foram para `AccountScreen`.

## Conta e privacidade

- **Tarefa:** sair ou apagar a conta. Decisão rara e irreversível, por isso isolada, com a ação destrutiva separada ("zona de risco") e confirmada em sheet.

## Dados do bairro

- **Tarefa:** entender como o 1746 está atendendo o recorte (prazos, desfechos, problemas frequentes).
- **Justificado:** o KPI de prazo agora responde a uma pergunta, mostra a base e a fonte; desfechos e problemas mais frequentes explicam o número.
- **Cortado:** lista de bairros (virou `NeighborhoodVolumeScreen`, sem numeração), bloco de transparência e citação regulatória não verificada, rankings de desempenho.
- **Sobrecarga que resta:** a tela ainda é longa (KPI de prazo, conclusão, total, desfechos, velocidade, problemas). Candidata a ser dividida em "Prazos" e "Tipos de problema" se a validação mostrar abandono no meio da rolagem.

## Preferências

- **Tarefa:** ajustar aparência, bairro de referência, alertas e apagar salvos.
- **Cortado:** bloco de acessibilidade sem função e com promessa não verificada.
- **Corrigido:** sem `projectId` do EAS os alertas não existem; a linha passa a dizer "Ainda não disponíveis nesta versão" e o botão não aparece.

## Onboarding

- **Tarefa:** em até duas telas, dizer o que o app faz e o que não faz. "Fechar" sempre visível; nada promete envio de ocorrência nem alertas automáticos.

## Detalhe do chamado

- **Tarefa:** entender situação e prazo e decidir salvar ou ir ao atendimento oficial. O botão "Acessar atendimento oficial" fica fixo no rodapé para não depender de rolagem; salvar usa o ícone de marcador em todo o app.
