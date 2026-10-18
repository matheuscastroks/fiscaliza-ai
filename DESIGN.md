# Fiscaliza-AI — Interface cívica e territorial

## Direção
Modo Operate. A interface responde a tarefas do cidadão e do servidor, com comportamento familiar de aplicativo. Sem hero publicitário, gradientes cosméticos, glassmorphism, placares competitivos ou mosaico decorativo de KPIs.

## Identidade
Base clara #FAFAF8, superfícies #FFFFFF, texto #18232A, secundário #4E5A61, discreto #56656D e ação #176287. Risco #9E3431, atendimento #835916 e conclusão #236B50. Recebimento não significa risco. Tipografia nativa do aparelho; tema compartilhado em theme/. Texto de conteúdo segue escala do sistema. Nesta entrega a aparência é clara; não prometer tema escuro sem tokens e QA correspondentes.

## Arquitetura de informação
- Primeiro acesso: CEP → município/UF encontrados → confirmação. Sem cadastro de endereço completo ou anúncio de vínculo institucional. Perfil permite atualizar o CEP e mantém histórico das cidades anteriores separado das interações atuais.
- Início: minhas atualizações, consultas abertas, ações no território e resultados.
- Território: busca, bairros/endereço, situação, mapa nativo e lista alternativa. Consultas/propostas/ações são filtradas pelo bairro, sem coordenadas fictícias.
- Participar: registrar ocorrência, propor melhoria, responder consulta.
- Acompanhar: autoria, apoios, itens seguidos e consultas respondidas.
- Menu: perfil, município/bairros, resultados, ajuda, preferências, Sobre.
- Gestão web: fila, propostas, consultas, ações e território; detalhe com ação e justificativa explícitas.

## Hierarquia
Listas com separadores, situação textual, local e data. Uma ação dominante por tarefa. Respostas institucionais e evidências têm precedência sobre contagens de popularidade. Fotos são conteúdo, não decoração.

## Estados e acessibilidade
Cada consulta remota apresenta carregamento, erro com recuperação, vazio e conteúdo. Falhas de atualização preservam conteúdo e formulários. Mínimos: 48dp Android, 44pt iOS; texto normal ≥4,5:1; foco visível no painel, rótulos, ordem de leitura, teclado e movimento reduzido. Nunca adicionar entering em Marker.

## Copy
Preferir ações concretas: Registrar ocorrência, Propor melhoria, Acompanhar, Resposta da gestão, Solicitar revisão. Não repetir demo, mock, simulação ou detalhes de banco nas tarefas. Informações sobre esta versão ficam em Sobre. Não alegar notificação em tempo real, integração oficial ou análise de foto indisponível.

## Wireframes de referência
Início: cabeçalho territorial → ação explorar → acompanhamentos → consultas abertas → ações/resultados.
Detalhe: situação/título/local → descrição/evidência → respostas e atendimento → acompanhar/apoio → avaliação → complementos.
Gestão: navegação lateral → busca/filtros/fila → detalhe/histórico → ação com justificativa → confirmação.

## Verificação
Inspecionar todas as telas em dispositivos suportados, fonte ampliada e teclado aberto. Inspeção web cobre apenas web. Medir desempenho em release antes de declarar otimização.

## Consolidação territorial
O seletor de bairro é comum às jornadas. Marcadores distinguem tipos de conteúdo e exigem localização explícita; iniciativas sem ponto permanecem na lista. Abrangência municipal nunca é apresentada como bairro. Destaques da Home usam situação, resposta, prazo e resultado reais, com ação específica e hierarquia proporcional à tarefa. Ausência de novidade não gera urgência artificial.
