import { cityExamples } from './city-examples.js';
import { eq, sql } from 'drizzle-orm';
import { officialRio } from './municipality.js';
import { hashPassword } from './auth.js';
import {
  users,
  records,
  attachments,
  municipalities,
  demoEngagement,
} from './schema.js';
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
        name: 'Beatriz Arantes',
        avatar: '/api/demo-media/avatar-ana.jpg',
        email: 'beatrizarante@gmail.com',
        role: 'citizen' as const,
      },
      {
        id: 'staff-gestao',
        name: 'Equipe de Gestão',
        avatar: '/api/demo-media/avatar-gestao.jpg',
        email: 'gestao@vilaesperanca.exemplo',
        role: 'staff' as const,
      },
      {
        id: 'admin-local',
        name: 'Administração',
        avatar: '/api/demo-media/avatar-admin.jpg',
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
    await tx.execute(sql`UPDATE users SET name='Beatriz Arantes', email='beatrizarante@gmail.com' WHERE id='citizen-ana' AND email='ana@vilaesperanca.exemplo'`);
    await tx.execute(
      (await import('drizzle-orm'))
        .sql`UPDATE users SET municipality_id='3304557' WHERE id IN ('staff-gestao','admin-local') AND role IN ('staff','admin') AND municipality_id IS NULL`,
    );
    // Enrich only the three presentation accounts without replacing existing portraits.
    await tx.execute(sql`UPDATE users SET avatar = CASE id
      WHEN 'citizen-ana' THEN '/api/demo-media/avatar-ana.jpg'
      WHEN 'staff-gestao' THEN '/api/demo-media/avatar-gestao.jpg'
      WHEN 'admin-local' THEN '/api/demo-media/avatar-admin.jpg'
      END WHERE id IN ('citizen-ana', 'staff-gestao', 'admin-local') AND (avatar IS NULL OR avatar = '')`);
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
      images: ['/api/demo-media/lighting.jpg'],
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
          actor: 'Beatriz Arantes',
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
        territory: {
          scope: 'location',
          neighborhood: 'Centro',
          location: plazaLocation,
        },
        id: 'proposal-praca',
        kind: 'proposal',
        images: ['/api/demo-media/park-shade.jpg'],
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
        territory: {
          scope: 'location',
          neighborhood: 'Centro',
          location: plazaLocation,
        },
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
        evidence: ['/api/demo-media/sidewalk.jpg'],
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
        images: ['/api/demo-media/accessible-path.jpg'],
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
    const more = cityExamples(at);
    for (const example of [...more.occurrences, ...more.proposals]) {
      await tx
        .insert(records)
        .values({
          id: example.id,
          municipalityId,
          kind: 'kind' in example ? example.kind : 'occurrence',
          authorId: 'kind' in example ? example.createdBy : example.reportedBy,
          data: example,
        })
        .onConflictDoNothing();
    }
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
    const scenarioRecords = [
      occurrence,
      ...civic.filter((item) => item.kind === 'proposal'),
      ...more.occurrences,
      ...more.proposals,
    ];
    for (const [index, item] of scenarioRecords.entries()) {
      await tx
        .insert(demoEngagement)
        .values({
          recordId: item.id,
          views: 128 + ((index * 173) % 1700),
          supports: 9 + ((index * 19) % 117),
        })
        .onConflictDoNothing();
    }
    // Enrich existing demo records atomically, preserving their state and any
    // resident uploads. Only a missing, null or empty media field is eligible.
    for (const item of [
      occurrence,
      ...civic,
      ...more.occurrences,
      ...more.proposals,
    ]) {
      const field =
        'kind' in item && item.kind === 'action' ? 'evidence' : 'images';
      const media =
        'images' in item
          ? item.images
          : 'evidence' in item
            ? item.evidence
            : undefined;
      if (!media?.length) continue;
      await tx.execute(sql`
        UPDATE records
        SET data = jsonb_set(data, ARRAY[${field}]::text[], ${JSON.stringify(media)}::jsonb)
        WHERE id = ${item.id} AND municipality_id = ${municipalityId}
          AND kind = ${'kind' in item ? item.kind : 'occurrence'}
          AND (data -> ${field} IS NULL OR data -> ${field} = 'null'::jsonb OR data -> ${field} = '[]'::jsonb OR (jsonb_array_length(data -> ${field}) = 1 AND data -> ${field} ->> 0 LIKE '/api/demo-media/%'))
      `);
    }
  });
}
