import type { CivicItem, Occurrence } from '../../shared/contracts.js';

type Copy = {
  title?: string;
  description?: string;
  summary?: string;
  body?: string;
  sector?: string;
};
/** Editorial content for controlled scenarios; never changes lifecycle or participation. */
export const exampleContent: Record<string, Copy> = {
  'occ-iluminacao-centro': {
    description:
      'Dois postes estão apagados junto à parada de ônibus da Praça Central, no Centro. A iluminação insuficiente dificulta enxergar o piso e a aproximação de veículos durante a espera e a travessia à noite. O pedido é verificar as luminárias e restabelecer a iluminação do trecho.',
  },
  'occ-pavimento-assembleia': {
    description:
      'Na Rua da Assembleia, próximo à Rua do Carmo, o revestimento está quebrado junto à passagem de pedestres. Ciclistas precisam desviar para o fluxo dos carros, e pessoas atravessando encontram um piso irregular. O trecho precisa de vistoria e recomposição do pavimento, preservando a travessia durante o reparo.',
  },
  'occ-coleta-uruguaiana': {
    description:
      'Sacos de lixo permanecem na calçada da Rua Uruguaiana, próximo à Rua Sete de Setembro, após o horário habitual de coleta. O acúmulo ocupa a faixa de circulação e obriga pedestres a contornar os resíduos. É necessário verificar o recolhimento e orientar o descarte no trecho comercial.',
    sector: 'Limpeza urbana',
  },
  'occ-calcada-sete': {
    description:
      'O piso da Rua Sete de Setembro, próximo à Avenida Passos, tem peças soltas e desníveis no caminho até a praça. O trecho dificulta a passagem de cadeiras de rodas e carrinhos e aumenta o risco de tropeço. O pedido é avaliar a extensão do dano e recompor uma faixa contínua de circulação.',
  },
  'occ-sinal-praca-xv': {
    description:
      'Na travessia da Praça XV com acesso à Rua Primeiro de Março, o tempo do sinal de pedestres termina antes de pessoas com mobilidade reduzida alcançarem a outra calçada. O relato pede uma avaliação do tempo semafórico e das condições de acessibilidade, considerando o fluxo de pedestres do local.',
    sector: 'Mobilidade urbana',
  },
  'occ-banco-campo': {
    title: 'Banco com tábua solta no Campo de Santana',
    description:
      'Um banco no acesso ao Campo de Santana pela Rua da Constituição apresenta uma tábua solta. A peça compromete o uso do assento por quem descansa no passeio. O relato solicitou a fixação ou substituição do elemento danificado; a conclusão e a avaliação do atendimento ficam registradas no histórico abaixo.',
    sector: 'Manutenção de espaços públicos',
  },
  'occ-luz-gloria': {
    description:
      'O caminho de pedestres da Rua da Glória, próximo ao acesso à estação, fica escuro no início da noite. A baixa visibilidade dificulta identificar desníveis e acompanhar a circulação no entorno. O pedido é verificar os pontos de iluminação desse acesso e registrar o encaminhamento ao setor responsável.',
  },
  'proposal-praca': {
    summary:
      'Criar pontos de descanso à sombra junto à parada de ônibus da Praça Central.',
    body: 'Pessoas idosas aguardam o ônibus em pé e encontram poucos lugares de descanso na Praça Central. A proposta é instalar bancos próximos às árvores e à parada, mantendo livre a circulação de cadeiras de rodas e carrinhos. A análise deve considerar sombra, conservação e o acesso ao transporte; a resposta da gestão informa o encaminhamento da ideia.',
  },
  'proposal-travessia': {
    summary:
      'Tornar contínuo e acessível o percurso entre a praça e a unidade de saúde.',
    body: 'O percurso entre a praça e a unidade de saúde tem desníveis que dificultam a circulação de cadeiras de rodas, carrinhos e pessoas com mobilidade reduzida. A proposta combina regularização do piso e rampas nas travessias, com faixa de passagem desobstruída. O encaminhamento foi vinculado à recuperação das calçadas, permitindo acompanhar a decisão e a execução no mesmo contexto.',
  },
  'proposal-travessia-praca-xv': {
    summary:
      'Revisar o tempo do sinal para permitir uma travessia mais confortável na Praça XV.',
    body: 'Moradores relatam dificuldade para concluir a travessia da Praça XV no tempo disponível. A proposta é avaliar o tempo semafórico nos horários de maior circulação, considerando pessoas idosas e com mobilidade reduzida. O registro de sinalização associado reúne as informações do problema; aqui a comunidade acompanha a análise da melhoria e o retorno da mobilidade urbana.',
  },
  'proposal-coleta-centro': {
    summary:
      'Organizar descarte e coleta sem ocupar a passagem de pedestres na Rua Uruguaiana.',
    body: 'O descarte no trecho comercial da Rua Uruguaiana ocupa a calçada e dificulta o recolhimento dos resíduos. A proposta é definir pontos de coleta e horários de colocação dos sacos em conjunto com os comerciantes. O objetivo é manter a faixa de circulação livre e facilitar o serviço de limpeza, usando o relato de acúmulo de lixo como referência para a avaliação.',
  },
  'proposal-descanso-campo': {
    summary:
      'Distribuir assentos junto à sombra e preservar a circulação no Campo de Santana.',
    body: 'Quem percorre o passeio do Campo de Santana precisa de lugares de descanso próximos às áreas de sombra. A proposta é avaliar a distribuição dos bancos, a conservação dos assentos e o espaço lateral para cadeiras de rodas e carrinhos. O reparo do banco já relatado ajuda a distinguir a manutenção imediata da melhoria do percurso como um todo.',
  },
  'proposal-caminho-gloria': {
    summary:
      'Melhorar a iluminação e a continuidade das calçadas no acesso à estação da Glória.',
    body: 'O percurso da Rua da Glória até a estação concentra deslocamentos no início da manhã e à noite. A proposta é avaliar a iluminação e a continuidade das calçadas, começando pelos pontos de menor visibilidade e pelos desníveis. O relato de falta de luz está associado à ideia para que o reparo pontual e a melhoria do trajeto possam ser acompanhados juntos.',
  },
  'consultation-praca': {
    summary:
      'Escolher a prioridade de intervenção na Praça Central entre iluminação, acessibilidade e convivência.',
    body: 'A gestão está organizando a sequência de intervenções na Praça Central. Escolha qual frente deve ser priorizada: iluminação do entorno, acessibilidade dos percursos ou área de convivência. A participação orienta a análise junto aos critérios de segurança e acesso; após o encerramento, o resultado e a justificativa da decisão ficam disponíveis nesta consulta.',
  },
  'consultation-entorno-escola': {
    summary:
      'Consulta sobre travessias, iluminação e acesso ao ônibus no entorno da escola.',
    body: 'Esta consulta foi aberta para identificar prioridades de circulação no horário de entrada e saída da escola: travessias seguras, iluminação ou ponto de ônibus. O prazo de participação terminou. A devolutiva abaixo registra o resultado efetivo e o encaminhamento informado pela equipe, sem antecipar uma intervenção ainda não decidida.',
  },
  'action-calcadas': {
    summary:
      'Regularizar o piso e as travessias no percurso entre a praça e a unidade de saúde.',
    body: 'A ação reúne os reparos de calçada no percurso entre a praça e a unidade de saúde, a partir da proposta de travessia acessível. A equipe está corrigindo desníveis e recompondo o piso por trechos, mantendo o acesso aos serviços durante os trabalhos. O percentual, a previsão e as atualizações abaixo permitem conferir o andamento e as evidências da execução.',
  },
};

export function withExampleContent<T extends Occurrence | CivicItem>(
  item: T,
): T {
  return { ...item, ...exampleContent[item.id] };
}
