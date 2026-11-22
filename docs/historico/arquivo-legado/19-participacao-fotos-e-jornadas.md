# Participação, fotos e jornadas

## Escopo implementado

- Mais seis ocorrências e quatro propostas no seed, com território e histórico coerentes. Fotos distintas para os treze registros controlados; fontes e hashes em `backend/data/demo-media/`.
- Visualização única por conta, persistida e idempotente. Visualizar não cria acompanhamento nem participação. Apoios continuam atribuíveis e reversíveis.
- Números de apresentação persistem em `demo_engagement`, separados das relações reais. O seed preserva registros e anexos, atualizando apenas fotos ilustrativas dos exemplos controlados.
- Foto obrigatória na ocorrência, validada no formulário e na API. Anexo precisa pertencer ao autor e município. Proposta mantém foto opcional.
- Cadastro Relato → Local → Revisão; localização precisa também disponível para propostas. Mapas recebem contêiner de recorte arredondado.
- Avatar abre o menu; câmera inicia captura e relato. Carrosséis com bordas livres, controles e ocorrências próximas por distância.
- Nota inteira de 1 a 5, comentário opcional e um encerramento por atendimento. Registro avaliado deixa a Home do autor e pode ser reaberto pelo histórico do perfil. Continua disponível no território.
- Cards e detalhes próprios: evidência e atendimento; ideia e decisão; cédula e resultado; execução e evidências.

## Upload no Expo Go

O conversor do Expo rejeita o descritor legado `{uri,name,type}` em `expo/fetch`. A tentativa seguinte com `File` encontrou construtor indisponível no aparelho. O caminho nativo usa agora `expo-file-system/legacy.createUploadTask`, com multipart, autenticação, cancelamento por tempo e o mesmo envelope de resposta. Web usa Blob/FormData.

Os testes executam a função de produção sem os construtores File/FormData para conferir esse contrato. Isso não substitui envio no aparelho; a confirmação do usuário continua pendente.

## Operação

Aplicar migrações antes de iniciar a API; executar seed sem reset para acrescentar exemplos. As migrações 0004/0005 adicionam views e contagens de apresentação. O preenchimento das ocorrências antigas sem imagem nas bases locais foi feito pontualmente, preservando os demais campos. Não aplicar substituição genérica de fotos a registros reais.

Validação e capturas locais ficam em `.validation/`. Não publicar tokens, bancos ou artefatos de sessão. Alterações simultâneas de documentação e painel de outra sessão foram preservadas; os commits incluem somente os trechos desta tarefa.

## Evidência executada

- `npm test`: 30 testes de domínio e 5 de transporte aprovados.
- API/PostgreSQL: suíte completa com 28 testes aprovada, incluindo fotos autorizadas, identidade da conta e conteúdo dos exemplos.
- Postman CLI: 35 requests e 78 assertions, sem falhas, contra base isolada.
- TypeScript, ESLint e exportações web/Android conferidos durante a implementação. O último ajuste de ordem do formulário e filtro municipal recebeu nova checagem.
- Banco local: fotos das ocorrências existentes responderam HTTP 200, inclusive os quatro registros antigos concluídos preenchidos pontualmente. Contagens antigas de apresentação foram preenchidas sem modificar relações reais.

## Ajustes seguintes

- Filtro inicial municipal, seguido pelo bairro do CEP. Navegação compacta: largura 228, altura 60, círculos de 52 e intervalos/folgas de 4.
- Identidade atual da conta: Beatriz Arantes, `beatrizarante@gmail.com`; senha e identificador interno preservados.
- Os textos dos exemplos agora distinguem resumo, contexto e encaminhamento; nenhuma edição de texto substituiu decisões ou históricos.
- O serviço de IA passou a aceitar uma foto autorizada, normalizada no servidor. Foto antes do texto inicia análise; foto posterior ao texto exibe botão circular. Respostas tardias preservam edições do usuário. Falta de chave não produz análise visual fictícia.
- Suíte completa da API atualizada: 28 testes aprovados. Simulação HTTP do GenerateContent validou análise estruturada e falha 503; o modelo externo real e a captura nativa ainda dependem de validação/configuração no aparelho e ambiente.
- Inspeção web confirmou avaliação → remoção da Home → histórico, voto da consulta, progresso da ação e upload com falha seguida de recuperação. Os dois caminhos do botão de IA e a preservação de edição durante análise foram conferidos com respostas simuladas.

- Checagem final de interface: filtro municipal selecionado com bairro do CEP em seguida, quatro abas com círculos de 52 e gap de 4, marca completa em largura 320 e saudação de Beatriz. Capturas em `.validation/final-compact-navigation.png` e `.validation/final-full-brand-menu-320.png`.
