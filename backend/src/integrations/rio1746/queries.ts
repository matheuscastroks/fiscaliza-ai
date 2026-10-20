export interface ParameterizedBigQuery {
  query: string;
  params: Record<string, string | number>;
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function assertValidPartitionDate(partitionDate: string): string {
  const trimmed = partitionDate.trim();
  if (!ISO_DATE_REGEX.test(trimmed)) {
    throw new Error(`Invalid partition date format: "${partitionDate}". Expected YYYY-MM-DD.`);
  }
  const parsed = new Date(`${trimmed}T00:00:00Z`);
  if (isNaN(parsed.getTime()) || !parsed.toISOString().startsWith(trimmed)) {
    throw new Error(`Invalid calendar date for partition: "${partitionDate}".`);
  }
  return trimmed;
}

export function assertSafeBoundedInt(
  value: number,
  min: number,
  max: number,
  label: string,
): number {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`Invalid ${label}: ${value}. Must be an integer between ${min} and ${max}.`);
  }
  return value;
}

export function buildPartitionCallsQuery(
  partitionDate: string,
  limit = 5000,
  offset = 0,
): ParameterizedBigQuery {
  const safePartition = assertValidPartitionDate(partitionDate);
  const safeLimit = assertSafeBoundedInt(limit, 1, 50000, 'limit');
  const safeOffset = assertSafeBoundedInt(offset, 0, 1000000, 'offset');

  return {
    query: `
      SELECT
        c.id_chamado,
        c.data_inicio,
        c.data_fim,
        c.id_bairro,
        b.nome as nome_bairro,
        b.subprefeitura,
        c.id_logradouro,
        c.nome_unidade_organizacional,
        c.categoria,
        c.tipo,
        c.subtipo,
        c.status,
        c.situacao,
        c.tipo_situacao,
        c.justificativa_status,
        c.data_alvo_finalizacao,
        c.tempo_prazo,
        c.prazo_unidade,
        c.dentro_prazo,
        c.latitude,
        c.longitude,
        c.data_particao,
        c.updated_at
      FROM \`datario.adm_central_atendimento_1746.chamado\` c
      LEFT JOIN \`datario.dados_mestres.bairro\` b ON c.id_bairro = b.id_bairro
      WHERE c.data_particao = DATE(@partitionDate)
      ORDER BY c.data_inicio DESC, c.id_chamado ASC
      LIMIT @limit
      OFFSET @offset
    `,
    params: {
      partitionDate: safePartition,
      limit: safeLimit,
      offset: safeOffset,
    },
  };
}

export function buildLatestPartitionsQuery(limit = 7): ParameterizedBigQuery {
  const safeLimit = assertSafeBoundedInt(limit, 1, 90, 'limit');
  return {
    query: `
      SELECT
        data_particao,
        COUNT(1) as total_records
      FROM \`datario.adm_central_atendimento_1746.chamado\`
      WHERE data_particao >= DATE_SUB(
        (SELECT MAX(data_particao) FROM \`datario.adm_central_atendimento_1746.chamado\`),
        INTERVAL @days DAY
      )
      GROUP BY data_particao
      ORDER BY data_particao DESC
      LIMIT @limit
    `,
    params: {
      days: safeLimit,
      limit: safeLimit,
    },
  };
}
