import { eq } from 'drizzle-orm';
import { officialRio } from './municipality.js';
import { hashPassword } from './auth.js';
import { users, records, attachments, municipalities } from './schema.js';
import type { Database } from './db.js';
import type { Occurrence, CivicItem } from '../../shared/contracts.js';
export async function seed(
  db: Database,
  reset = false,
  scenario: 'registered' | 'in_progress' | 'resolved' = 'registered',
  municipalityId = '3304557',
) {
  if (municipalityId !== '3304557')
    throw Object.assign(
      new Error(
        'Cenarios de apresentacao disponiveis apenas para Rio de Janeiro.',
      ),
      { statusCode: 409 },
    );
  const rio = await officialRio();
  const password =
    process.env.DEMO_PASSWORD ||
    (process.env.NODE_ENV === 'production' ? null : 'Fiscaliza123!');
  if (!password)
    throw new Error('DEMO_PASSWORD must be explicitly set in production.');
  const passwordHash = await hashPassword(password);
  const at = new Date().toISOString();
  await db.transaction(async (tx) => {
    await tx.insert(municipalities).values(rio).onConflictDoNothing();
    for (const u of [
      {
        id: 'citizen-ana',
        name: 'Ana Souza',
        email: 'ana@vilaesperanca.exemplo',
        role: 'citizen' as const,
      },
      {
        id: 'staff-gestao',
        name: 'Equipe de Gestão',
        email: 'gestao@vilaesperanca.exemplo',
        role: 'staff' as const,
      },
      {
        id: 'admin-local',
        name: 'Administração',
        email: 'admin@vilaesperanca.exemplo',
        role: 'admin' as const,
      },
    ])
      await tx
        .insert(users)
        .values({
          ...u,
          passwordHash,
          municipalityId: u.role === 'citizen' ? null : '3304557',
        })
        .onConflictDoNothing();
    await tx.execute(
      (await import('drizzle-orm'))
        .sql`UPDATE users SET municipality_id='3304557' WHERE id IN ('staff-gestao','admin-local') AND role IN ('staff','admin') AND municipality_id IS NULL`,
    );
    if (reset) {
      await tx
        .delete(records)
        .where(eq(records.municipalityId, municipalityId));
      await tx
        .delete(attachments)
        .where(eq(attachments.municipalityId, municipalityId));
    }
    const occurrence: Occurrence = {
      id: 'occ-iluminacao-centro',
      municipalityId,
      title: 'Iluminação apagada na praça',
      description:
        'Dois postes estão apagados junto à parada de ônibus da Praça Central.',
      category: 'lighting',
      status: 'pending',
      priority: 'medium',
      location: {
        latitude: -22.904,
        longitude: -43.186,
        address: 'Praça Central',
        neighborhood: 'Centro',
      },
      images: [],
      reportedBy: 'citizen-ana',
      reportedAt: at,
      votes: 0,
      comments: [],
      statusHistory: [
        {
          status: 'pending',
          source: 'citizen',
          at,
          justification: 'Relato recebido.',
          actor: 'Ana Souza',
        },
      ],
    };
    if (scenario !== 'registered') {
      occurrence.status = 'in_progress';
      occurrence.sector = 'Iluminação pública';
      occurrence.statusHistory.push({
        status: 'in_progress',
        source: 'management',
        at,
        justification: 'Equipe de iluminação designada para inspeção.',
        actor: 'Equipe de Gestão',
      });
    }
    if (scenario === 'resolved') {
      occurrence.status = 'resolved';
      occurrence.resolvedAt = at;
      occurrence.statusHistory.push({
        status: 'resolved',
        source: 'management',
        at,
        justification: 'Iluminação restabelecida e vistoriada.',
        actor: 'Equipe de Gestão',
      });
    }
    const base = {
      municipalityId,
      summary: 'Participação dos moradores sobre o território.',
      body: 'Registro público para acompanhamento e participação dos moradores do Rio de Janeiro.',
      neighborhood: 'Centro',
      territory: { scope: 'neighborhood' as const, neighborhood: 'Centro' },
      createdBy: 'staff-gestao',
      createdAt: at,
      responsible: 'Secretaria de Serviços Urbanos',
      comments: [],
      supports: 0,
      linkedIds: [occurrence.id],
    };
    // The two plaza records explicitly link to this occurrence at the same plaza.
    const plazaLocation = {
      latitude: occurrence.location.latitude,
      longitude: occurrence.location.longitude,
      address: occurrence.location.address,
    };
    const civic: CivicItem[] = [
      {
        ...base,
        territory: { scope: 'location', neighborhood: 'Centro', location: plazaLocation },
        id: 'proposal-praca',
        kind: 'proposal',
        title: 'Mais bancos na praça central',
        summary:
          'Moradores pedem assentos próximos à sombra e à parada de ônibus.',
        body: 'Pessoas idosas aguardam o ônibus em pé. A proposta é instalar bancos junto às árvores, mantendo a faixa livre de circulação.',
        createdBy: 'citizen-ana',
        status: 'under_review',
        history: [
          {
            at,
            actor: 'Equipe de Gestão',
            from: 'submitted',
            to: 'under_review',
            text: 'Equipe verificará circulação acessível e locais de instalação.',
          },
        ],
      },
      {
        ...base,
        territory: { scope: 'location', neighborhood: 'Centro', location: plazaLocation },
        id: 'consultation-praca',
        kind: 'consultation',
        title: 'Qual melhoria deve começar na praça?',
        summary:
          'Escolha o primeiro trecho a receber melhorias de uso e circulação.',
        body: 'A gestão está organizando as intervenções da Praça Central. Sua resposta ajudará a definir a sequência de execução; acessibilidade e segurança serão consideradas na decisão final.',
        status: 'open',
        closesAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        options: ['Iluminação', 'Acessibilidade', 'Área de convivência'],
        answerCounts: [0, 0, 0],
      },
      {
        ...base,
        id: 'action-calcadas',
        kind: 'action',
        title: 'Recuperação das calçadas do Centro',
        summary: 'Reparo dos trechos entre a praça e a unidade de saúde.',
        body: 'A equipe está corrigindo desníveis e recompondo o piso nas travessias. O trabalho será executado por trechos para manter o acesso aos serviços.',
        linkedIds: ['proposal-travessia'],
        status: 'in_progress',
        progress: 35,
        dueAt: new Date(Date.now() + 45 * 86400000).toISOString(),
        evidence: [],
        updates: [
          {
            at,
            text: 'Levantamento dos trechos concluído. Primeiro trecho em reparo.',
            actor: 'Equipe de Gestão',
          },
        ],
      },
      {
        ...base,
        id: 'proposal-travessia',
        kind: 'proposal',
        title: 'Travessia acessível até a unidade de saúde',
        summary:
          'Conectar a praça à unidade de saúde com calçada regular e rampas.',
        body: 'O caminho atual tem desníveis que dificultam a passagem de cadeiras de rodas e carrinhos de bebê. Propomos priorizar as travessias desse percurso.',
        createdBy: 'citizen-ana',
        linkedIds: ['action-calcadas'],
        status: 'accepted',
        decision:
          'Proposta acolhida. O percurso foi incluído na recuperação das calçadas, com execução acompanhada na ação vinculada.',
        history: [
          {
            at,
            actor: 'Equipe de Gestão',
            from: 'under_review',
            to: 'accepted',
            text: 'Percurso incluído na recuperação de calçadas por atender acesso a serviço de saúde.',
          },
        ],
      },
      {
        ...base,
        id: 'consultation-entorno-escola',
        kind: 'consultation',
        title: 'Como melhorar o entorno da escola?',
        summary:
          'Consulta encerrada com encaminhamento para vistoria das travessias.',
        body: 'A consulta reuniu necessidades de circulação no horário de entrada e saída da escola. O resultado informa o próximo levantamento da equipe de mobilidade.',
        linkedIds: [],
        status: 'closed',
        closesAt: new Date(Date.now() - 86400000).toISOString(),
        options: ['Travessias seguras', 'Iluminação', 'Ponto de ônibus'],
        answerCounts: [0, 0, 0],
        result:
          'Nenhuma resposta foi registrada nesta consulta. A equipe realizará escuta presencial e vistoria antes de definir a intervenção.',
        history: [
          {
            at,
            actor: 'Equipe de Gestão',
            from: 'open',
            to: 'closed',
            text: 'Prazo encerrado sem respostas; escuta presencial e vistoria serão realizadas.',
          },
        ],
      },
    ];
    await tx
      .insert(records)
      .values({
        id: occurrence.id,
        municipalityId,
        kind: 'occurrence',
        authorId: occurrence.reportedBy,
        data: occurrence,
      })
      .onConflictDoNothing();
    for (const item of civic)
      await tx
        .insert(records)
        .values({
          id: item.id,
          municipalityId,
          kind: item.kind,
          authorId: item.createdBy,
          data: item,
        })
        .onConflictDoNothing();
  });
}
