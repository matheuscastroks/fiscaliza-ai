import { BigQuery } from '@google-cloud/bigquery';

const bq = new BigQuery({ projectId: 'gen-lang-client-0798661946' });

async function diagnose() {
  console.log('--- 1. Querying MIN and MAX data_particao ---');
  const minMaxQuery = `
    SELECT
      MIN(data_particao) as min_part,
      MAX(data_particao) as max_part,
      COUNT(1) as total_rows
    FROM \`datario.adm_central_atendimento_1746.chamado\`
  `;
  const [dryRun1] = await bq.createQueryJob({ query: minMaxQuery, dryRun: true });
  console.log('Dry-run bytes:', dryRun1.metadata.statistics.totalBytesProcessed);
  const [minMaxRows] = await bq.query({ query: minMaxQuery, maximumBytesBilled: '500000000' });
  console.log('Min/Max partition dates:', JSON.stringify(minMaxRows[0]));

  const maxPart = minMaxRows[0].max_part.value || minMaxRows[0].max_part;
  console.log(`\n--- 2. Examining latest partition: ${maxPart} ---`);

  // Count and coordinate completeness in latest partition
  const statsQuery = `
    SELECT
      COUNT(1) as partition_total,
      COUNTIF(latitude IS NOT NULL AND longitude IS NOT NULL) as with_coords,
      COUNTIF(latitude IS NULL OR longitude IS NULL) as null_coords,
      COUNTIF(latitude = 0 OR longitude = 0) as zero_coords,
      COUNTIF(latitude BETWEEN -23.1 AND -22.7 AND longitude BETWEEN -43.8 AND -43.1) as valid_rio_coords,
      COUNT(DISTINCT id_chamado) as unique_ids,
      COUNT(DISTINCT tipo) as distinct_types,
      COUNT(DISTINCT subtipo) as distinct_subtypes,
      COUNT(DISTINCT id_bairro) as distinct_bairros,
      MIN(data_inicio) as earliest_start,
      MAX(data_inicio) as latest_start
    FROM \`datario.adm_central_atendimento_1746.chamado\`
    WHERE data_particao = '${maxPart}'
  `;
  const [dryRun2] = await bq.createQueryJob({ query: statsQuery, dryRun: true });
  console.log('Dry-run bytes for partition stats:', dryRun2.metadata.statistics.totalBytesProcessed);
  const [statsRows] = await bq.query({ query: statsQuery, maximumBytesBilled: '500000000' });
  console.log('Partition stats:', JSON.stringify(statsRows[0], null, 2));

  // Top types
  const typesQuery = `
    SELECT
      tipo,
      COUNT(1) as count
    FROM \`datario.adm_central_atendimento_1746.chamado\`
    WHERE data_particao = '${maxPart}'
    GROUP BY tipo
    ORDER BY count DESC
    LIMIT 10
  `;
  const [typeRows] = await bq.query({ query: typesQuery, maximumBytesBilled: '500000000' });
  console.log('\nTop 10 Types in latest partition:\n', JSON.stringify(typeRows, null, 2));

  // Top situations and statuses
  const statusQuery = `
    SELECT
      status,
      situacao,
      tipo_situacao,
      COUNT(1) as count
    FROM \`datario.adm_central_atendimento_1746.chamado\`
    WHERE data_particao = '${maxPart}'
    GROUP BY status, situacao, tipo_situacao
    ORDER BY count DESC
    LIMIT 10
  `;
  const [statusRows] = await bq.query({ query: statusQuery, maximumBytesBilled: '500000000' });
  console.log('\nTop 10 Status / Situacao in latest partition:\n', JSON.stringify(statusRows, null, 2));

  // Sample row
  const sampleQuery = `
    SELECT
      c.id_chamado,
      c.data_inicio,
      c.data_fim,
      c.tipo,
      c.subtipo,
      c.status,
      c.situacao,
      c.tipo_situacao,
      c.justificativa_status,
      c.tempo_prazo,
      c.prazo_unidade,
      c.dentro_prazo,
      c.latitude,
      c.longitude,
      c.id_bairro,
      b.nome as nome_bairro,
      b.subprefeitura
    FROM \`datario.adm_central_atendimento_1746.chamado\` c
    LEFT JOIN \`datario.dados_mestres.bairro\` b ON c.id_bairro = b.id_bairro
    WHERE c.data_particao = '${maxPart}'
      AND c.latitude IS NOT NULL
    LIMIT 3
  `;
  const [sampleRows] = await bq.query({ query: sampleQuery, maximumBytesBilled: '500000000' });
  console.log('\nSample Rows (Joined with Bairro):\n', JSON.stringify(sampleRows, null, 2));
}

diagnose().catch(err => {
  console.error('Diagnostic error:', err);
  process.exit(1);
});

async function checkWeekly() {
  console.log('\n--- 3. Weekly Volume (Recent 7 days) ---');
  const query = `
    SELECT
      data_particao,
      COUNT(1) as total,
      COUNTIF(latitude IS NOT NULL) as with_coords
    FROM \`datario.adm_central_atendimento_1746.chamado\`
    WHERE data_particao >= '2026-09-14'
    GROUP BY data_particao
    ORDER BY data_particao DESC
  `;
  const [rows] = await bq.query({ query, maximumBytesBilled: '300000000' });
  console.log(JSON.stringify(rows, null, 2));
}

checkWeekly().catch(console.error);
