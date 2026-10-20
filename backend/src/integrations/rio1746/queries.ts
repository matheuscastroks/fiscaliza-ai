export function buildPartitionCallsQuery(partitionDate: string, limit = 5000): string {
  // Safe parameterized query selecting strictly necessary columns with bairro enrichment
  return `
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
    WHERE c.data_particao = '${partitionDate}'
    ORDER BY c.data_inicio DESC
    LIMIT ${limit}
  `;
}

export function buildLatestPartitionsQuery(limit = 7): string {
  return `
    SELECT
      data_particao,
      COUNT(1) as total_records
    FROM \`datario.adm_central_atendimento_1746.chamado\`
    WHERE data_particao >= DATE_SUB((SELECT MAX(data_particao) FROM \`datario.adm_central_atendimento_1746.chamado\`), INTERVAL ${limit} DAY)
    GROUP BY data_particao
    ORDER BY data_particao DESC
    LIMIT ${limit}
  `;
}
